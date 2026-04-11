import { NextResponse } from "next/server";
import { extractAIJSON } from "@/lib/ai-json";

interface CompletedAnswer {
  questionTitle: string;
  selectedOptionLabel: string;
  openText?: string;
  scoreValue?: number;
}

interface AnalysisResult {
  overallSignal: "strong" | "moderate" | "weak";
  investorTake: string;
  strengths: string[];
  redFlags: string[];
  nextAction: string;
  score: number;
}

// ─── Static fallback analyses per module ─────────────────────────────────────
function buildFallbackAnalysis(moduleContext: string, answers: CompletedAnswer[]): AnalysisResult {
  const avgScore = answers.length
    ? Math.round(answers.reduce((s, a) => s + (a.scoreValue || 50), 0) / answers.length)
    : 50;

  const signal: "strong" | "moderate" | "weak" =
    avgScore >= 75 ? "strong" : avgScore >= 45 ? "moderate" : "weak";

  const selectedLabels = answers.map((a) => a.selectedOptionLabel).filter(Boolean);

  return {
    overallSignal: signal,
    investorTake:
      signal === "strong"
        ? `This module shows institutional-grade clarity. The responses reflect a founder who has pressure-tested their thinking — a critical signal for Series A+ investors.`
        : signal === "moderate"
        ? `Moderate signal. There is a coherent narrative forming, but investors will probe further. The gaps identified here are common blockers in first-round due diligence.`
        : `This module requires significant strengthening before investor conversations. The current answers suggest assumptions that have not been fully validated with market evidence.`,
    strengths: selectedLabels.slice(0, 2).map((l) => `Answer indicates: "${l}" — a credible, investor-recognisable position.`),
    redFlags:
      avgScore < 50
        ? ["Multiple answers signal early-stage risk without mitigation narrative.", "Open text context is sparse — qualitative depth is critical for investor confidence."]
        : ["Ensure claims can be backed with data points in the due diligence data room."],
    nextAction:
      signal === "strong"
        ? "Prepare a one-page evidence brief for this dimension — investors will ask for it in the first meeting."
        : "Revisit this module after addressing the identified gaps. A single strong answer can reverse a weak signal.",
    score: avgScore,
  };
}

export async function POST(req: Request) {
  const { moduleContext, answers } = await req.json() as {
    moduleContext: string;
    answers: CompletedAnswer[];
  };

  if (!moduleContext || !answers?.length) {
    return NextResponse.json({ error: "Missing context or answers." }, { status: 400 });
  }

  // ── Try AI analysis if key is set ─────────────────────────────────────────
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const answersText = answers
        .map((a, i) => `Q${i + 1}: ${a.questionTitle}\nAnswer: ${a.selectedOptionLabel}\nContext: ${a.openText || "none"}`)
        .join("\n\n");

      const prompt = `You are a senior VC analyst at a top-tier fund reviewing a startup's self-assessment for the module: "${moduleContext}".

Here are the founder's responses:
${answersText}

Provide a precise investor-lens analysis as raw JSON only (no markdown, no explanation):
{
  "overallSignal": "<strong|moderate|weak>",
  "investorTake": "<2-3 sentence honest investor perspective on what this set of answers signals — be direct and critical>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "redFlags": ["<concern 1>", "<concern 2>"],
  "nextAction": "<one specific, actionable next step to strengthen this module>",
  "score": <0-100 integer>
}`;

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";
      const parsed = extractAIJSON<AnalysisResult>(text);
      return NextResponse.json(parsed);
    } catch (err) {
      console.error("AI analysis error, using fallback:", err);
    }
  }

  return NextResponse.json(buildFallbackAnalysis(moduleContext, answers));
}
