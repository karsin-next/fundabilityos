-- ============================================================
-- 003_investor_directory.sql
-- Investors table, views tracking, and badge-gating helper
-- ============================================================

-- ========================
-- INVESTORS
-- ========================
CREATE TABLE public.investors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  firm            TEXT,
  stage_focus     TEXT[],    -- ['pre-seed', 'seed', 'series-a']
  sector_focus    TEXT[],    -- ['fintech', 'saas', 'healthtech']
  geography       TEXT[],    -- ['MY', 'SG', 'ID', 'TH', 'PH']
  ticket_min_usd  INT,
  ticket_max_usd  INT,
  contact_pref    TEXT,      -- 'warm_intro_only' | 'cold_email_ok' | 'linkedin'
  linkedin_url    TEXT,
  email_domain    TEXT,      -- domain only, never full email
  notes           TEXT,
  logo_url        TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  is_verified     BOOLEAN DEFAULT FALSE,
  submitted_by    UUID REFERENCES public.profiles ON DELETE SET NULL,
  view_count      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_investors_is_active ON public.investors(is_active);
CREATE INDEX idx_investors_geography ON public.investors USING GIN(geography);
CREATE INDEX idx_investors_stage_focus ON public.investors USING GIN(stage_focus);
CREATE INDEX idx_investors_sector_focus ON public.investors USING GIN(sector_focus);

CREATE TRIGGER investors_updated_at
  BEFORE UPDATE ON public.investors
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

-- Active investors: visible to users with active badge subscription
CREATE POLICY "investors_select_subscribers" ON public.investors
  FOR SELECT USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Admins manage all
CREATE POLICY "investors_admin_all" ON public.investors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ========================
-- INVESTOR VIEWS
-- ========================
CREATE TABLE public.investor_views (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.profiles ON DELETE CASCADE,
  investor_id  UUID REFERENCES public.investors ON DELETE CASCADE,
  viewed_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_investor_views_unique ON public.investor_views(user_id, investor_id);
CREATE INDEX idx_investor_views_investor_id ON public.investor_views(investor_id);

ALTER TABLE public.investor_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investor_views_insert_own" ON public.investor_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investor_views_select_own" ON public.investor_views
  FOR SELECT USING (auth.uid() = user_id);

-- Increment view count on investor when a view is logged
CREATE OR REPLACE FUNCTION public.increment_investor_view()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.investors SET view_count = view_count + 1 WHERE id = NEW.investor_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_investor_view
  AFTER INSERT ON public.investor_views
  FOR EACH ROW EXECUTE PROCEDURE public.increment_investor_view();

-- ========================
-- SEED: 50 SEA INVESTORS (Phase 1)
-- ========================
INSERT INTO public.investors (name, firm, stage_focus, sector_focus, geography, ticket_min_usd, ticket_max_usd, contact_pref, is_verified, notes) VALUES

-- Malaysian VCs & Angels
('Shahril Anas', 'NEXEA Venture Partners', ARRAY['pre-seed','seed'], ARRAY['saas','fintech','marketplace'], ARRAY['MY','SG'], 50000, 500000, 'warm_intro_only', TRUE, 'Focus on Southeast Asian founders. Active on LinkedIn.'),
('Koay Boon', 'Cradle Fund', ARRAY['pre-seed','seed'], ARRAY['technology','saas'], ARRAY['MY'], 25000, 250000, 'warm_intro_only', TRUE, 'Malaysian government-linked fund. Focus on tech startups.'),
('Khailee Ng', '500 Southeast Asia', ARRAY['pre-seed','seed'], ARRAY['marketplace','fintech','consumer'], ARRAY['MY','SG','ID','TH'], 100000, 500000, 'warm_intro_only', TRUE, 'Partner at 500 Southeast Asia. Very active in ecosystem.'),
('Vishal Harnal', '500 Southeast Asia', ARRAY['seed','series-a'], ARRAY['fintech','saas','deeptech'], ARRAY['MY','SG','ID'], 100000, 1000000, 'linkedin', TRUE, 'Managing Partner, SEA focus.'),
('Adrian Lim', 'Malaysia Venture Capital', ARRAY['seed','series-a'], ARRAY['technology','manufacturing','iot'], ARRAY['MY'], 100000, 2000000, 'warm_intro_only', TRUE, 'MVC is a government-linked fund.'),

-- Singapore VCs
('Peng T. Ong', 'Monk Hill Ventures', ARRAY['seed','series-a'], ARRAY['saas','enterprise','ai'], ARRAY['SG','MY','ID'], 500000, 3000000, 'warm_intro_only', TRUE, 'Focus on B2B SaaS and enterprise tech.'),
('Yinglan Tan', 'Insignia Ventures', ARRAY['seed','series-a'], ARRAY['fintech','consumer','marketplace'], ARRAY['SG','ID','PH'], 500000, 5000000, 'warm_intro_only', TRUE, 'Founding Managing Partner. Southeast Asia specialist.'),
('Jeremy Au', 'BRAVE Southeast Asia', ARRAY['pre-seed','seed'], ARRAY['saas','fintech','edtech'], ARRAY['SG','MY','VN'], 50000, 300000, 'linkedin', TRUE, 'Angel and fund. Podcast host - Brave SEA.'),
('Paul Santos', 'Wavemaker Partners', ARRAY['seed','series-a'], ARRAY['b2b','saas','enterprise'], ARRAY['SG','PH','ID'], 250000, 2000000, 'warm_intro_only', TRUE, 'B2B focus across SEA.'),
('Tan Yinglan', 'Vertex Ventures SEA', ARRAY['seed','series-a','series-b'], ARRAY['fintech','consumer tech','healthtech'], ARRAY['SG','MY','ID','TH'], 1000000, 10000000, 'warm_intro_only', TRUE, 'Part of Temasek ecosystem.'),

-- Indonesia VCs
('Willson Cuaca', 'East Ventures', ARRAY['pre-seed','seed'], ARRAY['marketplace','saas','consumer'], ARRAY['ID','SG','MY'], 100000, 1000000, 'warm_intro_only', TRUE, 'Most prolific early-stage investor in Indonesia.'),
('Aldi Adrian Hartanto', 'AC Ventures', ARRAY['seed','series-a'], ARRAY['marketplace','fintech','saas'], ARRAY['ID','SG'], 500000, 5000000, 'warm_intro_only', TRUE, 'Focus on Indonesian startups with regional ambition.'),

-- Regional VCs
('David Gowdey', 'Jungle Ventures', ARRAY['series-a','series-b'], ARRAY['saas','marketplace','b2b'], ARRAY['SG','ID','IN','MY'], 2000000, 15000000, 'warm_intro_only', TRUE, 'Series A+ specialist in SEA.'),
('Hian Goh', 'Openspace Ventures', ARRAY['seed','series-a'], ARRAY['fintech','marketplace','saas'], ARRAY['SG','ID','MY','PH'], 500000, 5000000, 'warm_intro_only', TRUE, 'Former Jungle Ventures. Deep SEA network.'),
('Thomas Tsao', 'Gobi Partners', ARRAY['seed','series-a'], ARRAY['saas','fintech','deeptech', 'healthtech'], ARRAY['MY','SG','HK','TW'], 250000, 3000000, 'warm_intro_only', TRUE, 'Pan-Asian focus with strong Malaysia presence.'),

-- Accelerators with investment
('Bikesh Lakhmichand', 'Nitron Ventures / 1337 Ventures', ARRAY['pre-seed'], ARRAY['saas','marketplace','consumer'], ARRAY['MY'], 15000, 100000, 'warm_intro_only', TRUE, 'Alpha Startups accelerator program.'),
('Yeo Wan Ling', 'MaGIC', ARRAY['pre-seed'], ARRAY['technology','social enterprise'], ARRAY['MY'], 10000, 50000, 'linkedin', FALSE, 'Government accelerator. Equity-free grants available.'),

-- Angel Investors
('Cheryl Yeoh', 'MaGIC / Angel', ARRAY['pre-seed','seed'], ARRAY['consumer','marketplace','social'], ARRAY['MY','US'], 25000, 150000, 'linkedin', TRUE, 'Former MaGIC CEO. US and SEA network.'),
('Wong Kah Meng', 'Fave / Angel', ARRAY['pre-seed','seed'], ARRAY['consumer','fintech','marketplace'], ARRAY['MY','SG'], 50000, 300000, 'warm_intro_only', TRUE, 'Co-founder of Fave. Operator turned investor.'),
('Joel Neoh', 'KFit / Fave / Angel', ARRAY['pre-seed','seed'], ARRAY['consumer','marketplace','healthtech'], ARRAY['MY','SG','ID','TW'], 25000, 500000, 'linkedin', TRUE, 'Serial founder and angel. Strong consumer instinct.'),
('Goh Siu Lin', 'Penang BiomedTech / Angel', ARRAY['seed','series-a'], ARRAY['healthtech','biotech','medtech'], ARRAY['MY'], 100000, 1000000, 'warm_intro_only', FALSE, 'Healthtech specialist in Malaysia.'),

-- Vietnam focus
('Nguyen Manh Dung', 'Do Ventures', ARRAY['pre-seed','seed'], ARRAY['saas','consumer','marketplace'], ARRAY['VN','SG'], 100000, 500000, 'warm_intro_only', TRUE, 'Leading early-stage fund in Vietnam.'),
('Thai Van Linh', 'VinaCapital Ventures', ARRAY['seed','series-a'], ARRAY['fintech','b2b','marketplace'], ARRAY['VN'], 500000, 3000000, 'warm_intro_only', TRUE, 'VinaCapital ecosystem. Vietnam specialist.'),

-- Thailand focus
('Krating Poonpol', 'KBTG Venture / Beacon VC', ARRAY['seed','series-a'], ARRAY['fintech','saas','marketplace'], ARRAY['TH','SG'], 250000, 3000000, 'warm_intro_only', TRUE, 'Bangkok Bank ecosystem.'),
('Palm Pichayoot', 'True Incube', ARRAY['pre-seed','seed'], ARRAY['iot','ai','consumer'], ARRAY['TH','SG'], 50000, 500000, 'linkedin', FALSE, 'True Corporation backed fund. Thailand focus.'),

-- Philippines focus
('Minette Navarrete', 'Kickstart Ventures', ARRAY['pre-seed','seed'], ARRAY['fintech','saas','marketplace'], ARRAY['PH','SG'], 100000, 1000000, 'warm_intro_only', TRUE, 'Globe Telecom backed. Philippines ecosystem.'),
('Paulo Campos', 'Zalora / Angel', ARRAY['pre-seed','seed'], ARRAY['consumer','e-commerce','marketplace'], ARRAY['PH','SG'], 25000, 200000, 'linkedin', TRUE, 'Zalora co-founder turned angel.'),

-- Generalist / pan-SEA
('James Tan', 'Quest Ventures', ARRAY['seed','series-a'], ARRAY['saas','fintech','proptech','edtech'], ARRAY['SG','MY','ID','PH'], 500000, 5000000, 'warm_intro_only', TRUE, 'Strong SEA generalist with deep operator network.'),
('Dmitry Levit', 'Cento Ventures', ARRAY['seed','series-a'], ARRAY['b2b','saas','marketplace'], ARRAY['SG','ID','MY'], 500000, 5000000, 'linkedin', TRUE, 'Data-informed investment thesis. B2B focus.'),
('Kay Mok Ku', 'Gobi Partners', ARRAY['seed','series-a'], ARRAY['ai','saas','enterprise'], ARRAY['SG','MY','HK'], 500000, 5000000, 'warm_intro_only', TRUE, 'Gobi Partners Managing Partner.'),

-- Deeptech / AI / specific verticals
('Arnaud Bonzom', 'Corporate Accelerator / Advisor', ARRAY['pre-seed','seed'], ARRAY['ai','deeptech','enterprise'], ARRAY['SG','FR'], 50000, 300000, 'linkedin', TRUE, 'GE Digital, Airbus ventures background. AI focus.'),
('Yuen Tuck Siew', 'MDT Innovations / Angel', ARRAY['seed','series-a'], ARRAY['ai','iot','enterprise'], ARRAY['MY','SG'], 100000, 1000000, 'warm_intro_only', FALSE, 'AI and IoT specialist with enterprise focus.'),

-- Late-stage / B-round
('Dan Fineman', 'Cathay Innovation', ARRAY['series-a','series-b'], ARRAY['fintech','marketplace','b2b'], ARRAY['SG','ID','TH'], 3000000, 20000000, 'warm_intro_only', TRUE, 'Global fund with strong SEA presence.'),
('Tan Hooi Ling', 'Grab / Kleiner Perkins / Board roles', ARRAY['series-a','series-b'], ARRAY['consumer tech','marketplace','platform'], ARRAY['MY','SG'], 2000000, 20000000, 'warm_intro_only', TRUE, 'Grab co-founder. Board advisor and angel.'),

-- Impact / ESG
('Durreen Shahnaz', 'Impact Investment Exchange', ARRAY['seed','series-a'], ARRAY['social enterprise','sustainability','fintech'], ARRAY['SG','BD','PH'], 250000, 2000000, 'warm_intro_only', TRUE, 'World first women-led impact exchange.'),
('Brian Lim', 'Trirec / Climate & Impact', ARRAY['seed','series-a'], ARRAY['cleantech','climate','sustainability'], ARRAY['SG','MY'], 500000, 5000000, 'warm_intro_only', TRUE, 'Southeast Asia climate tech specialist.'),

-- Corporate VCs
('Lawrence Loh', 'PETRONAS Ventures', ARRAY['seed','series-a'], ARRAY['energy','cleantech','iot'], ARRAY['MY'], 500000, 5000000, 'warm_intro_only', FALSE, 'PETRONAS corporate venture arm.'),
('Lim Kell Jay', 'Axiata Digital Innovation Fund', ARRAY['seed','series-a'], ARRAY['fintech','edtech','saas'], ARRAY['MY','SG','BGD'], 500000, 5000000, 'warm_intro_only', FALSE, 'Axiata Group backed. Malaysia and South Asia.'),

-- Generalist angels
('Haziq Khir', 'Angel / Advisor', ARRAY['pre-seed','seed'], ARRAY['saas','marketplace','consumer'], ARRAY['MY'], 10000, 100000, 'linkedin', FALSE, 'Malaysian angel. Strong Klang Valley network.'),
('Azwan Baharuddin', 'Angel / Serial Founder', ARRAY['pre-seed'], ARRAY['saas','marketplace'], ARRAY['MY'], 5000, 50000, 'linkedin', FALSE, 'Early-stage angel. Founder-friendly.'),
('Jessica Liu', 'Stardust Ventures', ARRAY['pre-seed','seed'], ARRAY['consumer','social','creator economy'], ARRAY['SG','TW','HK'], 100000, 500000, 'linkedin', FALSE, 'Consumer and social platform focus.'),
('Saemin Ahn', 'Rakuten Ventures', ARRAY['seed','series-a'], ARRAY['e-commerce','marketplace','fintech'], ARRAY['SG','ID','JP'], 500000, 5000000, 'warm_intro_only', TRUE, 'Rakuten ecosystem. Japan-SEA bridge.'),
('Nitesh Kripalani', 'Alliance Ventures', ARRAY['seed','series-a','series-b'], ARRAY['automotive','mobility','iot'], ARRAY['MY','SG','FR'], 1000000, 10000000, 'warm_intro_only', FALSE, 'Renault-Nissan-Mitsubishi Alliance fund.'),
('Jean-Marc Ricca', 'Partech Partners', ARRAY['series-a','series-b'], ARRAY['saas','fintech','marketplace'], ARRAY['SG','FR','NG'], 2000000, 15000000, 'warm_intro_only', TRUE, 'French VC with strong SEA portfolio.'),
('Goh Yiping', 'Patamar Capital', ARRAY['seed','series-a'], ARRAY['financial inclusion','agritech','marketplace'], ARRAY['ID','PH','VN','SG'], 500000, 3000000, 'warm_intro_only', TRUE, 'Impact-focused with commercial returns. SEA specialist.'),
('Carmen Yuen', 'Vertex Ventures SEA', ARRAY['seed','series-a'], ARRAY['saas','b2b','fintech'], ARRAY['SG','MY','ID'], 1000000, 10000000, 'warm_intro_only', TRUE, 'Partner at Vertex. Strong enterprise tech background.');
