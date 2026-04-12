import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

// Admin/Server-side client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("support_messages")
    .select("id, sender_type, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Fetch support error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }

  return NextResponse.json({ messages: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, email, content } = body;

  if (!sessionId || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 1. Ensure Session exists
  const { data: existingSession } = await supabaseAdmin
    .from("support_sessions")
    .select("id")
    .eq("id", sessionId)
    .single();

  if (!existingSession) {
    await supabaseAdmin.from("support_sessions").insert({
      id: sessionId,
      email: email || "Anonymous",
    });
  } else if (email && email !== "Anonymous") {
    // Escalate anonymous session to identified session
    await supabaseAdmin.from("support_sessions").update({ email }).eq("id", sessionId);
  }

  // 2. Insert Message into our DB (telegram_message_id is null for now)
  const { data: dbMsg, error: dbErr } = await supabaseAdmin
    .from("support_messages")
    .insert({
      session_id: sessionId,
      sender_type: "user",
      content: content,
    })
    .select()
    .single();

  if (dbErr) {
    console.error("Insert message error:", dbErr);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  // 3. Fire-and-forget relay to Telegram
  const token = process.env.TELEGRAM_BOT_TOKEN || "8723177584:AAEP7S14my6W6ABBSQ1bCgj5hLxMZ-L14eo";
  const chatId = process.env.TELEGRAM_CHAT_ID || "995198028";
  
  if (token && chatId) {
    const formattedMessage = `🚨 <b>New Support Chat</b>\nUser: ${email || "Anonymous"}\n\n${content}`;
    
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: formattedMessage,
          parse_mode: "HTML",
        }),
      });
      
      const tgData = await res.json();
      if (tgData.ok) {
         const telegramMessageId = tgData.result.message_id;
         // 4. Back-annotate the message with the Telegram ID so replies can be mapped
         await supabaseAdmin.from("support_messages").update({ telegram_message_id: telegramMessageId }).eq("id", dbMsg.id);
      }
    } catch (tgError) {
       console.error("Failed to relay to Telegram:", tgError);
    }
  }

  return NextResponse.json({ success: true, message: dbMsg });
}
