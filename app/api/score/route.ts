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
            let magicLinkCreated = false;
            let magicLinkUrl = "";

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
                } else {
                  // User does NOT exist in Supabase at all! Create user using generateLink!
                  const origin = baseUrl;
                  const callbackUrl = `${origin}/api/auth/callback`;
                  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
                    type: "magiclink",
                    email: userEmail,
                    options: {
                      redirectTo: callbackUrl,
                    },
                  });

                  if (!linkErr && linkData) {
                    magicLinkCreated = true;
                    const { properties, user: newUser } = linkData;
                    const actionLink = properties.action_link;
                    magicLinkUrl = `${origin}/auth/verify?url=${encodeURIComponent(actionLink)}`;
                    
                    // Upsert a profile for this new user
                    if (newUser) {
                      await supabaseAdmin.from("profiles").upsert({
                        id: newUser.id,
                        email: userEmail,
                        full_name: "",
                        role: "startup",
                      });
                      finalUserId = newUser.id;
                    }
                  } else {
                    console.error("[Auto Magic Link Generation Error]:", linkErr);
                  }
                }
              }
            }

            // 1.5 MERGE GUEST QUICKASSESS ANSWERS INTO USER'S CHECKLIST GATES
            if (finalUserId && answers) {
              try {
                const standardModules = [
                  { id: "1-problem", title: "Problem & Hypothesis" },
                  { id: "2-customer", title: "Customer Persona" },
                  { id: "3-competitor", title: "Competitor Analysis" },
                  { id: "4-product", title: "Product Readiness" },
                  { id: "5-market", title: "Market Opportunity" },
                  { id: "6-pmf", title: "Product‑Market Fit & Traction" },
                  { id: "7-revenue", title: "Revenue Model Explorer" },
                  { id: "8-team", title: "Team Composition Audit" },
                  { id: "9-financial-snapshot", title: "Financial Snapshot" },
                  { id: "10-fundraising-ask", title: "Fundraising Ask" }
                ];

                for (const mod of standardModules) {
                  // Check if they already have answers in the DB
                  const { data: existing } = await supabaseAdmin
                    .from("audit_responses")
                    .select("module_id")
                    .eq("user_id", finalUserId)
                    .eq("module_id", mod.id)
                    .single();

                  if (!existing) {
                    let label = "";
                    let val = 80;

                    if (mod.id === "1-problem" && answers.problem_description) {
                      label = answers.problem_description;
                    } else if (mod.id === "2-customer" && answers.target_customer) {
                      label = answers.target_customer;
                    } else if (mod.id === "3-competitor") {
                      label = `Competitors: ${Array.isArray(answers.main_competitors) ? answers.main_competitors.join(", ") : (answers.main_competitors || "None")}. Moat: ${answers.unfair_advantage || "None"}`;
                    } else if (mod.id === "4-product" && answers.product_stage) {
                      label = `Product Stage: ${answers.product_stage}`;
                    } else if (mod.id === "5-market" && answers.market_size_description) {
                      label = answers.market_size_description;
                    } else if (mod.id === "6-pmf" && answers.customer_acquisition) {
                      label = `Acquisition: ${answers.customer_acquisition}`;
                    } else if (mod.id === "7-revenue") {
                      label = answers.is_pre_revenue ? "Pre-revenue" : `MRR: $${answers.monthly_revenue_usd || 0}`;
                    } else if (mod.id === "8-team" && answers.team_size) {
                      label = `Team Size: ${answers.team_size} members.`;
                    } else if (mod.id === "9-financial-snapshot") {
                      label = `Monthly Revenue: $${answers.monthly_revenue_usd || 0}, Monthly Burn: $${answers.burn_rate_usd || 0}, Runway: ${answers.runway_months || 0} months`;
                    } else if (mod.id === "10-fundraising-ask") {
                      label = `Target Raise: $${answers.target_raise_usd || 0}, Round: ${answers.target_round || "seed"}, Milestones: ${answers.milestones_with_raise || "None"}`;
                    }

                    if (label) {
                      const completedAnswer = {
                        questionTitle: `QuickAssess: ${mod.title}`,
                        selectedOptionId: "opt-quickassess",
                        selectedOptionLabel: label,
                        openText: label,
                        scoreValue: val
                      };

                      await supabaseAdmin.from("audit_responses").upsert({
                        user_id: finalUserId,
                        module_id: mod.id,
                        selected_option: "DYNAMIC_CHAIN",
                        open_text: JSON.stringify({ answers: [completedAnswer] }),
                        score_value: val,
                        updated_at: new Date().toISOString()
                      }, { onConflict: "user_id,module_id" });
                    }
                  }
                }
              } catch (mergeErr) {
                console.error("[Guest Merge Fail]:", mergeErr);
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
                  if (magicLinkCreated && magicLinkUrl) {
                    const fromEmail = process.env.RESEND_FROM_EMAIL || "hello@nextblaze.asia";
                    const { error: emailError } = await resend.emails.send({
                      from: `FundabilityOS <${fromEmail}>`,
                      to: userEmail,
                      subject: `Your Fundability Audit is Ready (Score: ${score}/100)`,
                      html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #edf2f7; border-radius: 8px; background-color: #022f42; color: white;">
                          <h1 style="color: #ffd800; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">NextBlaze</h1>
                          <p style="color: #b0d0e0; font-size: 16px; font-weight: bold; margin-bottom: 24px; text-transform: uppercase;">Your Fundability Assessment is Complete</p>
                          
                          <div style="background-color: rgba(255,255,255,0.05); padding: 24px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 28px;">
                            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #ffd800;">Your Fundability Score</div>
                            <div style="font-size: 64px; font-weight: 900; color: #ffd800; margin: 8px 0; font-family: monospace;">${score}<span style="font-size: 18px; opacity: 0.5;">/100</span></div>
                            <div style="font-size: 14px; font-weight: 900; color: white; text-transform: uppercase; letter-spacing: 0.05em;">Band: ${result.band}</div>
                          </div>

                          <p style="color: #b0d0e0; font-size: 14px; line-height: 1.6; margin-bottom: 28px;">
                            We have automatically created your account and loaded your answers into your interactive checklist. Click below to sign in and view your customized 30-Day Growth Plan and AI gaps analysis.
                          </p>

                          <a href="${magicLinkUrl}" style="display: inline-block; background-color: #ffd800; color: #022f42; font-size: 13px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; padding: 18px 36px; border-radius: 2px;">
                            Access My Full Dashboard
                          </a>

                          <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
                            This magic link is protected and expires in 1 hour.
                            <br />
                            Link not working? Paste this into your browser: <br />
                            <span style="word-break: break-all; color: #ffd800;">${magicLinkUrl}</span>
                          </p>
                        </div>
                      `
                    });
                    if (emailError) console.error("[Resend Error]:", emailError);
                    else console.log("[Resend] Guest Magic Link email sent to:", userEmail);
                  } else {
                    const { error: emailError } = await resend.emails.send({
                      from: process.env.RESEND_FROM_EMAIL || "hello@nextblaze.asia",
                      to: userEmail,
                      subject: `Your Fundability Score is ${score}/100`,
                      react: DiagnosticCompleteEmail({ score, band: result.band, reportUrl }) as React.ReactElement,
                    });
                    if (emailError) console.error("[Resend Error]:", emailError);
                    else console.log("[Resend] Standard email sent to:", userEmail);
                  }
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

          if (magicLinkCreated && magicLinkUrl) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, magicLinkUrl })}\n\n`));
          } else {
            controller.enqueue(encoder.encode('data: {"done": true}\n\n'));
          }
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
