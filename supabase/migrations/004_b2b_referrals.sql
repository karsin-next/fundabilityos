-- ============================================================
-- 004_b2b_accounts.sql
-- White-label B2B API accounts for accelerators/incubators
-- ============================================================

CREATE TABLE public.b2b_accounts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name                 TEXT NOT NULL,
  subdomain                TEXT UNIQUE,
  contact_email            TEXT NOT NULL,
  stripe_subscription_id   TEXT UNIQUE,
  stripe_customer_id       TEXT,
  status                   TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'canceled')),
  assessment_credits       INT DEFAULT 100,     -- credits consumed per assessment
  plan_type                TEXT DEFAULT 'standard' CHECK (plan_type IN ('standard', 'enterprise')),
  api_key_hash             TEXT UNIQUE,         -- hashed API key for endpoint auth
  webhook_url              TEXT,
  custom_branding          JSONB DEFAULT '{}'::jsonb,   -- logo_url, primary_color, etc.
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_b2b_accounts_status ON public.b2b_accounts(status);

CREATE TRIGGER b2b_accounts_updated_at
  BEFORE UPDATE ON public.b2b_accounts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.b2b_accounts ENABLE ROW LEVEL SECURITY;

-- Only admins manage B2B accounts
CREATE POLICY "b2b_admin_only" ON public.b2b_accounts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================================
-- 005_referrals_addons.sql (combined in this file)
-- Referral tracking and add-on RLS
-- ============================================================

-- ========================
-- REFERRALS
-- ========================
CREATE TABLE public.referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID REFERENCES public.profiles ON DELETE CASCADE,
  referred_id     UUID REFERENCES public.profiles ON DELETE CASCADE,
  referral_code   TEXT NOT NULL,
  credit_earned   INT DEFAULT 500,          -- cents ($5.00)
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'expired')),
  converted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referral_code ON public.referrals(referral_code);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Service role handles inserts (triggered on payment completion)

-- Admins see all
CREATE POLICY "referrals_admin_all" ON public.referrals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ========================
-- REFERRAL CREDITS LEDGER
-- ========================
CREATE TABLE public.referral_credits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.profiles ON DELETE CASCADE,
  amount       INT NOT NULL,             -- positive = earned, negative = redeemed
  description  TEXT,
  referral_id  UUID REFERENCES public.referrals ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_credits_user_id ON public.referral_credits(user_id);

ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credits_select_own" ON public.referral_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Convenience view: total credit balance per user
CREATE VIEW public.user_credit_balances AS
  SELECT
    user_id,
    SUM(amount) AS balance_cents,
    COUNT(*) FILTER (WHERE amount > 0) AS credits_earned,
    COUNT(*) FILTER (WHERE amount < 0) AS credits_redeemed
  FROM public.referral_credits
  GROUP BY user_id;

-- RLS also covers add_on_purchases (already in 002, but add admin)
CREATE POLICY "addon_admin_all" ON public.addon_purchases
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
