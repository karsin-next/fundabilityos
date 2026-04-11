import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAnthropicClient, MODELS } from "@/lib/ai";
import { sendTelegramAlert } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 300;

// ── Budget Guard ───────────────────────────────────────────────────────────────
// Pause all background jobs if monthly AI spend exceeds $10 (1000 cents)
const MONTHLY_BUDGET_CENTS = 1000;

// ── Batch Configuration ────────────────────────────────────────────────────────
const PROFILES_PER_BATCH = 20;
const CALIBRATION_THRESHOLD_PCT = 15; // if >15% score above 75, tighten

const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

// ── Helper: estimate cost in cents (Sonnet ≈ $3/M input + $15/M output) ────────
function estimateCostCents(inputTokens: number, outputTokens: number): number {
  return Math.round((inputTokens * 0.0003 + outputTokens * 0.0015) * 100);
}

// ── Helper: check monthly AI spend from calibration_log ───────────────────────
async function getMonthlySpendCents(): Promise<number> {
  if (!supabaseAdmin) return 0;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data } = await supabaseAdmin
    .from("calibration_log")
    .select("estimated_cost_cents")
    .gte("created_at", monthStart.toISOString());

  return (data || []).reduce((sum, row) => sum + (row.estimated_cost_cents || 0), 0);
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
    }

    // Auth check for cron
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    // ── Budget Gate ────────────────────────────────────────────────────────────
    const monthlySpend = await getMonthlySpendCents();
    if (monthlySpend >= MONTHLY_BUDGET_CENTS) {
      const warning = `⚠️ Budget cap reached. Monthly AI spend: ${(monthlySpend / 100).toFixed(2)} USD. Simulation aborted.`;
      console.warn(warning);
      await supabaseAdmin.from("calibration_log").insert({
        batch_size: PROFILES_PER_BATCH,
        budget_aborted: true,
        estimated_cost_cents: 0,
        run_source: "cron",
        score_distribution: {},
      });
      await sendTelegramAlert(`🚨 <b>FundabilityOS Budget Alert</b>\n${warning}`);
      return NextResponse.json({ aborted: true, reason: warning });
    }

    const anthropic = getAnthropicClient();
    const runSource = req.headers.get("x-run-source") || "cron";

    // ── STEP A: Generate 20 Synthetic Southeast Asian Startup Profiles ─────────
    const generatorPrompt = `Generate exactly ${PROFILES_PER_BATCH} diverse, realistic Southeast Asian early-stage startup profiles in JSON array format.
Each object must include:
- company_name (string)
- industry (string, one of: fintech, edtech, healthtech, agritech, logistics, ecommerce, saas, cleantech)
- stage (string: pre-seed, seed, series-a)
- founding_team (string: 1-2 sentences describing team background)
- revenue_status (string: pre-revenue, <$10k MRR, $10k-$50k MRR, $50k+ MRR)
- hidden_trait (string: describe ONE specific hidden strength OR flaw that a casual observer might miss)

Return ONLY a valid JSON array. No markdown, no preamble.`;

    const genMsg = await anthropic.messages.create({
      model: MODELS.ANALYSIS,
      max_tokens: 3000,
      temperature: 0.8, // High temperature for diversity
      messages: [{ role: "user", content: generatorPrompt }],
    });
    const genTokens = genMsg.usage;
    const genText = genMsg.content[0].type === "text" ? genMsg.content[0].text : "[]";
    const profiles = JSON.parse(genText.replace(/```json/g, "").replace(/```/g, "").trim());

    // ── STEP B: Score each profile using the 8-dimension FundabilityOS rubric ──
    const evaluatorPrompt = `You are a senior VC analyst. Score each of these ${PROFILES_PER_BATCH} Southeast Asian startup profiles using the FundabilityOS 8-dimension rubric.
Dimensions (max points each): Problem Severity (15), Solution Differentiation (15), Market Size (10), Revenue Model (20), Customer Traction (10), Team Strength (15), Investor Readiness (10), Execution Risk (5).

PROFILES:
${JSON.stringify(profiles, null, 2)}

For each profile, return a JSON object with:
- company_name (string)
- score (int 0-100)
- justification (max 2 sentences, brutally honest investor perspective)

Return ONLY a valid JSON array of ${PROFILES_PER_BATCH} score objects. No markdown.`;

    const evalMsg = await anthropic.messages.create({
      model: MODELS.ANALYSIS,
      max_tokens: 4000,
      temperature: 0.1, // Low for consistent scoring
      messages: [{ role: "user", content: evaluatorPrompt }],
    });
    const evalTokens = evalMsg.usage;
    const evalText = evalMsg.content[0].type === "text" ? evalMsg.content[0].text : "[]";
    const scoredProfiles: { company_name: string; score: number; justification: string }[] =
      JSON.parse(evalText.replace(/```json/g, "").replace(/```/g, "").trim());

    // ── Compute Score Distribution ─────────────────────────────────────────────
    const distribution = { "0-24": 0, "25-49": 0, "50-74": 0, "75-100": 0 };
    let above75 = 0;
    for (const p of scoredProfiles) {
      if (p.score <= 24) distribution["0-24"]++;
      else if (p.score <= 49) distribution["25-49"]++;
      else if (p.score <= 74) distribution["50-74"]++;
      else { distribution["75-100"]++; above75++; }
    }
    const pctAbove75 = (above75 / scoredProfiles.length) * 100;

    // ── STEP C: Self-Calibration ───────────────────────────────────────────────
    let calibrationTriggered = false;
    let updatedPromptSnippet: string | null = null;

    if (pctAbove75 > CALIBRATION_THRESHOLD_PCT) {
      calibrationTriggered = true;

      const calibrationPrompt = `You are the FundabilityOS scoring calibrator.
The current scoring logic produced these results across ${PROFILES_PER_BATCH} synthetic profiles:
- ${pctAbove75.toFixed(1)}% scored above 75 (threshold is ${CALIBRATION_THRESHOLD_PCT}%)
- Distribution: ${JSON.stringify(distribution)}

This suggests score inflation. Realistic VC funnel data shows only 5-10% of early-stage startups are genuinely investor-ready.

Rewrite a concise 3-5 sentence scoring instruction (a "strictness amendment") that, when prepended to the existing scoring system prompt, will cause the AI to be more conservative. 
Focus on: requiring concrete evidence of traction, penalising assumption-based claims, and demanding specificity in team qualifications.

Return ONLY the new instruction text. No JSON, no preamble.`;

      const calibMsg = await anthropic.messages.create({
        model: MODELS.ANALYSIS,
        max_tokens: 500,
        temperature: 0.1,
        messages: [{ role: "user", content: calibrationPrompt }],
      });

      updatedPromptSnippet =
        calibMsg.content[0].type === "text" ? calibMsg.content[0].text.trim() : null;

      // Optionally update the active prompt version with the calibration note
      if (updatedPromptSnippet) {
        const { data: activeVersion } = await supabaseAdmin
          .from("prompt_versions")
          .select("id, prompt_text")
          .eq("is_active", true)
          .single();

        if (activeVersion) {
          const amendedPrompt = `[CALIBRATION AMENDMENT — ${new Date().toISOString().slice(0, 10)}]\n${updatedPromptSnippet}\n\n---\n${activeVersion.prompt_text}`;
          await supabaseAdmin
            .from("prompt_versions")
            .update({ prompt_text: amendedPrompt })
            .eq("id", activeVersion.id);
        }
      }

      await sendTelegramAlert(
        `⚖️ <b>FundabilityOS Calibration Triggered</b>\n${pctAbove75.toFixed(1)}% of ${PROFILES_PER_BATCH} synthetic profiles scored >75 (threshold: ${CALIBRATION_THRESHOLD_PCT}%).\nScoring prompt has been automatically tightened.`
      );
    }

    // ── Estimate total cost and log run ───────────────────────────────────────
    const totalInputTokens = (genTokens?.input_tokens || 0) + (evalTokens?.input_tokens || 0);
    const totalOutputTokens = (genTokens?.output_tokens || 0) + (evalTokens?.output_tokens || 0);
    const costCents = estimateCostCents(totalInputTokens, totalOutputTokens);

    await supabaseAdmin.from("calibration_log").insert({
      batch_size: PROFILES_PER_BATCH,
      profiles_generated: scoredProfiles.length,
      score_distribution: distribution,
      pct_above_75: pctAbove75,
      calibration_triggered: calibrationTriggered,
      updated_prompt_snippet: updatedPromptSnippet,
      estimated_cost_cents: costCents,
      budget_aborted: false,
      run_source: runSource,
    });

    return NextResponse.json({
      success: true,
      batch_size: PROFILES_PER_BATCH,
      pct_above_75: pctAbove75.toFixed(1),
      distribution,
      calibration_triggered: calibrationTriggered,
      estimated_cost_usd: (costCents / 100).toFixed(4),
    });
  } catch (err: unknown) {
    console.error("[Simulation Cron Error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
