import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAnthropicClient, MODELS } from "@/lib/ai";
import { SCORING_SYSTEM_PROMPT } from "@/lib/prompts";
import { trackEvent } from "@/lib/analytics";
import { sendTelegramAlert } from "@/lib/telegram";
import { resend } from "@/lib/resend";
import DiagnosticCompleteEmail from "@/components/emails/DiagnosticCompleteEmail";

export const runtime = "nodejs";

const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetch active logic overrides and check if any trigger_text appears in the answers.
 * Returns a list of correction_rule strings that matched.
 */
async function getMatchingOverrides(answersJson: string): Promise<string[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data } = await supabaseAdmin
      .from("logic_overrides")
      .select("id, trigger_text, correction_rule, applied_count")
      .eq("is_active", true);

    if (!data) return [];

    const lowerAnswers = answersJson.toLowerCase();
    const matched: { id: string; rule: string }[] = [];

    for (const override of data) {
      if (lowerAnswers.includes(override.trigger_text)) {
        matched.push({ id: override.id, rule: override.correction_rule });
        // Fire-and-forget: increment applied_count
        void supabaseAdmin
          .from("logic_overrides")
          .update({ applied_count: (override.applied_count || 0) + 1 })
          .eq("id", override.id)
          .then(() => {}, () => {});
      }
    }
    return matched.map((m) => m.rule);
  } catch {
    return [];
  }
}

/**
 * Fetch the active prompt version name for logging.
 */
async function getActivePromptVersion(): Promise<string> {
  if (!supabaseAdmin) return "v1-baseline";
  try {
    const { data } = await supabaseAdmin
      .from("prompt_versions")
      .select("version_name")
      .eq("is_active", true)
      .single();
    return data?.version_name || "v1-baseline";
  } catch {
    return "v1-baseline";
  }
}

/**
 * Log the interaction asynchronously (non-blocking).
 */
async function logInteraction(payload: {
  assessment_id: string;
  prompt_version: string;
  input_context: string;
  final_output: object;
  reasoning_trace: string;
  tokens_used: number;
}) {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from("ai_interaction_logs").insert({
      ...payload,
      model_used: MODELS.ANALYSIS,
    });
  } catch (e) {
    console.error("[AI Log Error]:", e);
  }
}

/**
 * Fire debate engine as a truly async background task (fire-and-forget).
 * The user's stream is NEVER delayed by this.
 */
function fireDebateEngine(assessmentId: string, context: string, primaryScore: number) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

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
    const { answers, sessionId, userId, userEmail } = await req.json();

    if (!answers) {
      return new Response(JSON.stringify({ error: "answers is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const answersJson = JSON.stringify(answers, null, 2);
    const assessmentId = sessionId || crypto.randomUUID();

    // ── Fetch context: overrides + prompt version ─────────────────────────────
    const [matchedOverrides, promptVersion] = await Promise.all([
      getMatchingOverrides(answersJson),
      getActivePromptVersion(),
    ]);

    // ── Build system prompt with any applicable correction rules ─────────────
    let systemPrompt = SCORING_SYSTEM_PROMPT;
    if (matchedOverrides.length > 0) {
      const overrideBlock = matchedOverrides
        .map((rule, i) => `[Expert Override #${i + 1}]: ${rule}`)
        .join("\n");
      systemPrompt = `${overrideBlock}\n\n---\n\n${systemPrompt}`;
    }

    const anthropic = getAnthropicClient();
    const prompt = `Here is the founder's interview data. Score this startup according to the rubric.

INTERVIEW DATA:
${answersJson}

Remember: output ONLY the JSON schema. No preamble, no explanation.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        let totalTokens = 0;

        try {
          const anthropicStream = await anthropic.messages.stream({
            model: MODELS.ANALYSIS,
            max_tokens: 2500,
            temperature: 0.1,
            system: systemPrompt,
            messages: [{ role: "user", content: prompt }],
          });

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const text = chunk.delta.text;
              fullResponse += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`)
              );
            }
          }

          // ── Post-stream processing (non-blocking for the stream closure) ───
          try {
            const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0]);
              const score: number = result.score || 0;
              const reportId = crypto.randomUUID();
              const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : "http://localhost:3000";
              const reportUrl = `${baseUrl}/report/${reportId}`;

              // 1. Ensure session exists (must be first for foreign keys)
              if (supabaseAdmin) {
                let finalUserId = userId;

                // SMART LINKING: If userId is missing but we have an email, look up the user
                if (!finalUserId && userEmail) {
                  const { data: profile } = await supabaseAdmin
                    .from("profiles")
                    .select("id")
                    .eq("email", userEmail)
                    .single();
                  if (profile) finalUserId = profile.id;
                }

                if (!sessionId) {
                  const { error: sessionErr } = await supabaseAdmin.from("sessions").insert({
                    id: assessmentId,
                    user_id: finalUserId || null,
                    input_method: "interview",
                    status: "completed",
                    started_at: new Date().toISOString(),
                    completed_at: new Date().toISOString()
                  });
                  if (sessionErr && sessionErr.code !== '23505') console.error("Session Insert Error:", sessionErr);
                } else {
                  const { error: sessionUpdateErr } = await supabaseAdmin.from("sessions").update({ 
                    status: "completed", 
                    completed_at: new Date().toISOString() 
                  }).eq("id", assessmentId);
                  if (sessionUpdateErr) console.error("Session Update Error:", sessionUpdateErr);
                }
              }

              // 2. Telegram notification
              await sendTelegramAlert(
                `🤖 <b>AI Assessment Completed</b>\nScore: ${score}/100 (${result.band})\nTop Gap: ${result.top_3_gaps?.[0]?.dimension || "N/A"}\nOverrides Applied: ${matchedOverrides.length}`
              ).catch(console.error);

              // 3. Track event
              await trackEvent("assessment_completed", {
                sessionId: assessmentId,
                score,
                eventData: { band: result.band, prompt_version: promptVersion },
              }).catch(console.error);

              // 4. Log interaction with reasoning trace
              await logInteraction({
                assessment_id: assessmentId,
                prompt_version: promptVersion,
                input_context: answersJson,
                final_output: result,
                reasoning_trace: `Prompt version: ${promptVersion}\nOverrides applied: ${matchedOverrides.length}\nFinal JSON:\n${jsonMatch[0]}`,
                tokens_used: totalTokens,
              }).catch(console.error);

              if (supabaseAdmin) {

                // 5. Persist to Reports table
                const { error: reportErr } = await supabaseAdmin
                  .from("reports")
                  .insert({
                    id: reportId,
                    session_id: assessmentId,
                    user_id: userId || null,
                    score: score,
                    band: result.band,
                    component_scores: result.component_scores,
                    top_3_gaps: result.top_3_gaps,
                    financial_snapshot: result.financial_snapshot,
                    team_overview: result.team_overview,
                    investor_loves: result.investor_loves,
                    investor_concerns: result.investor_concerns,
                    action_items: result.action_items,
                    summary_paragraph: result.summary_paragraph,
                  });
                if (reportErr) console.error("Report Insert Error:", reportErr);

                // 6. Update prompt_versions stats
                await supabaseAdmin
                  .from("prompt_versions")
                  .select("completions, avg_score")
                  .eq("version_name", promptVersion)
                  .single()
                  .then(async ({ data: pv }) => {
                    if (!pv) return;
                    const newCompletions = (pv.completions || 0) + 1;
                    const newAvg =
                      ((pv.avg_score || 0) * (newCompletions - 1) + score) / newCompletions;
                    await supabaseAdmin!
                      .from("prompt_versions")
                      .update({ completions: newCompletions, avg_score: newAvg })
                      .eq("version_name", promptVersion);
                  }).catch(console.error);
              }

              // 7. Send Email to User
              if (userEmail) {
                await resend.emails.send({
                  from: process.env.RESEND_FROM_EMAIL || "FundabilityOS <hello@nextblaze.asia>",
                  to: userEmail,
                  subject: `Your Fundability Score is ${score}/100`,
                  react: DiagnosticCompleteEmail({
                    score: score,
                    band: result.band,
                    reportUrl: reportUrl,
                  }) as React.ReactElement,
                }).catch(console.error);
              }

              // 8. Fire debate engine (async, non-blocking)
              fireDebateEngine(assessmentId, answersJson, score);
            }
          } catch (e) {
            console.error("[Scoring Post-Processing Error]:", e);
          }

          controller.enqueue(encoder.encode('data: {"done": true}\n\n'));
          controller.close();
        } catch (err: unknown) {
          console.error("[Scoring Stream Error]:", err);
          const errorMessage =
            err instanceof Error ? err.message : "Scoring stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    console.error("[Scoring API Error]:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
