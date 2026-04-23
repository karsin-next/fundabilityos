-- ============================================================
-- 010_harmonize_admin_access.sql
-- Ensure both legacy and new admin flags are respected across all simulation tables.
-- ============================================================

-- 1. CALIBRATION LOG (Simulation History)
DROP POLICY IF EXISTS "admins_read_calibration" ON public.calibration_log;
CREATE POLICY "admins_read_calibration" ON public.calibration_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_admin = TRUE)
    )
  );

-- 2. PROMPT VERSIONS (Version Registry)
DROP POLICY IF EXISTS "admins_manage_prompts" ON public.prompt_versions;
CREATE POLICY "admins_manage_prompts" ON public.prompt_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_admin = TRUE)
    )
  );

-- 3. LOGIC OVERRIDES
DROP POLICY IF EXISTS "admins_manage_overrides" ON public.logic_overrides;
CREATE POLICY "admins_manage_overrides" ON public.logic_overrides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_admin = TRUE)
    )
  );

-- 4. AI INTERACTION LOGS
DROP POLICY IF EXISTS "admins_read_ai_logs" ON public.ai_interaction_logs;
CREATE POLICY "admins_read_ai_logs" ON public.ai_interaction_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_admin = TRUE)
    )
  );

-- 5. SCORE DEBATES
DROP POLICY IF EXISTS "admins_read_debates" ON public.score_debates;
CREATE POLICY "admins_read_debates" ON public.score_debates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_admin = TRUE)
    )
  );
