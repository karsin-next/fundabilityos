import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAnthropicClient, MODELS } from "@/lib/ai";
import { SCORING_SYSTEM_PROMPT } from "@/lib/prompts";
import { trackEvent } from "@/lib/analytics";
import { sendTelegramAlert } from "@/lib/telegram";

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
    const { answers, sessionId } = await req.json();

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

              // 1. Track event
              trackEvent("assessment_completed", {
                sessionId: assessmentId,
                score,
                eventData: { band: result.band, prompt_version: promptVersion },
              }).catch(console.error);

              // 2. Telegram notification
              sendTelegramAlert(
                `🤖 <b>AI Assessment Completed</b>\nScore: ${score}/100 (${result.band})\nTop Gap: ${result.top_3_gaps?.[0]?.dimension || "N/A"}\nOverrides Applied: ${matchedOverrides.length}`
              ).catch(console.error);

              // 3. Log interaction with reasoning trace
              logInteraction({
                assessment_id: assessmentId,
                prompt_version: promptVersion,
                input_context: answersJson,
                final_output: result,
                reasoning_trace: `Prompt version: ${promptVersion}\nOverrides applied: ${matchedOverrides.length}\nFinal JSON:\n${jsonMatch[0]}`,
                tokens_used: totalTokens,
              }).catch(console.error);

              // 4. Update prompt_versions stats
              if (supabaseAdmin) {
                supabaseAdmin
                  .from("prompt_versions")
                  .select("completions, avg_score")
                  .eq("version_name", promptVersion)
                  .single()
                  .then(({ data: pv }) => {
                    if (!pv) return;
                    const newCompletions = (pv.completions || 0) + 1;
                    const newAvg =
                      ((pv.avg_score || 0) * (newCompletions - 1) + score) / newCompletions;
                    void supabaseAdmin!
                      .from("prompt_versions")
                      .update({ completions: newCompletions, avg_score: newAvg })
                      .eq("version_name", promptVersion)
                      .then(() => {}, () => {});
                  }, (err) => console.error("[Prompt Stats Update Error]:", err));
              }

              // 5. Fire debate engine (async, non-blocking)
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
