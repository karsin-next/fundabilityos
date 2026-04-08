"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, TrendingUp, Users, FileText, Shield, Zap } from "lucide-react";
import ScoreGaugeMock from "@/components/score/ScoreGaugeMock";
import QuickAssess from "@/components/assessment/QuickAssess";

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
    headline: "You don't know your gaps until investors reject you.",
    sub: "Most founders discover their weaknesses in the room — when it's already too late to fix them.",
  },
  {
    headline: "You're guessing what investors actually want.",
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
    desc: "Know your score in this market. Investors are pickier now. Don't walk in unprepared.",
    icon: <Shield size={18} />,
  },
];

const PRICING = [
  {
    name: "Free Assessment",
    price: "$0",
    period: "",
    desc: "Start immediately. No credit card.",
    features: [
      "Dynamic AI interview",
      "Fundability Score (0–100)",
      "Top 3 investor concerns",
      "8-Dimension Pulse Map",
    ],
    cta: "Get Free Score",
    href: "/interview",
    featured: false,
  },
  {
    name: "Investor-Ready Report",
    price: "$29",
    period: "one-time",
    desc: "Everything investors expect, nothing they don't.",
    features: [
      "Full 8-dimension breakdown",
      "Investor-language gap analysis",
      "Financial & team snapshot",
      "30-day action plan PDF",
      "Shareable report URL",
    ],
    cta: "Get Full Report",
    href: "/interview",
    featured: true,
  },
  {
    name: "FundabilityOS Verified",
    price: "$19",
    period: "/month",
    desc: "Signal to investors you're serious.",
    features: [
      "Everything in Report",
      "Verified Badge (LinkedIn + email sig)",
      "Listed in Investor Directory",
      "Monthly AI re-assessment",
      "Or $199/year (save $29)",
    ],
    cta: "Get Verified",
    href: "/interview",
    featured: false,
  },
];

export default function HomePage() {
  const [showAssessment, setShowAssessment] = useState(false);

  return (
    <div style={{ paddingTop: "68px" }}>

      {/* =============================================
          SECTION 1: HERO (dark navy)
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
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: showAssessment ? "760px" : "100%", margin: showAssessment ? "0 auto" : "0" }}>
              {!showAssessment ? (
                <>
                  <div className="animate-fade-in-up">
                    <span className="tag-badge">
                      Free for founders
                    </span>
                  </div>

                  <h1 className="heading-hero animate-fade-in-up delay-100" style={{ color: "var(--white)" }}>
                    Know Your <span style={{ color: "var(--yellow)" }}>Fundability Score</span> in 10 Minutes.
                  </h1>

                  <p
                    className="animate-fade-in-up delay-200"
                    style={{
                      fontSize: "1.0625rem",
                      color: "rgba(255,255,255,0.7)",
                      lineHeight: 1.75,
                      maxWidth: "32rem",
                    }}
                  >
                    Answer AI questions. Get a score (0–100) that shows exactly
                    where you stand — and what investors will push back on before your
                    first meeting.
                  </p>

                  <div
                    className="animate-fade-in-up delay-300"
                    style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}
                  >
                    <button onClick={() => setShowAssessment(true)} className="btn btn-primary btn-lg">
                      Get My Score — It&apos;s Free
                      <ArrowRight size={16} />
                    </button>
                    <Link href="/upload" className="btn btn-ghost">
                      Upload Pitch Deck
                    </Link>
                  </div>
                </>
              ) : (
                <div style={{ width: "100%", animation: "fadeInAssessment 0.6s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
                     <h2 className="heading-section" style={{ fontSize: "1.5rem", marginBottom: 0 }}>AI Fundability Analysis</h2>
                     <button onClick={() => setShowAssessment(false)} className="btn btn-ghost btn-sm" style={{ opacity: 0.5 }}>Cancel Assessment</button>
                  </div>
                  <QuickAssess isEmbedded={true} />
                </div>
              )}

              {/* Social proof (Visible always per user request) */}
              <div
                className="animate-fade-in-up delay-400"
                style={{
                  display: "flex",
                  gap: "2.5rem",
                  paddingTop: "1.5rem",
                  flexWrap: "wrap",
                  justifyContent: showAssessment ? "center" : "flex-start",
                  borderTop: showAssessment ? "1px solid var(--yellow-10)" : "none",
                  marginTop: showAssessment ? "2rem" : "0"
                }}
              >
                {[
                  { value: "2,400+", label: "Founders Assessed" },
                  { value: "12", label: "Markets Covered" },
                  { value: "8", label: "Investor Dimensions" },
                ].map((m) => (
                  <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: "0.1rem", textAlign: showAssessment ? "center" : "left" }}>
                    <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--yellow)" }}>
                      {m.value}
                    </span>
                    <span className="label-metric">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Score Gauge Demo (Hidden during assessment) */}
            {!showAssessment && (
              <div className="animate-fade-in delay-200 hero-right" style={{ display: "flex", justifyContent: "center" }}>
                <div
                  style={{
                    border: "1px solid var(--yellow-20)",
                    borderRadius: "8px",
                    padding: "2.5rem",
                    background: "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(8px)",
                    width: "100%",
                    maxWidth: "380px",
                    position: "relative",
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, width: "3rem", height: "3px", backgroundColor: "var(--yellow)" }} />
                  <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <span className="tag-badge" style={{ marginBottom: "1rem" }}>Sample Score</span>
                  </div>
                  <ScoreGaugeMock score={74} band="Investor-Ready" />
                  <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {[
                      { label: "Revenue", score: 10, max: 20, color: "var(--amber)" },
                      { label: "Problem Clarity", score: 12, max: 15, color: "var(--green)" },
                      { label: "Runway", score: 5, max: 15, color: "var(--red)" },
                    ].map((dim) => (
                      <div key={dim.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{dim.label}</span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: dim.color }}>{dim.score}/{dim.max}</span>
                        </div>
                        <div className="dimension-bar-track"><div className="dimension-bar-fill" style={{ width: `${(dim.score / dim.max) * 100}%`, backgroundColor: dim.color }} /></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--yellow-20)" }}>
                    <button onClick={() => setShowAssessment(true)} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Get Your Actual Score</button>
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
            from { opacity: 0; transform: scale(0.98); }
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
              The problem most founders face
            </span>
            <span className="yellow-bar" style={{ backgroundColor: "var(--navy)", opacity: 0.15 }} />
            <h2 className="heading-section" style={{ color: "var(--navy)" }}>
              67% of seed fundraises fail
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
            <span className="tag-badge">3 Steps to Investor-Ready</span>
            <span className="yellow-bar" style={{ margin: "1rem auto" }} />
            <h2 className="heading-section">
              From zero to fundable
              <br />in one session.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1px",
              backgroundColor: "var(--yellow-20)",
              border: "1px solid var(--yellow-20)",
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
                  padding: "2.5rem 2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span
                    style={{
                      fontSize: "2.5rem",
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
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "var(--yellow-10)",
                      border: "1px solid var(--yellow-20)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--yellow)",
                    }}
                  >
                    {step.icon}
                  </div>
                </div>
                <h3 className="heading-card" style={{ color: "var(--white)" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                  {step.desc}
                </p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <ArrowRight
                    size={16}
                    style={{
                      position: "absolute",
                      right: "-9px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--yellow)",
                      opacity: 0.5,
                      zIndex: 2,
                    }}
                    className="step-arrow"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          SECTION 4: PRICE PREVIEW (off-white)
         ============================================= */}
      <section className="section-light" id="preview">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="tag-badge" style={{ backgroundColor: "var(--navy)", color: "var(--yellow)" }}>
              See What Investors See
            </span>
            <span className="yellow-bar" style={{ margin: "1rem auto", backgroundColor: "var(--navy)", opacity: 0.15 }} />
            <h2 className="heading-section" style={{ color: "var(--navy)" }}>
              Simple, honest pricing.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.5rem",
              alignItems: "start",
            }}
            className="pricing-grid"
          >
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`pricing-card ${plan.featured ? "pricing-card-featured" : ""}`}
                style={{ backgroundColor: "var(--navy)", padding: "2rem", borderRadius: "8px", border: "1px solid var(--yellow-20)" }}
              >
                <div>
                  <p className="label-mono" style={{ color: "var(--yellow)", marginBottom: "0.5rem", fontSize: "0.65rem" }}>
                    {plan.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                    <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--white)", lineHeight: 1 }}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.825rem", color: "rgba(255,255,255,0.45)", marginTop: "0.5rem" }}>
                    {plan.desc}
                  </p>
                </div>

                <div className="yellow-bar-full" style={{ margin: "1.5rem 0", height: "1px", backgroundColor: "var(--yellow-20)" }} />

                <ul style={{ display: "flex", flexDirection: "column", gap: "0.7rem", listStyle: "none", padding: 0, margin: 0, marginBottom: "2rem" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", gap: "0.625rem", fontSize: "0.825rem", color: "rgba(255,255,255,0.7)" }}>
                      <CheckCircle size={14} style={{ color: "var(--yellow)", flexShrink: 0, marginTop: "2px" }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setShowAssessment(true)}
                  className={`btn ${plan.featured ? "btn-primary" : "btn-ghost"}`}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          SECTION 6: WHO IT'S FOR (off-white bento)
         ============================================= */}
      <section className="section-light" id="who">
        <div className="container">
          <div style={{ marginBottom: "3rem" }}>
            <span className="tag-badge" style={{ backgroundColor: "var(--navy)", color: "var(--yellow)" }}>
              Built for Founders Like You
            </span>
            <span className="yellow-bar" style={{ margin: "1rem 0", backgroundColor: "var(--navy)", opacity: 0.15 }} />
            <h2 className="heading-section" style={{ color: "var(--navy)" }}>
              Wherever you are
              <br />in your raise.
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
                style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(2,47,66,0.08)",
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
                <h3 className="heading-card" style={{ color: "var(--navy)", fontSize: "0.95rem" }}>
                  {w.headline}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(2,47,66,0.6)", lineHeight: 1.7 }}>
                  {w.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          SECTION 7: CTA CLOSE (dark navy full-width)
         ============================================= */}
      <section
        className="section-dark"
        style={{ textAlign: "center", paddingBlock: "clamp(5rem, 10vw, 8rem)" }}
      >
        <div className="container" style={{ maxWidth: "48rem" }}>
          <span className="tag-badge" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
            Take 10 Minutes. Know Where You Stand.
          </span>
          <h2 className="heading-section" style={{ marginBottom: "1.5rem" }}>
            Ready to know what investors
            <br />
            <span style={{ color: "var(--yellow)" }}>actually think</span> of your startup?
          </h2>
          <p
            style={{
              fontSize: "1rem",
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.75,
              marginBottom: "2.5rem",
              maxWidth: "34rem",
              marginInline: "auto",
            }}
          >
            Takes 10 minutes. Free to start. Investors notice the difference between
            founders who know their numbers and those who guess.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setShowAssessment(true)} className="btn btn-primary btn-lg">
              Get My Fundability Score
              <ArrowRight size={16} />
            </button>
            <Link href="/upload" className="btn btn-ghost btn-lg">
              Upload Pitch Deck
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
      `}</style>
    </div>
  );
}
