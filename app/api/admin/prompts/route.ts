import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client bypasses RLS — admin eyes only
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from("prompt_versions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Admin Prompts GET Error]:", err);
    return NextResponse.json({ error: "Failed to fetch prompt versions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("prompt_versions")
      .insert([
        {
          version_name: body.version_name,
          prompt_text: body.prompt_text,
          is_active: body.is_active || false,
          traffic_pct: body.traffic_pct || 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Admin Prompts POST Error]:", err);
    return NextResponse.json({ error: "Failed to create prompt version" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();

    // If activating, deactivate others first (if traffic_pct is 100)
    if (updates.is_active && updates.traffic_pct === 100) {
      await supabaseAdmin
        .from("prompt_versions")
        .update({ is_active: false })
        .neq("id", id);
    }

    const { data, error } = await supabaseAdmin
      .from("prompt_versions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Admin Prompts PATCH Error]:", err);
    return NextResponse.json({ error: "Failed to update prompt version" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    try {
      const { id } = await req.json();
      const { error } = await supabaseAdmin
        .from("prompt_versions")
        .delete()
        .eq("id", id);
  
      if (error) throw error;
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("[Admin Prompts DELETE Error]:", err);
      return NextResponse.json({ error: "Failed to delete prompt version" }, { status: 500 });
    }
  }
