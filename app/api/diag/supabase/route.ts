import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ 
      connected: false, 
      error: "Missing environment variables in Vercel" 
    });
  }

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("calibration_log")
      .select("id")
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ 
      connected: true, 
      database_id: url.includes("tijkmn") ? "MATCH (tijk...)" : "MISMATCH",
      log_access: "OK"
    });
  } catch (err: any) {
    return NextResponse.json({ 
      connected: false, 
      error: err.message 
    });
  }
}
