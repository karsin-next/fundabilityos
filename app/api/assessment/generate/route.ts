import { NextResponse } from "next/server";
import { DYNAMIC_MODULE_SYSTEM_PROMPT } from "@/lib/prompts";
import { MODELS } from "@/lib/ai";

interface PreviousAnswer {
  questionTitle: string;
  selectedOptionLabel: string;
  openText: string;
}

interface GeneratedQuestion {
  questionTitle: string;
  options: { id: string; label: string; value: number }[];
  placeholder: string;
}

// ─── Static Fallback Question Bank ───────────────────────────────────────────
// Used when ANTHROPIC_API_KEY is not set (or API errors out).
// Keyed by module context keywords, falling back to a general set.
const FALLBACK_QUESTIONS: Record<string, GeneratedQuestion[]> = {
  "problem": [
    {
      questionTitle: "How frequently does your target customer encounter this problem?",
      options: [
        { id: "opt-1", label: "Daily — it actively disrupts their workflow every single day", value: 90 },
        { id: "opt-2", label: "Weekly — a recurring friction point in their operations", value: 70 },
        { id: "opt-3", label: "Monthly — periodic pain they've learned to work around", value: 40 },
        { id: "opt-4", label: "Rarely — an edge case that happens under specific conditions", value: 10 },
      ],
      placeholder: "Describe the typical trigger scenario: what breaks down, how long does it last, and what's the cost of each occurrence?"
    },
    {
      questionTitle: "What does your customer currently use to solve this problem?",
      options: [
        { id: "opt-1", label: "Manual processes / spreadsheets — fragile, slow, error-prone", value: 85 },
        { id: "opt-2", label: "A legacy enterprise tool that's poorly suited to the job", value: 70 },
        { id: "opt-3", label: "A patchwork of multiple disconnected tools", value: 65 },
        { id: "opt-4", label: "Nothing — they simply endure the pain with no workaround", value: 90 },
      ],
      placeholder: "Name the specific incumbent solutions, tools, or workflows. What's the key reason none of them fully solve the problem?"
    },
    {
      questionTitle: "What is the quantifiable cost of this problem going unsolved?",
      options: [
        { id: "opt-1", label: "Direct financial loss > $10,000 per incident or per month", value: 95 },
        { id: "opt-2", label: "Significant time waste — 5+ hours per week per person", value: 75 },
        { id: "opt-3", label: "Reputational or compliance risk with measurable consequence", value: 80 },
        { id: "opt-4", label: "Opportunity cost — deals lost or growth capped by this friction", value: 70 },
      ],
      placeholder: "Provide a specific number if possible: dollars lost, hours wasted, customers churned. Investors need a concrete cost-of-inaction figure."
    },
    {
      questionTitle: "Have you validated this problem directly with paying or target customers?",
      options: [
        { id: "opt-1", label: "Yes — 10+ customer discovery interviews with documented pain confirmation", value: 95 },
        { id: "opt-2", label: "Yes — 3–9 interviews; pain is consistent but data is still thin", value: 70 },
        { id: "opt-3", label: "Partially — informal conversations; no structured discovery done", value: 35 },
        { id: "opt-4", label: "Not yet — hypothesis is based on personal experience or observation", value: 10 },
      ],
      placeholder: "Share a specific quote or data point from a customer interview that confirms this problem is acute and widespread."
    },
  ],
  "customer": [
    {
      questionTitle: "How precisely can you define your Ideal Customer Profile (ICP)?",
      options: [
        { id: "opt-1", label: "Hyper-specific: industry, company size, role, and trigger event defined", value: 95 },
        { id: "opt-2", label: "Moderately specific: industry and role defined, trigger is vague", value: 65 },
        { id: "opt-3", label: "Broad: targeting an industry vertical without role specificity", value: 35 },
        { id: "opt-4", label: "Unclear: serving anyone with the problem regardless of segment", value: 10 },
      ],
      placeholder: "Describe your ICP in one sentence: 'We target [role] at [company type] who experience [specific trigger].'"
    },
    {
      questionTitle: "What is the decision-making unit (who buys, uses, and influences the purchase)?",
      options: [
        { id: "opt-1", label: "Clear: single economic buyer with direct budget authority", value: 90 },
        { id: "opt-2", label: "Champion-driven: end user advocates internally to a budget holder", value: 70 },
        { id: "opt-3", label: "Committee: 3+ stakeholders with conflicting priorities", value: 40 },
        { id: "opt-4", label: "Unknown: still figuring out who actually signs the contract", value: 5 },
      ],
      placeholder: "Name the specific buyer persona, their title, and what business outcome they personally care about most."
    },
  ],
  "revenue": [
    {
      questionTitle: "What is your primary revenue model?",
      options: [
        { id: "opt-1", label: "Recurring subscription (SaaS) — predictable, scalable MRR", value: 90 },
        { id: "opt-2", label: "Usage-based / consumption pricing tied to value delivered", value: 85 },
        { id: "opt-3", label: "Transaction fee — you earn when your customers earn", value: 75 },
        { id: "opt-4", label: "One-time licence or project-based — lower predictability", value: 40 },
      ],
      placeholder: "Describe your pricing tiers, average contract value, and any expansion revenue mechanisms (upsells, seat expansion)."
    },
    {
      questionTitle: "What is your current MRR growth rate month-over-month?",
      options: [
        { id: "opt-1", label: "20%+ MoM — hypergrowth trajectory", value: 100 },
        { id: "opt-2", label: "10–20% MoM — strong, sustainable growth", value: 80 },
        { id: "opt-3", label: "1–10% MoM — early but consistent traction", value: 55 },
        { id: "opt-4", label: "Flat or declining — revenue has plateaued", value: 10 },
      ],
      placeholder: "Share your MRR for the last 3 months. If pre-revenue, describe your pipeline and expected first-revenue timeline."
    },
  ],
  "team": [
    {
      questionTitle: "Does your founding team cover the three critical functions?",
      options: [
        { id: "opt-1", label: "Yes — distinct product, tech, and GTM leads with domain expertise", value: 95 },
        { id: "opt-2", label: "Partially — two functions covered strongly; one is a gap", value: 65 },
        { id: "opt-3", label: "Solo founder covering all three — high execution risk", value: 30 },
        { id: "opt-4", label: "Team is non-technical or lacks relevant domain expertise", value: 10 },
      ],
      placeholder: "Name each co-founder, their specific role, and their most relevant prior experience or credential for this market."
    },
    {
      questionTitle: "What is the team's 'unfair advantage' for this specific problem?",
      options: [
        { id: "opt-1", label: "Deep domain expertise — 5+ years operating in this exact space", value: 95 },
        { id: "opt-2", label: "Prior exit or notable company building experience", value: 85 },
        { id: "opt-3", label: "Unique proprietary insight from a previous role", value: 75 },
        { id: "opt-4", label: "Passion-driven — no specific unfair structural advantage", value: 20 },
      ],
      placeholder: "Describe the specific insight, experience, or network that makes YOUR team the right people to solve this — that a well-funded competitor couldn't simply hire."
    },
  ],
};

const GENERAL_FALLBACK: GeneratedQuestion[] = [
  {
    questionTitle: "How does your competitive position differentiate from existing alternatives?",
    options: [
      { id: "opt-1", label: "Proprietary technology or data moat that competitors cannot replicate", value: 95 },
      { id: "opt-2", label: "10x better on a key metric that matters most to the customer", value: 85 },
      { id: "opt-3", label: "Significantly cheaper with comparable quality", value: 60 },
      { id: "opt-4", label: "Incremental improvement — differentiation is not yet defensible", value: 15 },
    ],
    placeholder: "Name your top 2 competitors and explain the specific axis where you win decisively against each."
  },
  {
    questionTitle: "What is your go-to-market motion?",
    options: [
      { id: "opt-1", label: "Product-Led Growth — product itself acquires and expands users", value: 85 },
      { id: "opt-2", label: "Outbound sales — SDR-driven pipeline with repeatable playbook", value: 80 },
      { id: "opt-3", label: "Channel / partner-led distribution", value: 70 },
      { id: "opt-4", label: "Founder-led sales — no repeatable process yet", value: 35 },
    ],
    placeholder: "Describe your current acquisition funnel: how do leads find you, what converts them, and what's your current CAC and sales cycle length?"
  },
];

function getFallbackQuestion(moduleContext: string, questionIndex: number): GeneratedQuestion {
  const contextLower = moduleContext.toLowerCase();
  let bank: GeneratedQuestion[] = GENERAL_FALLBACK;

  if (contextLower.includes("problem")) bank = FALLBACK_QUESTIONS["problem"];
  else if (contextLower.includes("customer")) bank = FALLBACK_QUESTIONS["customer"];
  else if (contextLower.includes("revenue")) bank = FALLBACK_QUESTIONS["revenue"];
  else if (contextLower.includes("team")) bank = FALLBACK_QUESTIONS["team"];

  return bank[questionIndex % bank.length];
}

// ─── API Route ────────────────────────────────────────────────────────────────

export const maxDuration = 60;

export async function POST(req: Request) {
  const { moduleContext, previousAnswers } = await req.json();

  if (!moduleContext) {
    return NextResponse.json({ error: "Missing module context." }, { status: 400 });
  }

  const questionIndex = Array.isArray(previousAnswers) ? previousAnswers.length : 0;

  // ── If no API key, use static fallback immediately ─────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not set — using static fallback questions.");
    return NextResponse.json(getFallbackQuestion(moduleContext, questionIndex));
  }

  // ── Try AI generation, fall back on any error ──────────────────────────────
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let promptContent = `MODULE CONTEXT (Area of Focus): ${moduleContext}\n\n`;

    if (Array.isArray(previousAnswers) && previousAnswers.length > 0) {
      promptContent += "PREVIOUS ANSWERS IN THIS MODULE SEQUENCE:\n";
      previousAnswers.forEach((ans: PreviousAnswer, i: number) => {
        promptContent += `\nQuestion ${i + 1}: ${ans.questionTitle}`;
        promptContent += `\nSelected Option: ${ans.selectedOptionLabel}`;
        promptContent += `\nOpen Text Context: "${ans.openText}"\n`;
      });
    } else {
      promptContent += "No previous answers yet. Generate the first follow-up question in the sequence.";
    }

    promptContent += "\nGenerate the NEXT drill-down question and 4 multiple-choice options in the strict JSON format specified.";

    const message = await anthropic.messages.create({
      model: MODELS.ANALYSIS,
      max_tokens: 1024,
      system: DYNAMIC_MODULE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: promptContent }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson) as GeneratedQuestion;

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("AI Generation Error — falling back to static questions:", error);
    return NextResponse.json(getFallbackQuestion(moduleContext, questionIndex));
  }
}
