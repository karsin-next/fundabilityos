-- Create Prompt Registry for A/B Testing
CREATE TABLE IF NOT EXISTS prompt_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- 'interview', 'analysis'
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store Reasoning Traces (Agentic Self-Correction)
CREATE TABLE IF NOT EXISTS reasoning_traces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES audit_responses(id) ON DELETE CASCADE,
    primary_thought TEXT,
    critic_thought TEXT,
    consensus_delta TEXT,
    prompt_version_id UUID REFERENCES prompt_registry(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Prompt Versioning to existing audit responses
ALTER TABLE audit_responses ADD COLUMN IF NOT EXISTS prompt_version_id UUID REFERENCES prompt_registry(id);
