-- Populate initial Golden Benchmarks for localized learning
INSERT INTO benchmarks (name, region, sector, target_stage, metrics, expected_score, rationale)
VALUES 
(
    'SaaS Seed Baseline (SEA)', 
    'SE Asia', 
    'SaaS', 
    'Seed', 
    '{
        "monthly_revenue": 5000,
        "team_size": 3,
        "runway_months": 15,
        "target_raise": 750000,
        "market_size": "Growing regional SaaS"
    }'::jsonb, 
    78, 
    'Standard Series Seed metrics for SE Asia. Requires moderate traction ($5k+ MRR) and a complete founding team (Hacker, Hipster, Hustler).'
),
(
    'Enterprise SaaS Series A (US)', 
    'US', 
    'Enterprise SaaS', 
    'Series A', 
    '{
        "monthly_revenue": 125000,
        "team_size": 12,
        "runway_months": 18,
        "target_raise": 12000000,
        "market_size": "Large Enterprise"
    }'::jsonb, 
    92, 
    'Post-PMF institutional grade. $1M+ ARR with 10% MoM growth. Strong US enterprise presence and specialized team.'
),
(
    'DeepTech Pre-Seed (Global)', 
    'Global', 
    'DeepTech / AI', 
    'Pre-Seed', 
    '{
        "monthly_revenue": 0,
        "team_size": 4,
        "runway_months": 9,
        "target_raise": 1500000,
        "market_size": "New Market Creator"
    }'::jsonb, 
    65, 
    'High-risk/High-reward signal. Pre-revenue but team includes multiple PhDs / Specialists with unique IP. Valuation based on "Team + IP" moats.'
);
