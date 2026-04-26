import { NextRequest, NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";

/**
 * GET /api/admin/test-telegram
 * Fires a test Telegram message to confirm bot token + chat ID work.
 * Protected by CRON_SECRET to prevent public access.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret") || req.nextUrl.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendTelegramAlert({
      type: "test_ping",
      user_email: "admin@fundabilityos.com",
      score: 99,
      band: "TEST — Bot is working ✅",
      report_url: process.env.NEXT_PUBLIC_APP_URL || "https://fundabilityos.com",
    });

    return NextResponse.json({ 
      ok: true, 
      message: "Telegram test message sent. Check your chat.",
      chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID,
      token_prefix: process.env.TELEGRAM_BOT_TOKEN?.substring(0, 8) + "...",
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
