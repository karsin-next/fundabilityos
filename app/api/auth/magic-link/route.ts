import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, redirectTo } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Generate the magic link using Supabase Admin
    // This creates a link that contains a 'code' or 'token'
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/auth/callback`,
      },
    });

    if (error) {
      console.error("[Magic Link Error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { properties } = data;
    const magicLink = properties.action_link;

    // 2. Send the email via Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const { error: resendError } = await resend.emails.send({
      from: `FundabilityOS <${fromEmail}>`,
      to: [email],
      subject: "Your FundabilityOS Magic Link",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="color: #022f42; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; margin-bottom: 16px;">FundabilityOS</h1>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">Click the button below to sign in to your FundabilityOS dashboard. This link is valid for 1 hour.</p>
          <a href="${magicLink}" style="display: inline-block; background-color: #ffd800; color: #022f42; font-size: 14px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 32px; border-radius: 4px; box-shadow: 0 10px 15px -3px rgba(255, 216, 0, 0.4);">
            Sign in to Dashboard
          </a>
          <p style="color: #718096; font-size: 12px; margin-top: 32px; border-top: 1px solid #edf2f7; pt: 16px;">
            If you didn't request this email, you can safely ignore it. 
            <br />
            Link too long? Paste this into your browser: <br />
            <span style="word-break: break-all; color: #4299e1;">${magicLink}</span>
          </p>
        </div>
      `,
    });

    if (resendError) {
      console.error("[Resend Error]:", resendError);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Magic Link Endpoint Error]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
