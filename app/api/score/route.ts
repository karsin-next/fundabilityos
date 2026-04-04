import { NextRequest, NextResponse } from "next/server";
import { claudeScore } from "@/lib/scoring";
import { trackEvent } from "@/lib/analytics";
import { sendTelegramAlert } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  let body: { answers: Record<string, unknown>; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.answers) {
    return NextResponse.json({ error: "answers is required" }, { status: 400 });
  }

  try {
    const result = await claudeScore(body.answers);
    
    // Trigger Analytics and Telegram Alert
    await trackEvent("assessment_completed", {
      sessionId: body.sessionId,
      score: result.score,
      eventData: { band: result.band }
    });
    
    await sendTelegramAlert(`🤖 <b>AI Assessment Completed</b>\nScore: ${result.score}/100 (${result.band})\nTop Gap: ${result.top_3_gaps?.[0]?.dimension || "N/A"}`);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scoring failed";
    console.error("[score] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
