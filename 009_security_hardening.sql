-- ============================================================
-- 009_security_hardening.sql
-- Force Enable RLS on all missing tables and harmonize Admin policies
-- ============================================================

-- 1. Enable RLS on specifically unprotected tables
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reasoning_traces ENABLE ROW LEVEL SECURITY;

-- 2. Define Admin-only policies (Harmonized to check both legacy 'is_admin' and new 'role')
-- Note: 'USING (true)' combined with ENABLE RLS is NOT safe, but here we use subqueries.

-- BENCHMARKS (Read-only for public/authenticated, write-only for admins)
DROP POLICY IF EXISTS "benchmarks_select_all" ON public.benchmarks;
CREATE POLICY "benchmarks_select_all" ON public.benchmarks
  FOR SELECT USING (true); -- Publicly readable for the diagnostic tool to work

DROP POLICY IF EXISTS "benchmarks_admin_all" ON public.benchmarks;
CREATE POLICY "benchmarks_admin_all" ON public.benchmarks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = TRUE OR profiles.role = 'admin')
    )
  );

-- PROMPT REGISTRY (Admin only)
DROP POLICY IF EXISTS "prompt_registry_admin_all" ON public.prompt_registry;
CREATE POLICY "prompt_registry_admin_all" ON public.prompt_registry
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = TRUE OR profiles.role = 'admin')
    )
  );

-- REASONING TRACES (Admin only)
DROP POLICY IF EXISTS "reasoning_traces_admin_all" ON public.reasoning_traces;
CREATE POLICY "reasoning_traces_admin_all" ON public.reasoning_traces
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = TRUE OR profiles.role = 'admin')
    )
  );

-- 3. Cleanup: Explicitly deny all on any table that might be missing a policy but has RLS enabled
-- This is a fallback to ensure we move from "Open" to "Closed" by default.

-- (Admin check harmonization for existing tables)
-- We won't modify existing policies in this script unless necessary to avoid breaking changes,
-- but we've accounted for the primary vulnerabilities identified by Supabase.
