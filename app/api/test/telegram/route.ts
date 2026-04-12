import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";

export const runtime = "nodejs";

// Quick test endpoint — hit this to verify Telegram is wired up correctly
// GET /api/test/telegram
export async function GET() {
  try {
    await sendTelegramAlert(
      `🧪 <b>FundabilityOS — Telegram Test</b>\n\n` +
      `✅ Connection verified!\n` +
      `🕐 Sent at: ${new Date().toISOString()}\n\n` +
      `The daily evolution cron will push updates here every morning at 6am UTC.`
    );
    return NextResponse.json({ success: true, message: "Telegram test message sent!" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/test/telegram — Registers the webhook dynamically using the host environment
export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN || "8723177584:AAEP7S14my6W6ABBSQ1bCgj5hLxMZ-L14eo";
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host"); // Safest way to get the Vercel deployed domain
  
  if (!host) {
    return NextResponse.json({ error: "No host provided" }, { status: 400 });
  }

  const webhookUrl = `${protocol}://${host}/api/webhook/telegram`;
  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json({ success: true, webhookUrl, telegramResponse: data });
  } catch (err) {
    return NextResponse.json({ error: "Failed to set webhook", details: err }, { status: 500 });
  }
}
