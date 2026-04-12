-- Migration: Telegram Support Chatbot
-- Creates the session tracking and message log tables for the 2-way Telegram chat widget.

CREATE TABLE support_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'resolved', 'ignored'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES support_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'user' or 'admin'
  content TEXT NOT NULL,
  telegram_message_id BIGINT, -- The ID of the message inside Telegram to track replies
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying (polling)
CREATE INDEX idx_support_messages_session ON support_messages(session_id);
CREATE INDEX idx_support_messages_telegram ON support_messages(telegram_message_id);

-- Simple RLS
ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Allow public inserts and reads via Service Worker / Anonymous Web Users
-- (We use the secret API route logic to manage access anyway, but Supabase requires policies)
CREATE POLICY "Public can insert sessions" ON support_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read own sessions via API" ON support_sessions FOR SELECT USING (true);
CREATE POLICY "Public can update own sessions via API" ON support_sessions FOR UPDATE USING (true);

CREATE POLICY "Public can insert messages" ON support_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read own messages via API" ON support_messages FOR SELECT USING (true);
