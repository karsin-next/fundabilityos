-- ============================================================
-- 001_initial_schema.sql
-- Core tables: profiles, sessions, messages, deck_uploads,
--              reports, payments, subscriptions, analytics_events, evolution_insights
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================
-- PROFILES
-- ========================
CREATE TABLE public.profiles (
  id              UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email           TEXT,
  full_name       TEXT,
  company_name    TEXT,
  is_admin        BOOLEAN DEFAULT FALSE,
  referral_code   TEXT UNIQUE,
  referred_by     UUID REFERENCES public.profiles,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Generate unique 8-char referral code
  new_referral_code := upper(substring(encode(gen_random_bytes(6), 'hex') FROM 1 FOR 8));

  INSERT INTO public.profiles (id, email, full_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_referral_code
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ========================
-- SESSIONS
-- ========================
CREATE TABLE public.sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.profiles ON DELETE CASCADE,
  input_method        TEXT DEFAULT 'interview' CHECK (input_method IN ('interview', 'deck_upload', 'hybrid')),
  status              TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  drop_off_question   INT,
  source_channel      TEXT,            -- utm_source value
  ab_variants         JSONB DEFAULT '{}'::jsonb,   -- active A/B test assignments
  started_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_sessions_started_at ON public.sessions(started_at);

-- ========================
-- MESSAGES
-- ========================
CREATE TABLE public.messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID REFERENCES public.sessions ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content           TEXT NOT NULL,
  question_index    INT,
  time_spent_sec    INT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON public.messages(session_id);

-- ========================
-- DECK UPLOADS
-- ========================
CREATE TABLE public.deck_uploads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID REFERENCES public.sessions ON DELETE CASCADE,
  user_id           UUID REFERENCES public.profiles ON DELETE CASCADE,
  storage_path      TEXT NOT NULL,
  file_size_bytes   INT,
  extracted_data    JSONB,
  missing_fields    TEXT[],
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deck_uploads_user_id ON public.deck_uploads(user_id);

-- ========================
-- REPORTS
-- ========================
CREATE TABLE public.reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID REFERENCES public.sessions ON DELETE CASCADE UNIQUE,
  user_id             UUID REFERENCES public.profiles ON DELETE CASCADE,
  score               INT CHECK (score >= 0 AND score <= 100),
  band                TEXT CHECK (band IN ('Pre-Ready', 'Early-Stage', 'Investor-Ready', 'Top 10%')),
  component_scores    JSONB,     -- { problem_clarity: 12, revenue: 10, ... }
  display_groups      JSONB,     -- grouped for UI rendering
  top_3_gaps          JSONB,     -- [{ dimension, score, max, explanation, fix }]
  financial_snapshot  JSONB,
  team_overview       JSONB,
  investor_loves      JSONB,
  investor_concerns   JSONB,
  action_items        JSONB,     -- 30-day plan
  summary_paragraph   TEXT,
  is_unlocked         BOOLEAN DEFAULT FALSE,
  public_slug         TEXT UNIQUE,   -- e.g. "karsin-startup-2026"
  pdf_url             TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_is_unlocked ON public.reports(is_unlocked);
CREATE INDEX idx_reports_public_slug ON public.reports(public_slug);

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ========================
-- PAYMENTS
-- ========================
CREATE TABLE public.payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES public.profiles ON DELETE CASCADE,
  report_id             UUID REFERENCES public.reports ON DELETE SET NULL,
  stripe_session_id     TEXT UNIQUE,
  stripe_customer_id    TEXT,
  stripe_payment_intent TEXT,
  type                  TEXT NOT NULL CHECK (type IN ('report', 'badge_monthly', 'badge_annual', 'addon')),
  addon_type            TEXT,
  status                TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  amount_cents          INT,
  price_variant         TEXT,       -- for A/B price testing
  referral_code_used    TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ========================
-- SUBSCRIPTIONS
-- ========================
CREATE TABLE public.subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES public.profiles ON DELETE CASCADE UNIQUE,
  stripe_subscription_id   TEXT UNIQUE,
  stripe_customer_id       TEXT,
  plan_type                TEXT DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'annual')),
  status                   TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  badge_url                TEXT,
  badge_embed_code         TEXT,
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  cancel_at_period_end     BOOLEAN DEFAULT FALSE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON public.subscriptions(current_period_end);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ========================
-- ADD-ON PURCHASES
-- ========================
CREATE TABLE public.addon_purchases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.profiles ON DELETE CASCADE,
  addon_type          TEXT NOT NULL CHECK (addon_type IN (
    'deck_analyzer', 'cap_table', 'projections', 'intro_letter', 'data_room'
  )),
  stripe_session_id   TEXT UNIQUE,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  amount_cents        INT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addon_purchases_user_id ON public.addon_purchases(user_id);

-- ========================
-- ANALYTICS EVENTS
-- ========================
CREATE TABLE public.analytics_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES public.sessions ON DELETE CASCADE,
  user_id         UUID REFERENCES public.profiles ON DELETE SET NULL,
  event_type      TEXT NOT NULL,   -- page_view | interview_started | question_answered | score_viewed | cta_clicked | report_purchased | badge_subscribed | ab_variant_assigned
  event_data      JSONB DEFAULT '{}'::jsonb,
  source_channel  TEXT,
  price_variant   TEXT,
  session_score   INT,
  ab_variant      TEXT,
  ab_test_id      TEXT,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_session_id ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_ab_test ON public.analytics_events(ab_test_id, ab_variant);

-- ========================
-- SELF-EVOLUTION INSIGHTS
-- ========================
CREATE TABLE public.evolution_insights (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type               TEXT DEFAULT 'scheduled' CHECK (run_type IN ('scheduled', 'manual')),
  generated_at           TIMESTAMPTZ DEFAULT NOW(),
  analysis_period_start  TIMESTAMPTZ,
  analysis_period_end    TIMESTAMPTZ,
  session_count          INT DEFAULT 0,
  payment_count          INT DEFAULT 0,
  notification_sent      BOOLEAN DEFAULT FALSE,  -- only true if threshold met
  insights               JSONB,
  raw_stats              JSONB
);

CREATE INDEX idx_evolution_generated_at ON public.evolution_insights(generated_at);

-- ========================
-- AUDIT LOG
-- ========================
CREATE TABLE public.audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.profiles ON DELETE SET NULL,
  action       TEXT NOT NULL,   -- report_unlocked | badge_created | deck_uploaded | data_deleted | admin_access
  metadata     JSONB DEFAULT '{}'::jsonb,
  ip_address   INET,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
