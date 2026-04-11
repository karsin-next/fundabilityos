import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

// GET — return all active overrides
export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from("logic_overrides")
    .select("*")
    .order("applied_count", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create a new override rule
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { trigger_text, correction_rule } = await req.json();
  if (!trigger_text || !correction_rule) {
    return NextResponse.json({ error: "trigger_text and correction_rule are required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("logic_overrides")
    .insert({ trigger_text: trigger_text.toLowerCase(), correction_rule, is_active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE — remove an override
export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { id } = await req.json();
  const { error } = await supabaseAdmin.from("logic_overrides").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH — toggle active status or increment applied_count
export async function PATCH(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { id, action } = await req.json();

  if (action === "increment") {
    const { error } = await supabaseAdmin.rpc("increment_override_count", { override_id: id });
    if (error) {
      // Fallback if RPC doesn't exist: manual fetch + update
      const { data: row } = await supabaseAdmin.from("logic_overrides").select("applied_count").eq("id", id).single();
      await supabaseAdmin.from("logic_overrides").update({ applied_count: (row?.applied_count || 0) + 1 }).eq("id", id);
    }
  } else if (action === "toggle") {
    const { data: row } = await supabaseAdmin.from("logic_overrides").select("is_active").eq("id", id).single();
    await supabaseAdmin.from("logic_overrides").update({ is_active: !row?.is_active }).eq("id", id);
  }

  return NextResponse.json({ success: true });
}
