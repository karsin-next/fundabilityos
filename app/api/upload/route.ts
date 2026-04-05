import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 20MB." }, { status: 400 });
    }

    // Convert file to base64 for Claude
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Use Claude to extract structured data from the PDF
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            {
              type: "text",
              text: `You are extracting startup pitch deck data for an investor readiness assessment. 
Extract these fields from the pitch deck. If a field is not found, leave as null.
Return ONLY valid JSON, no other text:

{
  "company_name": "<company name>",
  "problem": "<problem statement - 1-2 sentences>",
  "solution": "<their solution - 1-2 sentences>",
  "market_size": "<TAM/SAM estimate mentioned>",
  "revenue_model": "<how they make money>",
  "monthly_revenue": "<current monthly revenue or 'Pre-revenue'>",
  "team": "<key team members and their backgrounds>",
  "funding_ask": "<how much they are raising>",
  "missing_fields": ["<list any of the above keys that were clearly absent from the deck>"]
}`,
            },
          ],
        },
      ],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "{}";

    // Strip markdown code fences if Claude wraps the JSON
    const cleaned = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      // If parsing fails, return a graceful error response
      return NextResponse.json({ error: "AI could not parse this PDF. Please try the interview instead." }, { status: 422 });
    }

    // Generate a unique session ID for this upload
    const sessionId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Return results directly (no need for a separate polling endpoint)
    return NextResponse.json({
      success: true,
      sessionId,
      status: "done",
      extracted_data: extracted,
    });
  } catch (err: unknown) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
