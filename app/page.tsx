/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, CheckCircle2, AlertCircle, TrendingUp, Users, FileText, Shield, Zap, Sparkles, LayoutDashboard, Database, Globe, Lock } from "lucide-react";
import ScoreGaugeMock from "@/components/score/ScoreGaugeMock";
import QuickAssess from "@/components/assessment/QuickAssess";
import ScoreDashboard from "@/components/assessment/ScoreDashboard";
import LeadCaptureGate from "@/components/auth/LeadCaptureGate";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { ScoringResult } from "@/lib/scoring";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Answer AI Questions",
    desc: "Our AI walks you through the exact topics investors probe. No jargon. 5–10 minutes. Fully dynamic based on your sector.",
    icon: <Zap size={20} />,
  },
  {
    step: "02",
    title: "Get Your Fundability Score",
    desc: "Receive a 0–100 score across 8 investor-critical dimensions. See exactly which gaps will cost you the deal.",
    icon: <TrendingUp size={20} />,
  },
  {
    step: "03",
    title: "Fix Gaps. Raise With Confidence.",
    desc: "Get your full Investor-Ready Report, join the FundabilityOS Verified directory, and start conversations knowing where you stand.",
    icon: <CheckCircle size={20} />,
  },
];

const PROBLEMS = [
  {
    headline: "You don&apos;t know your gaps until investors reject you.",
    sub: "Most founders discover their weaknesses in the room — when it&apos;s already too late to fix them.",
  },
  {
    headline: "You&apos;re guessing what investors actually want.",
    sub: "VCs evaluate 8 specific dimensions. Most founders prepare for 3. The other 5 kill deals silently.",
  },
  {
    headline: "Fundraising without data is just hoping.",
    sub: "FundabilityOS gives you a score, a gap analysis, and a 30-day action plan — before you pitch a single investor.",
  },
];

const FOR_WHO = [
  {
    tag: "FIRST-TIME FUNDRAISERS",
    headline: "Never been in a VC room?",
    desc: "Know what they'll ask and how you score before your first meeting.",
    icon: <Users size={18} />,
  },
  {
    tag: "ACCELERATOR APPLICANTS",
    headline: "Applying to NEXEA, YC, or MaGIC?",
    desc: "Accelerators use the same frameworks. See where you stand against their criteria.",
    icon: <FileText size={18} />,
  },
  {
    tag: "EXPERIENCED FOUNDERS",
    headline: "Closing a bridge or Series A?",
    desc: "Know your score in this market. Investors are pickier now. Don&apos;t walk in unprepared.",
    icon: <Shield size={18} />,
  },
];

const IMPACT_METRICS = [
  { label: "Value Creation", value: "RM 60.8M" },
  { label: "International Markets", value: "12" },
  { label: "Innovators Facilitated", value: "118" },
  { label: "Global Companies Landed", value: "25" }
];

const CASE_STUDIES = [
  { tag: "AgriTech / Carbon", title: "Carbon-negative microalgae", desc: "Proprietary systems transforming waste into regenerative soil input. Scaled to 700+ tanks in Malaysia.", meta: "700+ TANKS • PILOTS IN JAPAN" },
  { tag: "BioTech / Agri", title: "Livestock immunity booster", desc: "Coconut-oil multivitamin reducing mortality 90%. Improved income 41% cutting medication costs.", meta: "90% MORTALITY REDUCTION" },
  { tag: "B2B SaaS / EdTech", title: "Centre Management Ecosystem", desc: "Comprehensive SaaS for tuition centres supporting 2,700 locations across 5 ASEAN countries. Raised RM 8M.", meta: "2,700 CENTRES • RM 8M RAISED" },
  { tag: "Robotics / F&B", title: "AI-powered Robotic Barista", desc: "Autonomous robot ecosystem serving 200 cups/hour. Deployed in transport hubs across 6 countries.", meta: "RM 350M VALUATION • 6 COUNTRIES" },
  { tag: "IoT / Logistics", title: "AI-driven fleet telematics", desc: "Comprehensive management platform combining GPS, IoT sensors. Collected 2.6B data points for optimization.", meta: "2.6B DATA POINTS • ASEAN SCALE" },
  { tag: "Web3 / Network", title: "Bandwidth sharing network", desc: "App allowing users to share unused WiFi, creating affordable access. 85,000 hotspots worldwide.", meta: "85,000 HOTSPOTS • GLOBAL" },
  { tag: "HealthTech / Dx", title: "Point-of-care diagnostics", desc: "Portable rapid testing platform for infectious diseases delivering lab-grade results in 15 minutes at rural clinics.", meta: "15-MIN RESULTS • RURAL IMPACT" },
  { tag: "CleanTech / Solar", title: "Micro-grid solar distribution", desc: "Pay-as-you-go solar micro-grids powering off-grid communities. IoT-monitored distribution across 4 provinces.", meta: "4 PROVINCES • IoT MONITORED" },
  { tag: "FinTech / Shariah", title: "Ethical micro-lending", desc: "Digital platform enabling ethical financing for underbanked SMEs with AI credit scoring. Shariah-compliant.", meta: "AI CREDIT SCORING • SME FOCUS" }
];

const PRICING = [
  {
    name: "Free Diagnostic",
    price: "$0",
    period: "",
    desc: "Basic fundability score and generic gap analysis.",
    features: [
      "Dynamic AI interview",
      "Fundability Score (0–100)",
      "Generic Gap Analysis",
      "No Data Persistence",
    ],
    cta: "Start Free",
    href: "/interview",
    featured: false,
  },
  {
    name: "Startup Pro",
    price: "$29",
    period: "/mo",
    desc: "Continuous monitoring for serious founders.",
    features: [
      "Full 8-dimension breakdown",
      "Continuous Score Monitoring",
      "Step-by-step Roadmap",
      "1 Verified Integration (Plaid/LinkedIn)",
      "Daily Predictive Updates",
    ],
    cta: "Get Pro Access",
    href: "/checkout",
    featured: true,
  },
  {
    name: "Startup Scale",
    price: "$59",
    period: "/mo",
    desc: "Elite fundraising suite with multiple verifications.",
    features: [
      "Everything in Pro",
      "Unlimited Verified Integrations",
      "Priority Curation to Investors",
      "Investor Feedback Loop Access",
      "Advanced Action Plan",
    ],
    cta: "Get Scale Access",
    href: "/checkout",
    featured: false,
  },
  {
    name: "Investor Pro",
    price: "$499",
    period: "/mo",
    desc: "The professional deal flow standard.",
    features: [
      "Real-time startup trends",
      "Score > 75 Curated Feed",
      "Direct Feedback Loop to AI",
      "Custom Signal Thresholds",
      "Verified Deal Verification",
    ],
    cta: "Contact Sales",
    href: "/auth/signup?role=investor",
    featured: false,
  },
];

const STARTUP_PRICING = PRICING.filter(p => p.name !== "Investor Pro");
const INVESTOR_PRICING = PRICING.filter(p => p.name === "Investor Pro");

function PricingTabs() {
  const [activeTab, setActiveTab] = useState<"startup" | "investor">("startup");
  const plans = activeTab === "startup" ? STARTUP_PRICING : INVESTOR_PRICING;

  return (
    <div>
      {/* Tab buttons */}
      <div style={{ display: "flex", gap: "0", marginBottom: "2.5rem", border: "1px solid rgba(255,216,0,0.15)", borderRadius: "2px", overflow: "hidden", maxWidth: "320px" }}>
        {(["startup", "investor"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "0.75rem 1rem", fontSize: "0.65rem", fontWeight: 900,
              letterSpacing: "0.15em", textTransform: "uppercase", border: "none", cursor: "pointer",
              transition: "all 0.2s ease",
              backgroundColor: activeTab === tab ? "var(--yellow)" : "transparent",
              color: activeTab === tab ? "var(--navy)" : "rgba(255,255,255,0.45)",
              fontFamily: "inherit",
            }}
          >
            {tab === "startup" ? "For Startups" : "For Investors"}
          </button>
        ))}
      </div>

      {/* Pricing cards */}
      <div
        style={{ display: "grid", gridTemplateColumns: activeTab === "startup" ? "repeat(3, 1fr)" : "1fr", gap: "2rem", alignItems: "start", maxWidth: activeTab === "investor" ? "420px" : "100%" }}
        className="pricing-grid"
      >
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`pricing-card flex flex-col h-full ${plan.featured ? "pricing-card-featured shadow-2xl scale-[1.02]" : ""}`}
            style={{ backgroundColor: "var(--navy)", padding: "2.5rem", borderRadius: "0", border: plan.featured ? "3px solid var(--yellow)" : "1px solid rgba(255,216,0,0.1)" }}
          >
            <div>
              <p className="label-mono" style={{ color: "var(--yellow)", marginBottom: "0.75rem", fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em" }}>
                {plan.name}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                <span style={{ fontSize: "3rem", fontWeight: 900, color: "var(--white)", lineHeight: 1, letterSpacing: "-0.05em" }}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                    {plan.period}
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.825rem", color: "rgba(255,255,255,0.45)", marginTop: "0.75rem", lineHeight: 1.6 }}>
                {plan.desc}
              </p>
            </div>
            <div className="yellow-bar-full" style={{ margin: "2rem 0", height: "1px", backgroundColor: "rgba(255,216,0,0.1)" }} />
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.9rem", listStyle: "none", padding: 0, margin: 0, marginBottom: "3.5rem" }}>
              {plan.features.map((f) => (
                <li key={f} style={{ display: "flex", gap: "0.75rem", fontSize: "0.825rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                  <CheckCircle size={14} style={{ color: "var(--yellow)", flexShrink: 0, marginTop: "2px" }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`btn mt-auto ${plan.featured ? "btn-primary shadow-xl" : "btn-ghost border-white/20 text-white hover:bg-white hover:text-var(--navy)"}`}
              style={{ width: "100%", justifyContent: "center", fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [showAssessment, setShowAssessment] = useState(false);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const CACHE_KEY = user?.id ? `FUNDABILITY_QA_${user.id}` : "FUNDABILITY_QA_GUEST";
  const supabase = createClient();

  // Sync state between LocalStorage and Supabase
  useEffect(() => {
    async function hydrateScore() {
      // 1. If NOT authenticated, check Guest Cache (Do not auto-show for guests to prevent "stuck" feeling)
      if (!user) {
        const guestCached = localStorage.getItem("FUNDABILITY_QA_GUEST");
        if (guestCached) {
          try {
            const parsed = JSON.parse(guestCached);
            setScoringResult(parsed);
            // We don't auto-set setShowAssessment(true) here for guests
            // so they can still see the main landing page hero.
          } catch (e) {}
        } else {
          setScoringResult(null);
          setShowAssessment(false);
        }
      }

      // 2. If authenticated, sync with Supabase (source of truth)
      if (user?.id) {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const latestReport = data[0];
          setScoringResult(latestReport);
          setShowAssessment(true);
          localStorage.setItem(`FUNDABILITY_QA_${user.id}`, JSON.stringify(latestReport));
        } else {
          // Check user-specific local cache if no DB report
          const userCached = localStorage.getItem(`FUNDABILITY_QA_${user.id}`);
          if (userCached) {
            try {
              const parsed = JSON.parse(userCached);
              setScoringResult(parsed);
              setShowAssessment(true);
            } catch (e) {}
          } else {
            setScoringResult(null);
            setShowAssessment(false);
          }
        }
      }
      setIsHydrated(true);
    }

    hydrateScore();
  }, [user, supabase]);

  const handleComplete = async (result: ScoringResult) => {
    setScoringResult(result);
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));

    if (user?.id) {
      try {
        await fetch("/api/reports/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...result, user_id: user.id })
        });
      } catch (e) {}
    }
  };

  const handleReset = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem("FUNDABILITY_QA_LATEST");
    setScoringResult(null);
    setShowAssessment(false);
  };

  if (!isHydrated) return null;

  return (
    <div style={{ paddingTop: "68px" }}>

      {/* =============================================
          SECTION 1: HERO & ASSESSMENT (dark navy)
         ============================================= */}
      <section
        className="section-dark"
        style={{ paddingTop: "clamp(2rem, 4vw, 3rem)", paddingBottom: "clamp(2rem, 4vw, 3rem)", minHeight: "auto", display: "flex", alignItems: "center" }}
      >
        <div className="container">
            <div
            style={{
              display: "grid",
              gridTemplateColumns: (scoringResult && showAssessment) ? "1fr" : "1fr 1fr",
              gap: "4rem",
              alignItems: scoringResult ? "start" : "center",
              transition: "all 0.5s ease"
            }}
            className="hero-grid"
          >
            {/* Left / Main Content */}
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "2rem", 
              maxWidth: (scoringResult && showAssessment) ? "800px" : "100%", 
              margin: (scoringResult && showAssessment) ? "0 auto" : "0",
              textAlign: (scoringResult && showAssessment) ? "center" : "left"
            }}>
              <div className="animate-fade-in-up" style={{ marginTop: "-2rem" }}>
                <span className="tag-badge" style={{ letterSpacing: "0.25em" }}>
                  BECOME FUNDABLE. FASTER.
                </span>
              </div>

              <h1 className="heading-hero animate-fade-in-up delay-100" style={{ color: "var(--white)" }}>
                Know Your <br/><span className="text-gradient">Fundability Score</span> <br/>in 10 Minutes.
              </h1>

              <p
                className="animate-fade-in-up delay-200 font-sans"
                style={{
                  fontSize: "1.125rem",
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.8,
                  maxWidth: "34rem",
                  fontWeight: 500,
                  margin: scoringResult ? "0 auto" : "0"
                }}
              >
                Answer AI questions or upload your pitch deck. Get a score (0–100) that shows exactly
                where you stand — and what investors will push back on before you pitch.
              </p>

              {!showAssessment && (
                <div
                  className="animate-fade-in-up delay-300"
                  style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center", marginTop: "1rem", justifyContent: scoringResult ? "center" : "flex-start" }}
                >
                  <button onClick={() => setShowAssessment(true)} className="btn btn-primary btn-lg shadow-[0_20px_40px_-10px_rgba(255,216,0,0.3)]">
                    Start Diagnostic — It&apos;s Free
                    <ArrowRight size={16} />
                  </button>
                  <Link href="/upload" className="btn btn-ghost border-white/10 hover:border-white/30 text-white/70 hover:text-white">
                    <Database className="w-4 h-4 mr-2" /> Pitchdeck Upload
                  </Link>
                </div>
              )}

              {/* Verified Proof Banner */}
              <div
                className="animate-fade-in-up delay-400"
                style={{
                  display: "flex",
                  gap: "2.5rem",
                  paddingTop: "2.5rem",
                  flexWrap: "wrap",
                  justifyContent: (scoringResult && showAssessment) ? "center" : "flex-start",
                  borderTop: showAssessment ? "1px solid rgba(255,255,255,0.05)" : "none",
                  marginTop: showAssessment ? "3rem" : "0"
                }}
              >
                {!showAssessment ? (
                   [
                    { value: "2,400+", label: "Founders Assessed" },
                    { value: "12", label: "Markets Covered" },
                    { value: "8", label: "Investor Dimensions" },
                  ].map((m) => (
                    <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                      <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--yellow)" }}>
                        {m.value}
                      </span>
                      <span className="label-metric">{m.label}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-12 justify-center flex-wrap">
                     <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-var(--yellow)" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-50/50">V4 Neural Engine</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-var(--yellow)" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-50/50">Real-time Benchmarking</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-var(--yellow)" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-50/50">Institutional Integrity</span>
                     </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right / Bottom Content */}
            <div className={(scoringResult && showAssessment) ? "w-full" : "hero-right w-full mt-12 md:mt-0"} style={{ animation: "fadeInAssessment 0.6s ease" }}>
              
              {!showAssessment && (
                <div className="animate-fade-in delay-200" style={{ display: "flex", justifyContent: "center" }}>
                  <div
                    style={{
                      border: "2px solid var(--yellow-20)",
                      borderRadius: "4px",
                      padding: "3rem",
                      background: "rgba(255,255,255,0.02)",
                      backdropFilter: "blur(12px)",
                      width: "100%",
                      maxWidth: "400px",
                      position: "relative",
                    }}
                    className="shadow-2xl"
                  >
                    <div style={{ position: "absolute", top: 0, left: 0, width: "4rem", height: "4px", backgroundColor: "var(--yellow)" }} />
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                      <span className="tag-badge" style={{ marginBottom: "1rem", backgroundColor: "var(--yellow)", color: "var(--navy)" }}>Institutional Fragment</span>
                    </div>
                    <ScoreGaugeMock score={74} band="Investor-Ready" />
                    <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {[
                        { label: "Product Readiness", score: 14, max: 15, color: "var(--green)" },
                        { label: "Revenue Model", score: 8, max: 20, color: "var(--amber)" },
                        { label: "Problem Severity", score: 12, max: 15, color: "var(--green)" },
                      ].map((dim) => (
                        <div key={dim.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{dim.label}</span>
                            <span style={{ fontSize: "0.7rem", fontWeight: 900, color: dim.color }}>{dim.score}/{dim.max}</span>
                          </div>
                          <div className="dimension-bar-track" style={{ height: "4px", background: "rgba(255,255,255,0.05)" }}>
                            <div className="dimension-bar-fill" style={{ width: `${(dim.score / dim.max) * 100}%`, backgroundColor: dim.color, height: "100%" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,216,0,0.1)" }}>
                      <button onClick={() => setShowAssessment(true)} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Get Verified Score</button>
                    </div>
                  </div>
                </div>
              )}

              {showAssessment && !scoringResult && (
                <div style={{ position: "relative", width: "100%", maxWidth: "600px", margin: "0 auto", background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", padding: "2rem", backdropFilter: "blur(12px)" }}>
                  <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}>
                    <button 
                      onClick={() => setShowAssessment(false)} 
                      className="text-white/50 hover:text-white"
                      title="Cancel Assessment"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  <div className="font-sans text-[0.95rem] tracking-normal">
                    <LeadCaptureGate>
                       <QuickAssess isEmbedded={true} onComplete={handleComplete} />
                    </LeadCaptureGate>
                  </div>
                </div>
              )}

              {showAssessment && scoringResult && (
                <ScoreDashboard scoringResult={scoringResult} handleReset={handleReset} />
              )}
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .hero-grid { grid-template-columns: 1fr !important; }
          }
          @keyframes fadeInAssessment {
            from { opacity: 0; transform: scale(0.99); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </section>

      {/* =============================================
          SECTION: 100% FREE FOR EARLY ADOPTERS
         ============================================= */}
      <section className="bg-white">
        <div className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="bg-white shadow-[0_45px_100px_-20px_rgba(2,47,66,0.1)] flex flex-col md:flex-row overflow-hidden border-b-[8px] border-[#ffd800]">
          <div className="bg-[#022f42] text-white p-12 md:w-2/5 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles size={120} />
            </div>
            <div className="inline-block px-4 py-1.5 bg-[#ffd800] text-[#022f42] text-[10px] font-black uppercase tracking-widest mb-8 self-start shadow-sm">
              100% Free for Early Adopters
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 leading-none">What does FundabilityOS do?</h2>
            <p className="text-[#b0d0e0] leading-relaxed mb-10 font-medium">
              FundabilityOS QuickAssess (QA) is a continuous diagnostic engine. It bridges the fatal gap between scaling startups and institutional investors by providing a dual-sided ecosystem.
            </p>
            <Link href="/methodology" className="flex items-center text-[#ffd800] font-black uppercase tracking-widest text-[10px] hover:translate-x-2 transition-transform">
              View our methodology <ArrowRight className="w-4 h-4 ml-3" />
            </Link>
          </div>
          <div className="p-12 md:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="w-14 h-14 bg-[#f2f6fa] rounded-sm flex items-center justify-center border-2 border-[#022f42]/5 shadow-sm">
                <Sparkles className="w-7 h-7 text-[#022f42]" />
              </div>
              <h4 className="text-2xl font-black text-[#022f42] uppercase tracking-tighter">For Startups</h4>
              <p className="text-[#1e4a62] text-sm leading-relaxed font-medium">
                Stop guessing what investors want. Compute your exact fundraising readiness score instantly, track your live burn rate, and access a tailored curriculum to fix tactical gaps before you pitch.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-14 h-14 bg-[#f2f6fa] rounded-sm flex items-center justify-center border-2 border-[#022f42]/5 shadow-sm">
                <Shield className="w-7 h-7 text-[#022f42]" />
              </div>
              <h4 className="text-2xl font-black text-[#022f42] uppercase tracking-tighter">For Investors</h4>
              <p className="text-[#1e4a62] text-sm leading-relaxed font-medium">
                Access an exclusive, highly-curated deal flow pipeline. Every startup on our platform is pre-vetted with certified MRR, runway verifications, and cap table integrity algorithms.
              </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          SECTION: IMPACT SNAPSHOT
         ============================================= */}
      <section className="max-w-[1280px] mx-auto px-6 py-12">
        <h2 className="text-5xl font-black text-[#ffd800] mb-8 uppercase tracking-tighter flex items-center gap-6">
          Impact Snapshot
          <div className="h-2 w-24 bg-[#ffd800]" />
        </h2>
        <div className="flex flex-wrap gap-12 bg-white p-12 shadow-[0_45px_100px_-20px_rgba(2,47,66,0.1)] border-t-[8px] border-[#022f42]">
          {IMPACT_METRICS.map((stat, i) => (
            <div key={i} className="flex-1 min-w-[180px]">
              <div className="text-4xl md:text-5xl font-black text-[#022f42] leading-none mb-4 tracking-tighter">{stat.value}</div>
              <div className="text-[#1e4a62] text-[10px] uppercase tracking-[0.2em] font-black">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* =============================================
          SECTION: CASE STUDIES
         ============================================= */}
      <section className="bg-[#ffd800] pb-24">
        <div className="max-w-[1280px] mx-auto px-6 py-12 border-t border-[#022f42]/5">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-black text-[#022f42] uppercase tracking-tighter mb-6">Case Studies: <br/> Innovators we accelerated</h2>
            <p className="text-lg text-[#1e4a62] font-medium leading-relaxed">
              Real stories from deep tech founders across Asia validating their business models through our system.
            </p>
          </div>
            </div>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CASE_STUDIES.map((item, i) => (
            <div
              key={i}
              className="bg-white p-10 shadow-[0_45px_100px_-20px_rgba(2,47,66,0.1)] border-b-4 border-transparent hover:border-[#ffd800] transition-all flex flex-col group hover:-translate-y-2 duration-300"
            >
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#ffd800] font-black mb-6">{item.tag}</div>
              <h4 className="text-2xl font-black text-[#022f42] mb-6 uppercase tracking-tighter leading-none group-hover:text-[#ffd800] transition-colors">{item.title}</h4>
              <p className="text-[#1e4a62] text-sm leading-relaxed mb-8 flex-grow font-medium">{item.desc}</p>
              <div className="font-black text-[9px] text-[#022f42]/30 uppercase tracking-[0.2em] border-t border-[rgba(2,47,66,0.05)] pt-6">
                {item.meta}
              </div>
            </div>
          ))}
        </div>
      </section>




      {/* =============================================
          SECTION 3: HOW IT WORKS (dark navy)
         ============================================= */}
      <section className="section-dark py-12" id="how-it-works">
        <div className="container">
          <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
            <span className="tag-badge">The FundabilityOS Roadmap to Capital</span>
            <span className="yellow-bar" style={{ margin: "1rem auto" }} />
            <h2 className="heading-section">
              From zero to investor-ready
              <br />in one diagnostic session.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1px",
              backgroundColor: "rgba(255,216,0,0.1)",
              border: "1px solid rgba(255,216,0,0.1)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
            className="steps-grid"
          >
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "var(--navy)",
                  padding: "3rem 2.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span
                    style={{
                      fontSize: "3rem",
                      fontWeight: 900,
                      color: "var(--yellow)",
                      opacity: 0.25,
                      letterSpacing: "-0.05em",
                      lineHeight: 1,
                    }}
                  >
                    {step.step}
                  </span>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "0",
                      backgroundColor: "rgba(255,216,0,0.05)",
                      border: "1px solid rgba(255,216,0,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--yellow)",
                    }}
                  >
                    {step.icon}
                  </div>
                </div>
                <h3 className="heading-card" style={{ color: "var(--white)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          SECTION 4: PRICING (off-white)
         ============================================= */}
      <section className="section-light py-12" id="pricing">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="tag-badge" style={{ backgroundColor: "var(--navy)", color: "var(--yellow)" }}>
              Scale Your Access
            </span>
            <span className="yellow-bar" style={{ margin: "1rem auto", backgroundColor: "var(--navy)", opacity: 0.15 }} />
            <h2 className="heading-section" style={{ color: "var(--navy)" }}>
              FundabilityOS Pricing
            </h2>
          </div>

          <PricingTabs />
        </div>
      </section>

      {/* =============================================
          SECTION 5: WHO IT'S FOR (off-white bento)
         ============================================= */}






      <style>{`
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .bento-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .who-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes fadeInAssessment {
          from { opacity: 0; transform: scale(0.99); translateY(4px); }
          to { opacity: 1; transform: scale(1); translateY(0); }
        }
      `}</style>
    </div>
  );
}
