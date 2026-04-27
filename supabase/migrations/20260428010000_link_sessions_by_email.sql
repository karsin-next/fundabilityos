-- Migration: Link sessions/reports via email
-- 20260428010000_link_sessions_by_email.sql

-- 1. Add email column to sessions to track guest emails
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS user_email TEXT;
CREATE INDEX IF NOT EXISTS idx_sessions_user_email ON public.sessions(user_email);

-- 2. Update handle_new_user to link orphaned sessions/reports
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

  -- Link orphaned sessions
  UPDATE public.sessions
  SET user_id = NEW.id
  WHERE user_email = NEW.email AND user_id IS NULL;

  -- Link orphaned reports (via session relationship)
  UPDATE public.reports
  SET user_id = NEW.id
  FROM public.sessions
  WHERE public.reports.session_id = public.sessions.id
    AND public.sessions.user_id = NEW.id
    AND public.reports.user_id IS NULL;

  RETURN NEW;
END;
$$;
