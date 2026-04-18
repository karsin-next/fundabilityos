import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { run_id } = await req.json();

    // 1. Get the suggested correction from the calibration log
    const { data: logEntry, error: logError } = await supabaseAdmin
      .from("calibration_log")
      .select("updated_prompt_snippet")
      .eq("id", run_id)
      .single();

    if (logError || !logEntry?.updated_prompt_snippet) {
      return NextResponse.json({ error: "No correction snippet found for this run." }, { status: 404 });
    }

    // 2. Get the currently active prompt version
    const { data: activeVersion, error: activeError } = await supabaseAdmin
      .from("prompt_versions")
      .select("id, prompt_text")
      .eq("is_active", true)
      .single();

    if (activeError || !activeVersion) {
      return NextResponse.json({ error: "No active prompt version found to update." }, { status: 404 });
    }

    // 3. Apply the correction (prepend with a timestamped comment)
    const date = new Date().toISOString().slice(0, 10);
    const amendedPrompt = `[CALIBRATION AMENDMENT — ${date}]\n${logEntry.updated_prompt_snippet}\n\n---\n${activeVersion.prompt_text}`;

    const { error: updateError } = await supabaseAdmin
      .from("prompt_versions")
      .update({ prompt_text: amendedPrompt })
      .eq("id", activeVersion.id);

    if (updateError) throw updateError;

    // 4. Mark the log entry as "applied" if we had a column for it (optional)
    // For now, just return success
    return NextResponse.json({ 
        success: true, 
        message: "Logic correction applied to production prompt." 
    });

  } catch (err) {
    console.error("[Admin Calibration Approve Error]:", err);
    return NextResponse.json({ error: "Failed to apply calibration." }, { status: 500 });
  }
}
