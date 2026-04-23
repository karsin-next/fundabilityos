-- ============================================================
-- 011_harmonize_core_tables_rls.sql
-- Ensure both legacy (is_admin) and new (role = 'admin') flags 
-- are respected across all core tables for admin visibility.
-- ============================================================

-- 1. PROFILES
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR role = 'admin')
    )
  );

-- 2. SESSIONS
DROP POLICY IF EXISTS "sessions_admin_all" ON public.sessions;
CREATE POLICY "sessions_admin_all" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR role = 'admin')
    )
  );

-- 3. MESSAGES
DROP POLICY IF EXISTS "messages_admin_all" ON public.messages;
CREATE POLICY "messages_admin_all" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR role = 'admin')
    )
  );

-- 4. REPORTS
DROP POLICY IF EXISTS "reports_admin_all" ON public.reports;
CREATE POLICY "reports_admin_all" ON public.reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR role = 'admin')
    )
  );

-- 5. PAYMENTS
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR role = 'admin')
    )
  );

-- 6. SUBSCRIPTIONS
DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;
CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR role = 'admin')
    )
  );

-- 7. ANALYTICS EVENTS
DROP POLICY IF EXISTS "analytics_admin_all" ON public.analytics_events;
CREATE POLICY "analytics_admin_all" ON public.analytics_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR role = 'admin')
    )
  );

-- 8. EVOLUTION INSIGHTS
DROP POLICY IF EXISTS "evolution_admin_only" ON public.evolution_insights;
CREATE POLICY "evolution_admin_only" ON public.evolution_insights
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR role = 'admin')
    )
  );

-- 9. AUDIT LOG
DROP POLICY IF EXISTS "audit_admin_all" ON public.audit_log;
CREATE POLICY "audit_admin_all" ON public.audit_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR role = 'admin')
    )
  );
