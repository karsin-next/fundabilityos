import { NextRequest, NextResponse } from "next/server";

// This endpoint is now a fallback only — the main /api/upload route
// returns extracted data directly. This handles any legacy polling calls.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  // Since extraction now happens synchronously in /api/upload, 
  // any polling call is automatically "done" — the data was returned inline.
  return NextResponse.json({ status: "done", message: "Data was returned directly from the upload endpoint." });
}
