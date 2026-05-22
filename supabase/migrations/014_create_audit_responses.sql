-- Migration: Create audit_responses table
-- Creates the table storing the answers and scores for the 10 due diligence gates.

CREATE TABLE IF NOT EXISTS public.audit_responses (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  selected_option TEXT,
  open_text TEXT,
  score_value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.audit_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Select own responses
CREATE POLICY select_own_responses ON public.audit_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Insert own responses
CREATE POLICY insert_own_responses ON public.audit_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Update own responses
CREATE POLICY update_own_responses ON public.audit_responses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Delete own responses
CREATE POLICY delete_own_responses ON public.audit_responses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Admin select all
CREATE POLICY admin_select_all ON public.audit_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.is_admin = TRUE)
    )
  );

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_audit_responses_updated_at
  BEFORE UPDATE ON public.audit_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
