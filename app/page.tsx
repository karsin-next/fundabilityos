"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, TrendingUp, Users, FileText, Shield, Zap, Sparkles, LayoutDashboard, Database, Globe, Lock } from "lucide-react";
import ScoreGaugeMock from "@/components/score/ScoreGaugeMock";
import QuickAssess from "@/components/assessment/QuickAssess";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

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

export default function HomePage() {
  const { user } = useAuth();
  const [showAssessment, setShowAssessment] = useState(false);
  const [scoringResult, setScoringResult] = useState<Record<string, any> | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const supabase = createClient();

  // Sync state between LocalStorage and Supabase
  useEffect(() => {
    async function hydrateScore() {
      // 1. Check LocalStorage (Fastest)
      const cached = localStorage.getItem("FUNDABILITY_QA_LATEST");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setScoringResult(parsed);
          setShowAssessment(true);
        } catch (e) {}
      }

      // 2. If authenticated, sync with Supabase
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
          // Update LocalStorage to keep in sync
          localStorage.setItem("FUNDABILITY_QA_LATEST", JSON.stringify(latestReport));
        }
      }
      setIsHydrated(true);
    }

    hydrateScore();
  }, [user, supabase]);

  const handleComplete = async (result: Record<string, any>) => {
    setScoringResult(result);
    // Persist to LocalStorage
    localStorage.setItem("FUNDABILITY_QA_LATEST", JSON.stringify(result));

    // If authenticated, save to Supabase via API
    if (user?.id) {
      try {
        await fetch("/api/reports/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...result, user_id: user.id })
        });
      } catch (e) {
        console.error("Failed to sync report to Supabase", e);
      }
    }
  };

  const handleReset = () => {
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
        style={{ paddingTop: "clamp(4rem, 8vw, 6.5rem)", paddingBottom: "clamp(4rem, 8vw, 6.5rem)", minHeight: "92vh", display: "flex", alignItems: "center" }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: showAssessment ? "1fr" : "1fr 1fr",
              gap: "4rem",
              alignItems: "center",
              transition: "all 0.5s ease"
            }}
            className="hero-grid"
          >
            {/* Left / Main Content */}
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "2rem", 
              maxWidth: showAssessment ? "800px" : "100%", 
              margin: showAssessment ? "0 auto" : "0",
              textAlign: showAssessment ? "center" : "left"
            }}>
              {!showAssessment ? (
                <>
                  <div className="animate-fade-in-up">
                    <span className="tag-badge" style={{ letterSpacing: "0.25em" }}>
                      V4 Institutional Engine • Asia Optimized
                    </span>
                  </div>

                  <h1 className="heading-hero animate-fade-in-up delay-100" style={{ color: "var(--white)" }}>
                    Know Your <br/><span className="text-gradient">Fundability Score</span> <br/>in 10 Minutes.
                  </h1>

                  <p
                    className="animate-fade-in-up delay-200"
                    style={{
                      fontSize: "1.125rem",
                      color: "rgba(255,255,255,0.6)",
                      lineHeight: 1.8,
                      maxWidth: "34rem",
                      fontWeight: 500
                    }}
                  >
                    Answer AI questions or upload your pitch deck. Get a score (0–100) that shows exactly
                    where you stand — and what investors will push back on before you pitch.
                  </p>

                  <div
                    className="animate-fade-in-up delay-300"
                    style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center", marginTop: "1rem" }}
                  >
                    <button onClick={() => setShowAssessment(true)} className="btn btn-primary btn-lg shadow-[0_20px_40px_-10px_rgba(255,216,0,0.3)]">
                      Start Diagnostic — It&apos;s Free
                      <ArrowRight size={16} />
                    </button>
                    <Link href="/upload" className="btn btn-ghost border-white/10 hover:border-white/30 text-white/70 hover:text-white">
                      <Database className="w-4 h-4 mr-2" /> Neural Deck Upload
                    </Link>
                  </div>
                </>
              ) : (
                <div style={{ width: "100%", animation: "fadeInAssessment 0.6s ease" }}>
                  <div className="animate-fade-in-up" style={{ marginBottom: "1.5rem" }}>
                    <span className="tag-badge" style={{ backgroundColor: "var(--yellow)", color: "var(--navy)" }}>
                      Live Neural Session
                    </span>
                  </div>
                  <h2 className="heading-hero" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "var(--white)", marginBottom: "3rem" }}>
                    {scoringResult ? "Analysis Complete" : "Evaluating Venture..."}
                  </h2>

                  {scoringResult ? (
                    <div className="results-dashboard animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Score Card */}
                        <div className="md:col-span-1 bg-white/5 border-2 border-white/10 p-10 text-center relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="w-8 h-8 text-[#ffd800]" /></div>
                           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd800] mb-4">Institutional Score</div>
                           <div className="text-7xl font-black text-white tracking-tighter mb-4">{scoringResult.score}</div>
                           <div className="bg-[#ffd800] text-[#022f42] px-3 py-1 font-black text-[10px] uppercase inline-block mb-6 tracking-widest">{scoringResult.band}</div>
                           <div className="h-1 w-full bg-white/10 mt-2">
                              <div className="h-full bg-[#ffd800] transition-all duration-1000" style={{ width: `${scoringResult.score}%` }}></div>
                           </div>
                        </div>

                        {/* Breakdown / Insights */}
                        <div className="md:col-span-2 space-y-8">
                           <div className="bg-white/5 border border-white/10 p-8">
                             <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                               <LayoutDashboard className="w-4 h-4" /> Venture Analysis
                             </h3>
                             <p className="text-sm text-blue-50/70 leading-relaxed font-medium">
                               {scoringResult.summary_paragraph}
                             </p>
                           </div>

                           <div className="flex gap-4">
                             <Link href="/dashboard" className="btn btn-primary btn-lg flex-1 group shadow-[0_20px_40px_-10px_rgba(255,216,0,0.3)]">
                                Enter Full Dashboard <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                             </Link>
                             <Link href="/checkout" className="btn btn-ghost btn-lg flex-1 border-white/20 text-white hover:bg-white hover:text-var(--navy)">
                                Unlock Full Report ($29)
                             </Link>
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <QuickAssess isEmbedded={true} onComplete={handleComplete} />
                  )}
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
                  justifyContent: showAssessment ? "center" : "flex-start",
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
                  <div className="flex items-center gap-12">
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

            {/* Right — Score Gauge Demo (Hidden during assessment) */}
            {!showAssessment && (
              <div className="animate-fade-in delay-200 hero-right" style={{ display: "flex", justifyContent: "center" }}>
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
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .hero-grid { grid-template-columns: 1fr !important; }
            .hero-right { display: none !important; }
          }
          @keyframes fadeInAssessment {
            from { opacity: 0; transform: scale(0.99); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </section>

      {/* =============================================
          SECTION 2: PROBLEM (off-white bento)
         ============================================= */}
      <section className="section-light" id="problem">
        <div className="container">
          <div style={{ marginBottom: "3rem" }}>
            <span className="tag-badge" style={{ backgroundColor: "var(--navy)", color: "var(--yellow)" }}>
              Market Reality Check
            </span>
            <span className="yellow-bar" style={{ backgroundColor: "var(--navy)", opacity: 0.15 }} />
            <h2 className="heading-section" style={{ color: "var(--navy)" }}>
              67% of ASEAN fundraises fail
              <br />due to{" "}
              <span style={{ color: "var(--yellow)", WebkitTextStroke: "1px var(--navy)", textShadow: "none" }}>
                preventable gaps.
              </span>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.5rem",
            }}
            className="bento-grid"
          >
            {PROBLEMS.map((p, i) => (
              <div key={i} className="card-bento-light" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--yellow)", opacity: 0.3, letterSpacing: "-0.05em" }}>
                  0{i + 1}
                </span>
                <h3 className="heading-card" style={{ color: "var(--navy)", fontSize: "0.95rem" }}>
                  {p.headline}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(2,47,66,0.6)", lineHeight: 1.7 }}>
                  {p.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          SECTION 3: HOW IT WORKS (dark navy)
         ============================================= */}
      <section className="section-dark" id="how-it-works">
        <div className="container">
          <div style={{ marginBottom: "3.5rem", textAlign: "center" }}>
            <span className="tag-badge">The Roadmap to Capital</span>
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
      <section className="section-light" id="pricing">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="tag-badge" style={{ backgroundColor: "var(--navy)", color: "var(--yellow)" }}>
              Scale Your Access
            </span>
            <span className="yellow-bar" style={{ margin: "1rem auto", backgroundColor: "var(--navy)", opacity: 0.15 }} />
            <h2 className="heading-section" style={{ color: "var(--navy)" }}>
              V4 Institutional Pricing
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "2rem",
              alignItems: "start",
            }}
            className="pricing-grid"
          >
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`pricing-card ${plan.featured ? "pricing-card-featured shadow-2xl scale-[1.02]" : ""}`}
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
                  className={`btn ${plan.featured ? "btn-primary shadow-xl" : "btn-ghost border-white/20 text-white hover:bg-white hover:text-var(--navy)"}`}
                  style={{ width: "100%", justifyContent: "center", fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          SECTION 5: WHO IT'S FOR (off-white bento)
         ============================================= */}
      <section className="section-light" id="who">
        <div className="container">
          <div style={{ marginBottom: "3rem" }}>
            <span className="tag-badge" style={{ backgroundColor: "var(--navy)", color: "var(--yellow)" }}>
              Founder-Led Architecture
            </span>
            <span className="yellow-bar" style={{ margin: "1rem 0", backgroundColor: "var(--navy)", opacity: 0.15 }} />
            <h2 className="heading-section" style={{ color: "var(--navy)" }}>
              The standard for ASEAN
              <br />venture readiness.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.5rem",
            }}
            className="who-grid"
          >
            {FOR_WHO.map((w, i) => (
              <div
                key={i}
                className="card-bento-light"
                style={{ display: "flex", flexDirection: "column", gap: "1.25rem", border: "1px solid rgba(2,47,66,0.05)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "0",
                      backgroundColor: "rgba(2,47,66,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--navy)",
                    }}
                  >
                    {w.icon}
                  </div>
                  <span className="tag-badge" style={{ backgroundColor: "var(--navy)", color: "var(--yellow)", fontSize: "0.55rem" }}>
                    {w.tag}
                  </span>
                </div>
                <h3 className="heading-card" style={{ color: "var(--navy)", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {w.headline}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(2,47,66,0.6)", lineHeight: 1.75 }}>
                  {w.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          SECTION 6: IMPACT SNAPSHOT (dark navy)
         ============================================= */}
      <section className="section-dark" style={{ borderTop: "1px solid rgba(255,216,0,0.05)" }}>
        <div className="container">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", padding: "4rem", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,216,0,0.1)" }}>
            {IMPACT_METRICS.map((stat, i) => (
              <div key={i} style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 900, color: "var(--white)", lineHeight: 1, letterSpacing: "-0.05em", marginBottom: "0.5rem" }}>
                  {stat.value}
                </div>
                <div className="label-metric" style={{ color: "var(--yellow)", opacity: 0.8 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          SECTION 7: CASE STUDIES (off-white)
         ============================================= */}
      <section className="section-light" id="cases">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4rem" }}>
            <div style={{ maxWidth: "36rem" }}>
              <span className="tag-badge" style={{ backgroundColor: "var(--navy)", color: "var(--yellow)" }}>
                Institutional Validation
              </span>
              <span className="yellow-bar" style={{ backgroundColor: "var(--navy)", opacity: 0.15 }} />
              <h2 className="heading-section" style={{ color: "var(--navy)" }}>
                Accelerating the next 
                <br />wave of <span style={{ color: "var(--yellow)", WebkitTextStroke: "1px var(--navy)" }}>ASEAN innovators.</span>
              </h2>
            </div>
            <Link href="/auth/login" className="btn btn-ghost-dark btn-sm desktop-cta">
              View All Case Studies
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
            {CASE_STUDIES.map((item, i) => (
              <div key={i} className="card-bento-light" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", borderBottom: "4px solid transparent", transition: "all 0.3s ease" }}>
                <div className="label-mono" style={{ color: "var(--yellow)", opacity: 0.8 }}>{item.tag}</div>
                <h4 className="heading-card" style={{ color: "var(--navy)", fontSize: "1.25rem" }}>{item.title}</h4>
                <p style={{ fontSize: "0.875rem", color: "rgba(2,47,66,0.6)", lineHeight: 1.7, flexGrow: 1 }}>{item.desc}</p>
                <div style={{ paddingTop: "1.5rem", borderTop: "1px solid rgba(2,47,66,0.05)", fontSize: "0.7rem", fontWeight: 900, color: "rgba(2,47,66,0.3)", letterSpacing: "0.1em" }}>
                  {item.meta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          SECTION 8: CTA CLOSE (dark navy)
         ============================================= */}
      <section
        className="section-dark"
        style={{ textAlign: "center", paddingBlock: "clamp(6rem, 12vw, 10rem)", position: "relative", overflow: "hidden", borderTop: "1px solid rgba(255,216,0,0.1)" }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(var(--yellow) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="container" style={{ maxWidth: "48rem", position: "relative", zIndex: 10 }}>
          <span className="tag-badge" style={{ marginBottom: "2rem", display: "inline-flex" }}>
            Secure Portal • V4 Neural Engine
          </span>
          <h2 className="heading-hero" style={{ marginBottom: "2rem", color: "var(--white)" }}>
            Co-create the <br/><span className="text-gradient">future.</span>
          </h2>
          <p
            style={{
              fontSize: "1.125rem",
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.8,
              marginBottom: "3.5rem",
              maxWidth: "36rem",
              marginInline: "auto",
              fontWeight: 500,
            }}
          >
            We bridge innovators with markets, funding, and partners across Asia. 
            Initialize your fundability sequence today.
          </p>
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => { setShowAssessment(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn btn-primary btn-lg px-12 group">
              Start Your Assessment
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link href="/upload" className="btn btn-ghost btn-lg px-12 border-white/20 text-white hover:bg-white hover:text-var(--navy)">
              <Database className="w-4 h-4 mr-2" /> Neural Upload
            </Link>
          </div>
        </div>
      </section>

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
