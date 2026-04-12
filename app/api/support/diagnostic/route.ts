import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const results: any = {
    supabase: { status: "pending", details: null },
    telegram: { status: "pending", details: null },
    env: {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID: !!process.env.TELEGRAM_CHAT_ID,
    }
  };

  // 1. Test Supabase Admin
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      results.supabase = { status: "error", details: "Missing credentials in process.env" };
    } else {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      // Test table existence
      const { error: tableError } = await supabaseAdmin
        .from("support_sessions")
        .select("id")
        .limit(1);
      
      if (tableError) {
        results.supabase = { status: "error", details: `Table check failed: ${tableError.message}` };
      } else {
        results.supabase = { status: "success", details: "Can read from support_sessions" };
      }
    }
  } catch (err: any) {
    results.supabase = { status: "error", details: err.message };
  }

  // 2. Test Telegram Bot
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN || "8723177584:AAEP7S14my6W6ABBSQ1bCgj5hLxMZ-L14eo";
    const chatId = process.env.TELEGRAM_CHAT_ID || "995198028";
    
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const tgData = await tgRes.json();
    
    if (!tgData.ok) {
      results.telegram = { status: "error", details: `Bot token invalid: ${tgData.description}` };
    } else {
      // Test sending a ping message
      const pingRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "🚀 <b>Support Diagnostic Ping</b>\nIf you see this, your Bot and Chat ID are correctly configured!",
          parse_mode: "HTML",
        }),
      });
      const pingData = await pingRes.json();
      
      if (!pingData.ok) {
        results.telegram = { status: "error", details: `Failed to send ping to Chat ID: ${pingData.description}. Verify Chat ID is correct.` };
      } else {
        results.telegram = { status: "success", details: "Bot is valid and message sent to Chat ID." };
      }
    }
  } catch (err: any) {
    results.telegram = { status: "error", details: err.message };
  }

  return NextResponse.json(results);
}
