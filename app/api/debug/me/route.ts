import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Temporary diagnostic: Shows what the current authenticated user's profile looks like.
 * DELETE THIS after debugging is complete.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ 
      authenticated: false, 
      error: authError?.message || "No session found" 
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, is_admin, role")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    authenticated: true,
    auth_user_id: user.id,
    auth_user_email: user.email,
    profile,
    profile_error: profileError?.message || null,
  });
}
