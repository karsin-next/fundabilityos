import { NextRequest } from "next/server";
import { getAnthropicClient, MODELS } from "@/lib/ai";
import { INTERVIEW_SYSTEM_PROMPT, INTERVIEW_QUESTIONS } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

// Simple in-memory rate limiter (per IP, resets per process restart)
// Production: swap for Redis / Upstash
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60_000; // 1 minute
  const maxRequests = 30;

  const entry = rateLimitMap.get(ip) ?? { count: 0, resetAt: now + window };
  if (now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + window });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  rateLimitMap.set(ip, { count: entry.count + 1, resetAt: entry.resetAt });
  return true;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please slow down." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { messages: ChatMessage[]; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages array is required." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check if Anthropic key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    // Return a mock streaming response for development preview
    return mockStreamResponse(messages.length);
  }

  const anthropic = getAnthropicClient();

  // Build context-aware system prompt
  // Count how many user turns have happened to know which question we're on
  const userTurns = messages.filter((m) => m.role === "user").length;
  const nextQuestionIndex = Math.min(userTurns + 1, INTERVIEW_QUESTIONS.length);
  const nextQuestion = INTERVIEW_QUESTIONS[nextQuestionIndex - 1];

const JSON_SCHEMA_INSTRUCTION = `
7. You MUST output ONLY valid JSON — no preamble, no explanation, just the JSON object. 

The JSON must match this exact schema:
{
  "interview_complete": true,
  "company": "<company name or 'Unknown'>",
  "founder_name": "<name or 'Unknown'>",
  "answers": {
    "problem_description": "<what they said>",
    "target_customer": "<who they target>",
    "market_size_description": "<market size estimate>",
    "monthly_revenue_usd": <number or 0>,
    "is_pre_revenue": <true/false>,
    "product_stage": "<idea|prototype|beta|live>",
    "active_users_count": <number or 0>,
    "team_size": <number>,
    "co_founders": ["<name and role>"],
    "burn_rate_usd": <monthly burn in USD or 0>,
    "runway_months": <number>,
    "funding_raised_usd": <total raised to date or 0>,
    "funding_type": "<none|angel|seed|series-a|series-b+>",
    "target_raise_usd": <target raise amount>,
    "target_round": "<pre-seed|seed|series-a|series-b>",
    "customer_acquisition": "<how they acquire customers>",
    "has_cac_data": <true/false>,
    "main_competitors": ["<competitor names>"],
    "unfair_advantage": "<their moat claim>",
    "milestones_with_raise": "<what they'll achieve>",
    "has_ip_or_patent": <true/false>,
    "ip_description": "<description or empty string>",
    "investor_strength": "<what they think investors will love>",
    "investor_concern": "<what they think investors will push back on>",
    "answer_quality_notes": "<your qualitative notes on completeness and honesty>"
  }
}`;

  const contextualSystem = `${INTERVIEW_SYSTEM_PROMPT}
7. Reference previous answers when relevant to show you're listening.

CURRENT STATE:
- Questions answered so far: ${userTurns} of 12
- Next question dimension: ${nextQuestion?.dimension ?? "Complete — output JSON now"}
- Next question index: ${nextQuestionIndex}

${userTurns >= 12
    ? `ALL 12 QUESTIONS HAVE BEEN ANSWERED. ${JSON_SCHEMA_INSTRUCTION}`
    : `Ask question ${nextQuestionIndex}: "${nextQuestion?.question}"`
  }`;

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model: MODELS.CHAT,
          max_tokens: 600,
          system: contextualSystem,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        for await (const chunk of response) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const data = JSON.stringify({ delta: chunk.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        // Send done signal
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "AI service error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
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
      "X-Accel-Buffering": "no",
    },
  });
}

// ============================================================
// Mock stream for dev without ANTHROPIC_API_KEY
// ============================================================
function mockStreamResponse(userTurnCount: number) {
  const questionIndex = Math.min(userTurnCount + 1, 12);
  const question = INTERVIEW_QUESTIONS[questionIndex - 1];

  const mockText =
    questionIndex <= 12
      ? `Thanks for sharing that. ${question.question}`
      : `{"interview_complete": true, "company": "Demo Startup", "founder_name": "Demo Founder", "answers": {"problem_description": "Demo answer", "target_customer": "SMEs", "market_size_description": "$5B TAM", "monthly_revenue_usd": 5000, "is_pre_revenue": false, "product_stage": "live", "active_users_count": 50, "team_size": 2, "co_founders": ["Jane - CTO"], "burn_rate_usd": 8000, "runway_months": 9, "funding_raised_usd": 0, "funding_type": "none", "target_raise_usd": 500000, "target_round": "seed", "customer_acquisition": "word of mouth", "has_cac_data": false, "main_competitors": ["Competitor A"], "unfair_advantage": "Deep domain expertise", "milestones_with_raise": "Reach 500 customers", "has_ip_or_patent": false, "ip_description": "", "investor_strength": "Strong team", "investor_concern": "No revenue yet", "answer_quality_notes": "Good overall"}}`;

  const encoder = new TextEncoder();
  const words = mockText.split(" ");
  let i = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const interval = setInterval(() => {
        if (i >= words.length) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
          controller.close();
          clearInterval(interval);
          return;
        }
        const delta = (i === 0 ? "" : " ") + words[i];
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`)
        );
        i++;
      }, 40);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
