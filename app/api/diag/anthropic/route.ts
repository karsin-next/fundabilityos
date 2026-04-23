import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai";

export const runtime = "nodejs";

export async function GET() {
  try {
    const anthropic = getAnthropicClient();
    
    // Try the absolute simplest model/request
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 10,
      messages: [{ role: "user", content: "ping" }],
    });

    return NextResponse.json({
      status: "success",
      message: "Anthropic API Key is VALID and ACTIVE.",
      model_used: response.model,
      usage: response.usage
    });

  } catch (err: any) {
    console.error("[Anthropic Diag Error]:", err);
    
    let diagnonstics = {
        status: "failed",
        error_type: err.type || "unknown",
        message: err.message || "No error message provided",
        suggestion: ""
    };

    if (err.status === 404) {
        diagnonstics.suggestion = "Anthropic doesn't recognize this model for your key. This usually means you need to add credits (min $5) to your Anthropic account.";
    } else if (err.status === 401) {
        diagnonstics.suggestion = "Your API Key is invalid. Please double check ANTHROPIC_API_KEY in Vercel.";
    }

    return NextResponse.json(diagnonstics, { status: err.status || 500 });
  }
}
