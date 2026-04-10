-- Create Benchmarks Table for Golden Profiles
CREATE TABLE IF NOT EXISTS benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT 'Global', -- e.g. 'US', 'SE Asia', 'Europe'
    sector TEXT NOT NULL DEFAULT 'SaaS',
    target_stage TEXT NOT NULL DEFAULT 'Seed',
    
    -- High-level metrics only as per user feedback
    metrics JSONB NOT NULL DEFAULT '{
        "monthly_revenue": 0,
        "team_size": 1,
        "runway_months": 12,
        "target_raise": 0,
        "market_size": "Unknown"
    }'::jsonb,
    
    expected_score INTEGER CHECK (expected_score >= 0 AND expected_score <= 100),
    rationale TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for regional filtering
CREATE INDEX IF NOT EXISTS idx_benchmarks_region ON benchmarks(region);
