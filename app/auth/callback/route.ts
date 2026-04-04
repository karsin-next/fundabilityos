import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth and Email Magic Link callback handler.
 * Supabase redirects here after email confirmation or OAuth.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
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
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // No code — bounce to login
  return NextResponse.redirect(`${origin}/auth/login`);
}
