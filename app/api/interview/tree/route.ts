import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, MODELS } from "@/lib/ai";
import { DYNAMIC_TREE_SYSTEM_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { history, deckContext } = await req.json();

    if (!history || !Array.isArray(history)) {
      return NextResponse.json({ error: "Valid history array is required" }, { status: 400 });
    }

    const anthropic = getAnthropicClient();
    
    // 1. Prompt Registry Check (A/B Testing Layer)
    // In a full implementation, we'd query the DB for the active 'interview' prompt version.
    // For now, we use the default and attach a version header.
    const PROMPT_VERSION = "v4.2.0-baseline";
    const systemPrompt = DYNAMIC_TREE_SYSTEM_PROMPT;

    // 2. Build the dynamic prompt context
    let promptContext = "";
    
    // Check for deck context provided by the scanner
    if (deckContext && Object.keys(deckContext).length > 0) {
      promptContext += "PRE-EXTRACTED DATA FROM PITCH DECK:\n" + JSON.stringify(deckContext, null, 2) + "\n\n";
      promptContext += "INSTRUCTION: Do NOT ask questions already answered in the pitch deck above. Focus on the MISSING dimensions.\n\n";
    }

    if (history.length === 0) {
      if (deckContext && Object.keys(deckContext).length > 0) {
        promptContext += "Start: Acknowledge deck data and jump to the most critical missing fundability data point.";
      } else {
        promptContext += "Start: This is a brand new company. Ask for their name and core mission.";
      }
    } else {
      promptContext += "HISTORY:\n" + JSON.stringify(history, null, 2);
    }

    // Create a TransformStream to pipe Claude's output to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await anthropic.messages.stream({
            model: MODELS.CHAT,
            max_tokens: 1500,
            temperature: 0.1,
            system: systemPrompt,
            messages: [{ role: "user", content: promptContext }],
          });

          // Log Reasoning Trace start (Telemetry)
          console.log(`[AI-Trace] Version: ${PROMPT_VERSION} | History Length: ${history.length}`);


          for await (const chunk of anthropicStream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              const text = chunk.delta.text;
              // Format as simple SSE payload
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
            }
          }

          controller.enqueue(encoder.encode("data: {\"done\": true}\n\n"));
          controller.close();
        } catch (err: unknown) {
          console.error("[Stream Error]:", err);
          const errorMessage = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
    
    
  } catch (err: unknown) {
    console.error("[Dynamic Tree API Error]:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
