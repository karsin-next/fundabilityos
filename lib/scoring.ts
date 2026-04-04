import { SCORING_SYSTEM_PROMPT } from "@/lib/prompts";
import { getAnthropicClient, MODELS } from "@/lib/ai";
import type { ComponentScores, GapItem } from "@/lib/supabase/types";

export interface ScoringResult {
  score: number;
  band: "Pre-Ready" | "Early-Stage" | "Investor-Ready" | "Top 10%";
  component_scores: ComponentScores;
  top_3_gaps: GapItem[];
  financial_snapshot: {
    monthly_revenue_usd: number;
    burn_rate_usd: number;
    runway_months: number;
    total_raised_usd: number;
  };
  team_overview: {
    size: number;
    composition: string;
    domain_fit: string;
  };
  investor_loves: string[];
  investor_concerns: string[];
  action_items: Array<{ week: 1 | 2 | 3 | 4; action: string; impact: string }>;
  summary_paragraph: string;
}

// ============================================================
// Deterministic rule-based scorer (always runs)
// Used as fallback if Claude is unavailable, and as a sanity check
// ============================================================
export function ruleBasedScore(answers: Record<string, unknown>): ComponentScores {
  // Revenue
  const revenue = Number(answers.monthly_revenue_usd ?? 0);
  let revenueScore = 0;
  if (revenue >= 100_000) revenueScore = 20;
  else if (revenue >= 10_000) revenueScore = 15;
  else if (revenue >= 1_000) revenueScore = 10;
  else if (revenue > 0 || answers.has_loi) revenueScore = 5;

  // Runway
  const runway = Number(answers.runway_months ?? 0);
  let runwayScore = 0;
  if (runway > 12) runwayScore = 15;
  else if (runway >= 6) runwayScore = 10;
  else if (runway >= 3) runwayScore = 5;

  // Team
  const teamSize = Number(answers.team_size ?? 1);
  let teamScore = 3;
  if (teamSize >= 4) teamScore = 10;
  else if (teamSize >= 2) teamScore = 7;

  // Product stage
  const stage = String(answers.product_stage ?? "idea").toLowerCase();
  const stageMap: Record<string, number> = {
    live: 10, beta: 8, prototype: 5, idea: 2,
  };
  const productScore = stageMap[stage] ?? 2;

  // Previous funding
  const fundingType = String(answers.funding_type ?? "none").toLowerCase();
  const fundingMap: Record<string, number> = {
    "series-a": 10, "series-b+": 10, seed: 7, angel: 5,
    "friends & family": 3, none: 0,
  };
  const fundingScore = fundingMap[fundingType] ?? 0;

  return {
    problem_clarity: 8,     // AI-assessed — default mid-score
    revenue: revenueScore,
    runway: runwayScore,
    team_size: teamScore,
    product_stage: productScore,
    previous_funding: fundingScore,
    market_size: 6,         // AI-assessed — default mid-score
    ai_confidence: 6,       // AI-assessed — default mid-score
  };
}

export function scoreToBand(score: number): ScoringResult["band"] {
  if (score >= 80) return "Top 10%";
  if (score >= 60) return "Investor-Ready";
  if (score >= 40) return "Early-Stage";
  return "Pre-Ready";
}

export function totalScore(components: ComponentScores): number {
  return Object.values(components).reduce((a, b) => a + b, 0);
}

// ============================================================
// Claude-powered deep scorer
// ============================================================
export async function claudeScore(
  interviewAnswers: Record<string, unknown>
): Promise<ScoringResult> {
  // Fallback for dev without API key
  if (!process.env.ANTHROPIC_API_KEY) {
    const components = ruleBasedScore(interviewAnswers);
    const score = totalScore(components);
    const band = scoreToBand(score);

    return {
      score,
      band,
      component_scores: components,
      top_3_gaps: buildMockGaps(components),
      financial_snapshot: {
        monthly_revenue_usd: Number(interviewAnswers.monthly_revenue_usd ?? 0),
        burn_rate_usd: Number(interviewAnswers.burn_rate_usd ?? 0),
        runway_months: Number(interviewAnswers.runway_months ?? 0),
        total_raised_usd: Number(interviewAnswers.funding_raised_usd ?? 0),
      },
      team_overview: {
        size: Number(interviewAnswers.team_size ?? 1),
        composition: "Founding team",
        domain_fit: "Assessment requires Claude API key.",
      },
      investor_loves: ["Strong problem definition", "Clear target market"],
      investor_concerns: ["Revenue traction needed", "Runway concern", "Team completeness"],
      action_items: [
        { week: 1, action: "Map your unit economics", impact: "Investors will ask for CAC and LTV" },
        { week: 2, action: "Define your 18-month milestone roadmap", impact: "Shows capital efficiency" },
        { week: 3, action: "Secure 2–3 customer pilots if pre-revenue", impact: "Reduces perceived risk" },
        { week: 4, action: "Clean up cap table and legal structure", impact: "Prevents due diligence surprises" },
      ],
      summary_paragraph: `This startup shows early potential with a ${band.toLowerCase()} fundability profile. The score of ${score}/100 reflects strong fundamentals in some areas with clear gaps to address before approaching institutional investors. Focus on the top 3 gaps above to improve your score meaningfully.`,
    };
  }

  const anthropic = getAnthropicClient();

  const prompt = `Here is the founder's interview data. Score this startup according to the rubric.

INTERVIEW DATA:
${JSON.stringify(interviewAnswers, null, 2)}

Remember: output ONLY the JSON schema. No preamble, no explanation.`;

  const response = await anthropic.messages.create({
    model: MODELS.ANALYSIS,
    max_tokens: 2000,
    system: SCORING_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON — Claude sometimes wraps in ```json```
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Scoring returned invalid JSON");

  const result = JSON.parse(jsonMatch[0]) as ScoringResult;
  return result;
}

// Only show top 3 lowest-scoring dimensions as gaps
function buildMockGaps(components: ComponentScores): GapItem[] {
  const gaps = [
    { dimension: "Revenue", score: components.revenue, max: 20, explanation: "Revenue traction is key for SEA investors.", fix: "Aim for at least $1,000 MRR before raising.", priority: "high" as const },
    { dimension: "Runway", score: components.runway, max: 15, explanation: "Short runway limits negotiation power.", fix: "Secure bridge funding or cut burn by 30%.", priority: "high" as const },
    { dimension: "Market Size", score: components.market_size, max: 10, explanation: "Market sizing needs data backing.", fix: "Cite industry reports (IDC, Gartner, or equivalent).", priority: "medium" as const },
  ];
  return gaps.sort((a, b) => (a.score / a.max) - (b.score / b.max)).slice(0, 3);
}
