import Link from "next/link";
import { ArrowRight, CheckCircle, TrendingUp, Users, FileText, Shield, Zap } from "lucide-react";
import ScoreGaugeMock from "@/components/score/ScoreGaugeMock";

// A/B variant is assigned server-side per session via a cookie (wired in Day 11)
// For now the default hero copy (Variant A) is rendered.

export const metadata = {
  title: "FundabilityOS — Know Your Investor-Ready Score",
  description:
    "Answer 12 AI questions or upload your pitch deck. Get a Fundability Score (0–100) and know exactly what investors will push back on.",
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Answer 12 AI Questions",
    desc: "Our AI walks you through the exact topics investors probe. No jargon. 5–10 minutes. Or upload your pitch deck for instant extraction.",
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
      "12-question AI interview",
      "Fundability Score (0–100)",
      "Top 3 investor concerns",
      "Or upload your pitch deck",
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

const METRICS = [
  { value: "2,400+", label: "Founders Assessed" },
  { value: "12", label: "Markets Covered" },
  { value: "8", label: "Investor Dimensions" },
  { value: "10 min", label: "Average to Score" },
];

export default function HomePage() {
  return (
    <div style={{ paddingTop: "68px" }}>

      {/* =============================================
          SECTION 1: HERO (dark navy)
         ============================================= */}
      <section
        className="section-dark"
        style={{ paddingTop: "clamp(4rem, 8vw, 7rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)", minHeight: "92vh", display: "flex", alignItems: "center" }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4rem",
              alignItems: "center",
            }}
            className="hero-grid"
          >
            {/* Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              <div className="animate-fade-in-up">
                <span className="tag-badge">
                  Free for early founders — limited spots
                </span>
              </div>

              <h1 className="heading-hero animate-fade-in-up delay-100" style={{ color: "var(--white)" }}>
                Know Your{" "}
                <span style={{ color: "var(--yellow)" }}>Fundability Score</span>{" "}
                in 10 Minutes.
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
                Answer 12 AI questions. Get a score (0–100) that shows exactly
                where you stand — and what investors will push back on before your
                first meeting.
              </p>

              <div
                className="animate-fade-in-up delay-300"
                style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}
              >
                <Link href="/interview" className="btn btn-primary btn-lg">
                  Get My Score — It&apos;s Free
                  <ArrowRight size={16} />
                </Link>
                <Link href="/upload" className="btn btn-ghost">
                  Upload Pitch Deck
                </Link>
              </div>

              {/* Social proof */}
              <div
                className="animate-fade-in-up delay-400"
                style={{
                  display: "flex",
                  gap: "2.5rem",
                  paddingTop: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                {METRICS.map((m) => (
                  <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                    <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--yellow)" }}>
                      {m.value}
                    </span>
                    <span className="label-metric">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Score Gauge Demo */}
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
                {/* Yellow corner accent */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "3rem", height: "3px", backgroundColor: "var(--yellow)" }} />

                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <span className="tag-badge" style={{ marginBottom: "1rem" }}>Sample Score</span>
                </div>

                <ScoreGaugeMock score={74} band="Investor-Ready" />

                {/* Gap preview */}
                <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {[
                    { label: "Revenue", score: 10, max: 20, color: "var(--amber)" },
                    { label: "Problem Clarity", score: 12, max: 15, color: "var(--green)" },
                    { label: "Runway", score: 5, max: 15, color: "var(--red)" },
                  ].map((dim) => (
                    <div key={dim.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          {dim.label}
                        </span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: dim.color }}>
                          {dim.score}/{dim.max}
                        </span>
                      </div>
                      <div className="dimension-bar-track">
                        <div
                          className="dimension-bar-fill"
                          style={{
                            width: `${(dim.score / dim.max) * 100}%`,
                            backgroundColor: dim.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--yellow-20)" }}>
                  <Link href="/interview" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                    Get Your Actual Score
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .hero-grid { grid-template-columns: 1fr !important; }
            .hero-right { display: none !important; }
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

        <style>{`
          @media (max-width: 768px) {
            .bento-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
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

          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <Link href="/interview" className="btn btn-primary btn-lg">
              Start Free Assessment
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .steps-grid { grid-template-columns: 1fr !important; }
            .step-arrow { display: none !important; }
          }
        `}</style>
      </section>

      {/* =============================================
          SECTION 4: SCORE PREVIEW (off-white)
         ============================================= */}
      <section className="section-light" id="preview">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="tag-badge" style={{ backgroundColor: "var(--navy)", color: "var(--yellow)" }}>
              See What Investors See
            </span>
            <span className="yellow-bar" style={{ margin: "1rem auto", backgroundColor: "var(--navy)", opacity: 0.15 }} />
            <h2 className="heading-section" style={{ color: "var(--navy)" }}>
              Your full report looks like this.
            </h2>
            <p style={{ color: "rgba(2,47,66,0.6)", marginTop: "1rem", maxWidth: "36rem", marginInline: "auto" }}>
              Below is a sample Investor-Ready Report. Yours will be generated in real-time from your actual answers.
            </p>
          </div>

          <div
            style={{
              maxWidth: "640px",
              marginInline: "auto",
              backgroundColor: "var(--navy)",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid rgba(2,47,66,0.15)",
            }}
          >
            {/* Report header */}
            <div style={{ backgroundColor: "var(--navy)", padding: "2rem 2rem 1.5rem", borderBottom: "3px solid var(--yellow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                  <p className="label-metric" style={{ color: "rgba(255,255,255,0.4)", marginBottom: "0.25rem" }}>
                    FundabilityOS Report
                  </p>
                  <h3 style={{ fontWeight: 900, fontSize: "1rem", color: "var(--white)" }}>
                    Sample Startup Co.
                  </h3>
                </div>
                <span className="tag-badge">Investor-Ready</span>
              </div>
              <ScoreGaugeMock score={74} band="Investor-Ready" compact />
            </div>

            {/* Top 3 gaps teaser */}
            <div style={{ padding: "1.5rem 2rem" }}>
              <p className="label-mono" style={{ color: "var(--yellow)", marginBottom: "1rem", fontSize: "0.65rem" }}>
                Top 3 Gaps to Fix
              </p>
              {[
                { gap: "Runway", msg: "4 months runway is below investor threshold. Most want 12+ months post-raise." },
                { gap: "Revenue", msg: "Pre-revenue startups face 3× harder terms. Aim for $5k MRR before raising." },
                { gap: "Market Size", msg: "Market description is vague. Investors need a defensible TAM estimate." },
              ].map((g, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0.875rem",
                    borderLeft: "3px solid var(--amber)",
                    marginBottom: "0.75rem",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderRadius: "0 4px 4px 0",
                  }}
                >
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--amber)", display: "block", marginBottom: "0.3rem" }}>
                    {g.gap}
                  </span>
                  <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                    {g.msg}
                  </p>
                </div>
              ))}
              <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <Link href="/interview" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  Get Your Actual Score →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          SECTION 5: PRICING (dark navy)
         ============================================= */}
      <section className="section-dark" id="pricing">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span className="tag-badge">Start Free. Pay Only for Results.</span>
            <span className="yellow-bar" style={{ margin: "1rem auto" }} />
            <h2 className="heading-section">
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

                <div className="yellow-bar-full" />

                <ul style={{ display: "flex", flexDirection: "column", gap: "0.7rem", listStyle: "none", padding: 0, margin: 0 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", gap: "0.625rem", fontSize: "0.825rem", color: "rgba(255,255,255,0.7)" }}>
                      <CheckCircle size={14} style={{ color: "var(--yellow)", flexShrink: 0, marginTop: "2px" }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`btn ${plan.featured ? "btn-primary" : "btn-ghost"}`}
                  style={{ justifyContent: "center" }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .pricing-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
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

        <style>{`
          @media (max-width: 768px) {
            .who-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
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
            <Link href="/interview" className="btn btn-primary btn-lg">
              Get My Fundability Score
              <ArrowRight size={16} />
            </Link>
            <Link href="/upload" className="btn btn-ghost btn-lg">
              Upload Pitch Deck
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
