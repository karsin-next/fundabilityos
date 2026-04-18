-- Seed real SE Asian Golden Profiles
DELETE FROM benchmarks WHERE name IN ('SG Fintech Anchor', 'ID Logistics Prime', 'VN Edtech Emerging');

INSERT INTO benchmarks (name, region, sector, target_stage, metrics, expected_score, rationale)
VALUES 
(
    'SG Fintech Anchor', 
    'SE Asia', 
    'Fintech', 
    'Seed', 
    '{
        "monthly_revenue": 45000,
        "team_size": 3,
        "runway_months": 18,
        "target_raise": 1500000,
        "market_size": "Regional SEA"
    }'::jsonb,
    85,
    'Top-tier Singapore fintech profile. Team contains ex-Ant/Grab founders. Strong unit economics with verified 15% WoW growth. Regional expansion plan is clearly mapped.'
),
(
    'ID Logistics Prime', 
    'SE Asia', 
    'Logistics', 
    'Series A', 
    '{
        "monthly_revenue": 210000,
        "team_size": 5,
        "runway_months": 12,
        "target_raise": 7000000,
        "market_size": "Indonesia Nationwide"
    }'::jsonb,
    92,
    'Dominant Indonesian logistics play. Achieved EBITDA breakeven in 3 major cities. Proprietary mesh-network tech reducing last-mile delivery cost by 22% vs competitors.'
),
(
    'VN Edtech Emerging', 
    'SE Asia', 
    'Edtech', 
    'Seed', 
    '{
        "monthly_revenue": 12000,
        "team_size": 2,
        "runway_months": 24,
        "target_raise": 800000,
        "market_size": "Vietnam K-12"
    }'::jsonb,
    75,
    'High-growth Vietnamese K-12 platform. Low CAC due to strong partnership with local schools. Team lacks international scaling experience but has hyper-localized content moat.'
);
