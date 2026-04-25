-- ============================================================
-- 011_harmonize_core_tables_rls.sql
-- Fix infinite recursion in admin RLS policies by using a
-- SECURITY DEFINER helper function that bypasses RLS.
-- ============================================================

-- Step 1: Create a helper function that checks admin status
-- without triggering RLS on the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND (is_admin = TRUE OR role = 'admin')
  );
$$;

-- Step 2: Replace all admin policies to use the helper function

-- PROFILES
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_admin(auth.uid()));

-- SESSIONS
DROP POLICY IF EXISTS "sessions_admin_all" ON public.sessions;
CREATE POLICY "sessions_admin_all" ON public.sessions
  FOR ALL USING (public.is_admin(auth.uid()));

-- MESSAGES
DROP POLICY IF EXISTS "messages_admin_all" ON public.messages;
CREATE POLICY "messages_admin_all" ON public.messages
  FOR ALL USING (public.is_admin(auth.uid()));

-- REPORTS
DROP POLICY IF EXISTS "reports_admin_all" ON public.reports;
CREATE POLICY "reports_admin_all" ON public.reports
  FOR ALL USING (public.is_admin(auth.uid()));

-- PAYMENTS
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL USING (public.is_admin(auth.uid()));

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;
CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
  FOR ALL USING (public.is_admin(auth.uid()));

-- ANALYTICS EVENTS
DROP POLICY IF EXISTS "analytics_admin_all" ON public.analytics_events;
CREATE POLICY "analytics_admin_all" ON public.analytics_events
  FOR ALL USING (public.is_admin(auth.uid()));

-- EVOLUTION INSIGHTS
DROP POLICY IF EXISTS "evolution_admin_only" ON public.evolution_insights;
CREATE POLICY "evolution_admin_only" ON public.evolution_insights
  FOR ALL USING (public.is_admin(auth.uid()));

-- AUDIT LOG
DROP POLICY IF EXISTS "audit_admin_all" ON public.audit_log;
CREATE POLICY "audit_admin_all" ON public.audit_log
  FOR ALL USING (public.is_admin(auth.uid()));
