import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceClient();

    // 1. Check Auth User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "No active session found. Please login." }, { status: 401 });
    }

    // 2. Check Profile Role
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, is_admin, role")
        .eq("id", user.id)
        .single();

    // 3. Check Database Rows (Bypassing RLS)
    const { data: logSample, count } = await supabaseAdmin
        .from("calibration_log")
        .select("*", { count: "exact" })
        .limit(1);

    return NextResponse.json({
      auth_user: {
        id: user.id,
        email: user.email,
        aud: user.aud
      },
      database_profile: profile || "PROFILE NOT FOUND",
      calibration_log: {
        total_rows_in_db: count || 0,
        sample_row_exists: !!logSample
      },
      suggestion: !profile ? "USER_PROFILE_MISSING: Your auth account exists but has no row in the 'profiles' table." : 
                   (profile.role !== 'admin' && !profile.is_admin) ? "INSUFFICIENT_PERMISSIONS: You are not marked as an Admin in the 'profiles' table." :
                   (count === 0) ? "NO_DATA: The database table is literally empty. The simulation didn't save." : 
                   "RLS_BLOCK: The data exists, but the security policies are still blocking your view."
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
