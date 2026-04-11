import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAnthropicClient, MODELS } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120; // Generous timeout — runs async, not user-blocking

const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

interface DebateRequest {
  assessment_id: string;
  startup_context: string; // The serialized answers/context used for scoring
  primary_score: number;    // The original QuickAssess score we're debating
}

interface ArbiterOutput {
  score: number;
  gap_1: string;
  gap_2: string;
  investor_take: string;
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
    }

    const { assessment_id, startup_context, primary_score }: DebateRequest = await req.json();

    if (!assessment_id || !startup_context) {
      return NextResponse.json({ error: "assessment_id and startup_context are required." }, { status: 400 });
    }

    const anthropic = getAnthropicClient();

    // ── Run Bull and Bear agents in PARALLEL ──────────────────────────────────
    const [bullMsg, bearMsg] = await Promise.all([
      // Agent A: Optimistic Bull VC
      anthropic.messages.create({
        model: MODELS.ANALYSIS,
        max_tokens: 600,
        temperature: 0.4,
        system: `You are an optimistic early-stage venture capitalist known for making contrarian bets on underdog founders.
Your job is to argue WHY this startup deserves a high Fundability Score (70+).
Focus on: hidden strengths, market timing, team potential, and asymmetric upside.
Be specific, passionate, and cite evidence from the founder's answers. Max 4 sentences.`,
        messages: [
          {
            role: "user",
            content: `Argue the BULL CASE for this startup:\n\n${startup_context}\n\nPrimary score from automated system: ${primary_score}/100. Challenge that if you think it's too low.`,
          },
        ],
      }),

      // Agent B: Skeptical Bear Analyst
      anthropic.messages.create({
        model: MODELS.ANALYSIS,
        max_tokens: 600,
        temperature: 0.4,
        system: `You are a rigorous due diligence analyst at a top-tier institutional fund.
Your job is to argue WHY this startup has critical gaps that make it unfundable TODAY.
Focus on: unvalidated assumptions, missing metrics, team gaps, and competitive vulnerabilities.
Be blunt, precise, and cite specific deficiencies from the founder's answers. Max 4 sentences.`,
        messages: [
          {
            role: "user",
            content: `Argue the BEAR CASE against this startup:\n\n${startup_context}\n\nPrimary score from automated system: ${primary_score}/100. Challenge that if you think it's too high.`,
          },
        ],
      }),
    ]);

    const bullArgument = bullMsg.content[0].type === "text" ? bullMsg.content[0].text : "";
    const bearArgument = bearMsg.content[0].type === "text" ? bearMsg.content[0].text : "";

    // ── Arbiter: Synthesize Final Consensus ───────────────────────────────────
    const arbiterMsg = await anthropic.messages.create({
      model: MODELS.ANALYSIS,
      max_tokens: 500,
      temperature: 0.1,
      system: `You are a neutral arbiter between two investment analysts. Synthesize their views into a final recommendation. Return ONLY valid JSON. No markdown.`,
      messages: [
        {
          role: "user",
          content: `BULL CASE:\n${bullArgument}\n\nBEAR CASE:\n${bearArgument}\n\nOriginal automated score: ${primary_score}/100\n\nBased on these two arguments, determine:\n1. A final Fundability Score (0-100) weighted by the quality of evidence in each argument.\n2. The top 2 specific gaps the founder must address.\n3. A 3-sentence investor take that acknowledges both views.\n\nReturn this exact JSON structure:\n{\n  "score": <int>,\n  "gap_1": "<specific gap>",\n  "gap_2": "<specific gap>",\n  "investor_take": "<3 sentences>"\n}`,
        },
      ],
    });

    const arbiterText =
      arbiterMsg.content[0].type === "text" ? arbiterMsg.content[0].text : "{}";
    const arbiterOutput: ArbiterOutput = JSON.parse(
      arbiterText.replace(/```json/g, "").replace(/```/g, "").trim()
    );

    const deltaFromPrimary = arbiterOutput.score - primary_score;

    // ── Save to score_debates ─────────────────────────────────────────────────
    await supabaseAdmin.from("score_debates").insert({
      assessment_id,
      bull_argument: bullArgument,
      bear_argument: bearArgument,
      arbiter_output: arbiterOutput,
      consensus_score: arbiterOutput.score,
      delta_from_primary: deltaFromPrimary,
    });

    // ── Also log to ai_interaction_logs ───────────────────────────────────────
    await supabaseAdmin.from("ai_interaction_logs").insert({
      assessment_id,
      prompt_version: "debate-v1",
      input_context: startup_context,
      bull_case: bullArgument,
      bear_case: bearArgument,
      final_output: arbiterOutput,
      reasoning_trace: `Bull: ${bullArgument}\n\nBear: ${bearArgument}\n\nArbiter: ${JSON.stringify(arbiterOutput)}`,
      model_used: MODELS.ANALYSIS,
      tokens_used:
        (bullMsg.usage?.input_tokens || 0) +
        (bullMsg.usage?.output_tokens || 0) +
        (bearMsg.usage?.input_tokens || 0) +
        (bearMsg.usage?.output_tokens || 0) +
        (arbiterMsg.usage?.input_tokens || 0) +
        (arbiterMsg.usage?.output_tokens || 0),
    });

    return NextResponse.json({
      success: true,
      consensus_score: arbiterOutput.score,
      delta_from_primary: deltaFromPrimary,
      gap_1: arbiterOutput.gap_1,
      gap_2: arbiterOutput.gap_2,
      investor_take: arbiterOutput.investor_take,
    });
  } catch (err: unknown) {
    console.error("[Debate Engine Error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
