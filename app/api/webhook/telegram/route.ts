import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Only process normal text messages
    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true }); // Acknowledge other events (edits, pins) silently
    }

    const { message } = update;

    // We only care if the Admin is REPLYING to a message previously sent by the bot
    if (!message.reply_to_message || !message.reply_to_message.message_id) {
      return NextResponse.json({ ok: true });
    }

    const originalTelegramMessageId = message.reply_to_message.message_id;
    const adminReplyText = message.text;

    // 1. Look up the original message in our database to find the session_id
    const { data: originalMessage, error: lookupErr } = await supabaseAdmin
      .from("support_messages")
      .select("session_id")
      .eq("telegram_message_id", originalTelegramMessageId)
      .single();

    if (lookupErr || !originalMessage) {
      console.error("Could not find corresponding session for Telegram Message ID:", originalTelegramMessageId);
      // Even if not found, we must return 200 OK so Telegram stops retrying the webhook
      return NextResponse.json({ ok: true, error: "Session not found" });
    }

    // 2. Insert the Admin's reply into the support_messages table
    const { error: insertErr } = await supabaseAdmin
      .from("support_messages")
      .insert({
        session_id: originalMessage.session_id,
        sender_type: "admin",
        content: adminReplyText,
      });

    if (insertErr) {
      console.error("Failed to insert admin reply:", insertErr);
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ ok: true, error: "Internal Error" }); // Return 200 so Telegram stops retrying
  }
}
