import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // In a real implementation:
  // 1. Validate file (PDF, <20MB)
  // 2. Upload to Supabase Storage
  // 3. Create a session record in the database
  // 4. Trigger background Claude extraction job
  
  // Wait to simulate network overhead
  await new Promise((r) => setTimeout(r, 1000));
  
  return NextResponse.json({
    success: true,
    sessionId: "mock-session-id-" + Date.now(),
  });
}
