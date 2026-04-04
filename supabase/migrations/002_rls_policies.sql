-- ============================================================
-- 002_rls_policies.sql
-- Row Level Security for all tables
-- ============================================================

-- ========================
-- PROFILES
-- ========================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ========================
-- SESSIONS
-- ========================
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own" ON public.sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sessions_insert_own" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_update_own" ON public.sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins see all
CREATE POLICY "sessions_admin_all" ON public.sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ========================
-- MESSAGES
-- ========================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING (
    session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid())
  );

-- Admins see all messages
CREATE POLICY "messages_admin_all" ON public.messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ========================
-- DECK UPLOADS
-- ========================
ALTER TABLE public.deck_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deck_uploads_select_own" ON public.deck_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "deck_uploads_insert_own" ON public.deck_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================
-- REPORTS
-- ========================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Locked reports: only score and band visible to owner
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

-- Public report URLs: anyone can view unlocked reports
CREATE POLICY "reports_select_public" ON public.reports
  FOR SELECT USING (is_unlocked = TRUE AND public_slug IS NOT NULL);

CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reports_update_own" ON public.reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins see all
CREATE POLICY "reports_admin_all" ON public.reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ========================
-- PAYMENTS
-- ========================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Inserts only via service role (Stripe webhook handler)
-- No direct user insert policy needed

-- Admins see all
CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ========================
-- SUBSCRIPTIONS
-- ========================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Admins see all
CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ========================
-- ADD-ON PURCHASES
-- ========================
ALTER TABLE public.addon_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addon_purchases_select_own" ON public.addon_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- ========================
-- ANALYTICS EVENTS
-- ========================
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own events
CREATE POLICY "analytics_select_own" ON public.analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- Insert is open (also captures anonymous pre-signup events via service role)
CREATE POLICY "analytics_insert_any" ON public.analytics_events
  FOR INSERT WITH CHECK (TRUE);

-- Admins see all
CREATE POLICY "analytics_admin_all" ON public.analytics_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ========================
-- SELF-EVOLUTION INSIGHTS
-- ========================
ALTER TABLE public.evolution_insights ENABLE ROW LEVEL SECURITY;

-- Only admins can read insights
CREATE POLICY "evolution_admin_only" ON public.evolution_insights
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ========================
-- AUDIT LOG
-- ========================
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can see their own audit entries
CREATE POLICY "audit_select_own" ON public.audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Admins see all
CREATE POLICY "audit_admin_all" ON public.audit_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
