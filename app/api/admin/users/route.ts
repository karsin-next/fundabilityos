import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// Service role client — bypasses RLS entirely
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    // 1. Verify the caller is an authenticated admin
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status using service role (no RLS recursion)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.is_admin !== true && profile.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Fetch all profiles with their reports (service role bypasses RLS)
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, company_name, is_admin, role, created_at, reports(id, score, band, created_at)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin Users API Error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: profiles || [] });
  } catch (e) {
    console.error("[Admin Users API Error]:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
