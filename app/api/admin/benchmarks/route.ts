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
      .from("benchmarks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Admin Benchmarks GET Error]:", err);
    return NextResponse.json({ error: "Failed to fetch benchmarks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("benchmarks")
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Admin Benchmarks POST Error]:", err);
    return NextResponse.json({ error: "Failed to create benchmark" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const { error } = await supabaseAdmin
      .from("benchmarks")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Benchmarks DELETE Error]:", err);
    return NextResponse.json({ error: "Failed to delete benchmark" }, { status: 500 });
  }
}
