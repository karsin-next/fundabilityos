import { NextRequest, NextResponse } from "next/server";
import { scoreRateLimit } from "@/lib/ratelimit";
import { createClient } from "@supabase/supabase-js";
import { getAnthropicClient, MODELS } from "@/lib/ai";
import { SCORING_SYSTEM_PROMPT } from "@/lib/prompts";
import { trackEvent } from "@/lib/analytics";
import { sendTelegramAlert } from "@/lib/telegram";
import { resend } from "@/lib/resend";
import DiagnosticCompleteEmail from "@/components/emails/DiagnosticCompleteEmail";
import React from "react";

export const runtime = "nodejs";

import { supabaseAdmin } from "@/lib/supabase/admin";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getMatchingOverrides(answersJson: string): Promise<string[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data } = await supabaseAdmin.from("logic_overrides").select("*").eq("is_active", true);
    if (!data) return [];
    return data.filter((row) => answersJson.toLowerCase().includes(row.trigger_text.toLowerCase())).map((row) => row.correction_rule);
  } catch (e) {
    console.error("[Overrides Error]:", e);
    return [];
  }
}

async function logInteraction(data: any) {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from("analytics_logs").insert(data);
  } catch (e) {
    console.error("[AI Log Error]:", e);
  }
}

function fireDebateEngine(assessmentId: string, context: string, primaryScore: number) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

  fetch(`${baseUrl}/api/debate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assessment_id: assessmentId,
      startup_context: context,
      primary_score: primaryScore,
    }),
  }).catch((e) => console.error("[Debate Fire-and-Forget Error]:", e));
}

// ── Main Route ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success, limit, reset, remaining } = await scoreRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: { "X-RateLimit-Limit": String(limit), "X-RateLimit-Reset": String(reset) } }
      );
    }
    const { answers, sessionId, userId, userEmail } = await req.json();
    const assessmentId = sessionId || crypto.randomUUID();
    const answersJson = JSON.stringify(answers);
    const matchedOverrides = await getMatchingOverrides(answersJson);
    const anthropic = getAnthropicClient();
    const promptVersion = "v1.2-core";

    const systemPrompt = `${SCORING_SYSTEM_PROMPT}\n\nCRITICAL OVERRIDES:\n${
      matchedOverrides.length > 0 
        ? matchedOverrides.join("\n") 
        : "None. Follow standard scoring weights."
    }`;

    const prompt = `Assess this startup diagnostic:\n${answersJson}\n\nRemember: output ONLY JSON.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          const anthropicStream = await anthropic.messages.stream({
            model: MODELS.ANALYSIS,
            max_tokens: 2500,
            temperature: 0.1,
            system: systemPrompt,
            messages: [{ role: "user", content: prompt }],
          });

          for await (const chunk of anthropicStream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              const text = chunk.delta.text;
              fullResponse += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
            }
          }

          // ── PROCESS RESULTS ──
          const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch && supabaseAdmin) {
            const result = JSON.parse(jsonMatch[0]);
            const score: number = result.score || 0;
            const reportId = crypto.randomUUID();
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : "http://localhost:3000");
            const reportUrl = `${baseUrl}/report/${reportId}`;

            // 1. Resolve User ID (Smart Link) & Auto-Create Profile
            let finalUserId = userId;
            if (!finalUserId && userEmail) {
              // Try to find existing profile by email
              const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("email", userEmail).single();
              if (profile) {
                finalUserId = profile.id;
              } else {
                // Try to find auth user by email and create profile
                const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
                const authUser = authUsers?.users?.find((u: any) => u.email === userEmail);
                if (authUser) {
                  await supabaseAdmin.from("profiles").upsert({
                    id: authUser.id,
                    email: userEmail,
                    full_name: authUser.user_metadata?.full_name || "",
                    role: "startup",
                  });
                  finalUserId = authUser.id;
                  console.log(`[Score] Auto-created profile for ${userEmail}`);
                }
              }
            }

            // 2. Save Session & Report (SEQUENTIAL)
            await supabaseAdmin.from("sessions").upsert({
              id: assessmentId,
              user_id: finalUserId || null,
              status: "completed",
              completed_at: new Date().toISOString()
            });

            await supabaseAdmin.from("reports").insert({
              id: reportId,
              session_id: assessmentId,
              user_id: finalUserId || null,
              score,
              band: result.band,
              component_scores: result.component_scores,
              top_3_gaps: result.top_3_gaps,
              financial_snapshot: result.financial_snapshot,
              investor_loves: result.investor_loves,
              investor_concerns: result.investor_concerns,
              action_items: result.action_items,
              summary_paragraph: result.summary_paragraph,
              full_json: result
            });

            // 3. BACKGROUND TASKS (Each isolated so one failure doesn't kill the rest)
            // -- Telegram --
            (async () => {
              try {
                const adminUrl = `${baseUrl}/admin/users?email=${encodeURIComponent(userEmail || "anonymous@user.com")}`;
                await sendTelegramAlert({
                  type: "diagnostic_completed",
                  user_email: userEmail || "anonymous@user.com",
                  score,
                  band: result.band,
                  report_url: adminUrl
                });
              } catch (e) {
                console.error("[BG Telegram Error]:", e);
              }
            })();

            // -- Email --
            (async () => {
              try {
                if (userEmail) {
                  const { error: emailError } = await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || "FundabilityOS <hello@nextblaze.asia>",
                    to: userEmail,
                    subject: `Your Fundability Score is ${score}/100`,
                    react: DiagnosticCompleteEmail({ score, band: result.band, reportUrl }) as React.ReactElement,
                  });
                  if (emailError) console.error("[Resend Error]:", emailError);
                  else console.log("[Resend] Email sent to:", userEmail);
                } else {
                  console.warn("[Resend] No userEmail provided, skipping email.");
                }
              } catch (e) {
                console.error("[BG Email Error]:", e);
              }
            })();

            // -- Analytics & Debate --
            (async () => {
              try {
                await trackEvent("assessment_completed", { sessionId: assessmentId, score, userId: finalUserId });
                await logInteraction({
                  assessment_id: assessmentId,
                  final_output: result,
                  tokens_used: 0
                });
                fireDebateEngine(assessmentId, answersJson, score);
              } catch (e) {
                console.error("[BG Analytics Error]:", e);
              }
            })();
          }

          controller.enqueue(encoder.encode('data: {"done": true}\n\n'));
          controller.close();
        } catch (err: any) {
          console.error("[Stream Error]:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (err: any) {
    console.error("[API Error]:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
