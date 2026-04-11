-- ============================================================
-- 007_ai_learning_engine.sql
-- Autonomous AI Learning Engine — FundabilityOS V4
-- Tables: ai_interaction_logs, score_debates, calibration_log,
--         logic_overrides, prompt_versions
-- ============================================================

-- 1. MASTER AI INTERACTION LOG
-- Every Claude call is recorded here for audit, debugging, and A/B test analysis.
CREATE TABLE IF NOT EXISTS public.ai_interaction_logs (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assessment_id     uuid,                       -- FK loose (no constraint) to reports
  prompt_version    text NOT NULL DEFAULT 'v1',
  input_context     text,                       -- The user's answers / startup context
  bull_case         text,                       -- Bull agent output (if debate ran)
  bear_case         text,                       -- Bear agent output (if debate ran)
  final_output      jsonb,                      -- Parsed scoring result
  reasoning_trace   text,                       -- Step-by-step chain-of-thought
  model_used        text DEFAULT 'claude-sonnet-4-5-20250929',
  tokens_used       int,
  created_at        timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.ai_interaction_logs ENABLE ROW LEVEL SECURITY;
-- Admins can read all logs; service role used for inserts
CREATE POLICY "admins_read_ai_logs" ON public.ai_interaction_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 2. SCORE DEBATES TABLE
-- Stores the Bull/Bear/Arbiter debate transcript for each real assessment.
CREATE TABLE IF NOT EXISTS public.score_debates (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id     uuid NOT NULL,              -- Matches ai_interaction_logs.assessment_id
  bull_argument     text,
  bear_argument     text,
  arbiter_output    jsonb,                      -- { score, gap_1, gap_2, investor_take }
  consensus_score   int,
  delta_from_primary int,                       -- Difference from original QuickAssess score
  created_at        timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.score_debates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_debates" ON public.score_debates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. CALIBRATION LOG TABLE
-- Tracks each recursive simulation run. Prevents score inflation.
CREATE TABLE IF NOT EXISTS public.calibration_log (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_size                  int NOT NULL DEFAULT 20,
  profiles_generated          int,
  score_distribution          jsonb,    -- { "0-24": n, "25-49": n, "50-74": n, "75-100": n }
  pct_above_75                numeric,  -- e.g., 12.5
  calibration_triggered       boolean DEFAULT false,
  updated_prompt_snippet      text,     -- The revised scoring instruction if calibrated
  estimated_cost_cents        int,      -- Approximate API cost in cents
  budget_aborted              boolean DEFAULT false,
  run_source                  text DEFAULT 'cron',  -- 'cron' | 'manual'
  created_at                  timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.calibration_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_calibration" ON public.calibration_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 4. LOGIC OVERRIDES TABLE (Semantic Override Library)
-- Admin-written correction rules injected into future scoring prompts.
CREATE TABLE IF NOT EXISTS public.logic_overrides (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_text      text NOT NULL,       -- Keyword/phrase pattern to match (lowercased)
  correction_rule   text NOT NULL,       -- Instruction prepended to Claude system prompt
  applied_count     int DEFAULT 0,
  is_active         boolean DEFAULT true,
  created_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.logic_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_overrides" ON public.logic_overrides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 5. PROMPT VERSIONS TABLE (A/B Testing Framework)
-- Extends and formalises the existing prompt_registry concept.
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  version_name      text NOT NULL UNIQUE,   -- e.g., 'v1-baseline', 'v2-strict-tone'
  prompt_text       text NOT NULL,
  is_active         boolean DEFAULT false,
  traffic_pct       int DEFAULT 100 CHECK (traffic_pct BETWEEN 0 AND 100),
  completions       int DEFAULT 0,          -- Incremented on each use
  avg_score         numeric,                -- Rolling average of produced scores
  upgrade_clicks    int DEFAULT 0,          -- Conversion signal
  created_at        timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_prompts" ON public.prompt_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Seed the default v1 prompt version on migration
INSERT INTO public.prompt_versions (version_name, prompt_text, is_active, traffic_pct)
VALUES (
  'v1-baseline',
  'Standard FundabilityOS 8-dimension scoring rubric. Score 0-100. Realistic VC acceptance rate calibration (only top 5-10% should score above 75).',
  true,
  100
) ON CONFLICT (version_name) DO NOTHING;
