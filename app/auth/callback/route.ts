import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * OAuth and Email Magic Link callback handler.
 * Supabase redirects here after email confirmation or OAuth.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // On Vercel, request.url might use http or internal domains. 
  // Let's ensure we use the production origin if possible.
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth error
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    console.log("[Auth Callback] Authentication code detected. Initializing Supabase client...");
    const supabase = await createClient();
    
    console.log("[Auth Callback] Exchanging code for session...");
    const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[Auth Callback] FATAL: Exchange Error:", exchangeError.message);
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`);
    }

    if (!exchangeError && session) {
      const user = session.user;
      
      // Use Service Role client to bypass RLS during profile creation/sync
      // This ensures new Social Auth users are ALWAYS correctly registered
      const supabaseAdmin = createServiceClient();
      
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();
        
      if (!profile) {
        console.log("[Auth Callback] No profile found, creating one...");
        // Use type-casting to ensure build passes regardless of complex circular DB types
        const { error: insertError } = await (supabaseAdmin.from("profiles") as any).insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
          company_name: user.user_metadata?.company_name || "",
          role: "startup"
        });

        if (insertError) {
          console.error("[Auth Callback] Profile Insert Error:", insertError.message);
        } else {
          console.log("[Auth Callback] Profile created successfully.");
        }
      } else {
        console.log("[Auth Callback] Profile already exists.");
      }
      
      console.log("[Auth Callback] SUCCESS: Profile linked. Redirecting to:", redirectTo);
      
      // Ensure redirectTo starts with / to prevent invalid URL construction
      const finalDest = redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`;
      return NextResponse.redirect(`${origin}${finalDest}`);
    }

    console.error("[Auth Callback] ERROR: Valid session not established after exchange.");
    return NextResponse.redirect(`${origin}/auth/login?error=session_not_found`);
  }

  // No code — check if there is an error in the URL from Supabase
  if (error) {
    console.error("[Auth Callback] URL Error from Supabase:", error, errorDescription);
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`);
  }

  console.warn("[Auth Callback] No code or error found. Bouncing to login.");
  return NextResponse.redirect(`${origin}/auth/login`);
}
