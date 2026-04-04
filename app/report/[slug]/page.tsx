/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Home, Share2, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import UnlockButton from "@/components/report/UnlockButton";
import ScoreGaugeMock from "@/components/score/ScoreGaugeMock";

// Create client safely so demo preview works even if env vars are missing
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReportPage({ params }: PageProps) {
  const { slug } = await params;

  let reportData: any = null;
  let isUnlocked = false;

  // For UI preview purposes without DB setup overhead, we'll use a mocked demo dataset
  if (slug === "demo") {
    // Generate some fake component scores to match standard type
    const componentScores = {
      problem_clarity: 12,
      revenue: 5,
      runway: 15,
      team_size: 8,
      product_stage: 9,
      previous_funding: 0,
      market_size: 8,
      ai_confidence: 9,
    };
    reportData = {
      id: "demo-report-123",
      score: 66,
      band: "Early-Stage",
      summary_paragraph: "Your team has great problem definition and early product validation, but revenue scaling and previous funding gaps are making this a tougher sell for Seed investors right now.",
      top_3_gaps: [
        { dimension: "Revenue", priority: "high", max: 20, score: 5, explanation: "Pre-revenue or minimal early MRR.", fix: "Demonstrate 3 paid pilots." }
      ],
      component_scores: componentScores,
      financial_snapshot: { burn_rate: "$5k", runway_months: "8 months" },
      action_items: [
        { week: 1, action: "Finalize pricing tier", impact: "Validates unit economics" },
        { week: 2, action: "Launch paid beta", impact: "Converts free users" },
        { week: 3, action: "Draft Seed deck", impact: "Tying traction to vision" },
        { week: 4, action: "Target 10 angels", impact: "Early commit pipeline" }
      ],
      investor_loves: ["Strong founding team synergy", "Clear problem definition"],
      investor_concerns: ["Zero prior institutional funding", "Low barrier to entry"]
    };
    // Mock the locked behavior based on query param but let's default to locked to show the UI
    isUnlocked = false;
  } else {
    // Real DB fetch
    if (!supabase) throw new Error("Supabase is not configured.");
    
    const { data } = await supabase.from("reports").select("*").eq("id", slug).single();
    if (!data) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--navy)", color: "white" }}>
          <h2>Report not found (404)</h2>
        </div>
      );
    }
    reportData = data;
    isUnlocked = data.is_unlocked;
  }

  return (
    <div style={{ paddingTop: "68px", backgroundColor: "var(--off-white)", minHeight: "100vh", color: "var(--navy)", paddingBottom: "5rem" }}>
      {/* Top action bar */}
      <div style={{ borderBottom: "1px solid rgba(2,47,66,0.1)", backgroundColor: "white", padding: "1rem" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ color: "var(--navy)", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>
            <Home size={16} /> Home
          </Link>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span className="tag-badge-ghost" style={{ borderColor: "var(--navy)", color: "var(--navy)", fontSize: "0.6rem" }}>
              {isUnlocked ? "UNLOCKED" : "LOCKED PREVIEW"}
            </span>
            {isUnlocked && (
              <button className="btn btn-sm btn-ghost-dark">
                <Share2 size={14} /> Share Link
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: "800px", marginTop: "3rem" }}>
        
        {/* FREE PREVIEW SECTION */}
        <div className="card-bento-light" style={{ marginBottom: "2rem" }}>
          <h1 className="heading-section" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Investor Readiness Assessment
          </h1>
          <p style={{ color: "rgba(2,47,66,0.6)", marginBottom: "2rem", fontSize: "0.9rem" }}>
            {reportData.summary_paragraph}
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "center", padding: "2rem", backgroundColor: "var(--navy)", borderRadius: "8px", color: "white" }} className="result-header-grid">
            <div style={{ textAlign: "center" }}>
              <ScoreGaugeMock score={reportData.score} band={reportData.band} />
            </div>
            <div>
              <p className="label-mono" style={{ color: "var(--yellow)", marginBottom: "0.875rem" }}>Core Gaps Identified</p>
              {(reportData as any).top_3_gaps?.map((gap: any, i: number) => (
                <div key={i} style={{ padding: "0.75rem", borderLeft: `3px solid var(--red)`, backgroundColor: "rgba(255,255,255,0.05)", marginBottom: "0.5rem", borderRadius: "0 4px 4px 0" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700 }}>{gap.dimension}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LOCKED OR UNLOCKED PRO SECTION */}
        <div style={{ position: "relative" }}>
          <div className={!isUnlocked ? "content-blurred" : ""} style={{ display: "grid", gap: "2rem" }}>
            
            <div className="card-bento-light">
              <h3 className="heading-card" style={{ marginBottom: "1.5rem" }}>Deep Dive Analysis</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ backgroundColor: "rgba(2,47,66,0.03)", padding: "1.5rem", borderRadius: "4px" }}>
                  <p className="label-mono" style={{ color: "var(--green)", marginBottom: "1rem" }}>Investors Will Love</p>
                  {reportData.investor_loves?.map((l: string, i: number) => (
                    <p key={i} style={{ fontSize: "0.875rem", marginBottom: "0.5rem", display: "flex", gap: "0.5rem" }}><CheckCircle size={16} color="var(--green)" /> {l}</p>
                  ))}
                </div>
                <div style={{ backgroundColor: "rgba(239,68,68,0.05)", padding: "1.5rem", borderRadius: "4px" }}>
                  <p className="label-mono" style={{ color: "var(--red)", marginBottom: "1rem" }}>Expect Pushback On</p>
                  {reportData.investor_concerns?.map((c: string, i: number) => (
                    <p key={i} style={{ fontSize: "0.875rem", marginBottom: "0.5rem", display: "flex", gap: "0.5rem" }}><AlertTriangle size={16} color="var(--red)" /> {c}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="card-bento-light">
              <h3 className="heading-card" style={{ marginBottom: "1.5rem" }}>30-Day Growth Plan</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {(reportData as any).action_items?.map((item: any) => (
                  <div key={item.week} style={{ border: "1px solid rgba(2,47,66,0.1)", padding: "1.25rem", borderRadius: "4px", display: "flex", gap: "1.25rem" }}>
                    <div style={{ backgroundColor: "var(--navy)", color: "var(--yellow)", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>W{item.week}</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{item.action}</p>
                      <p style={{ color: "rgba(2,47,66,0.6)", fontSize: "0.85rem", marginTop: "0.25rem" }}>{item.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* LOCK OVERLAY IF NOT PAID */}
          {!isUnlocked && (
            <div className="lock-overlay" style={{ flexDirection: "column", background: "linear-gradient(to bottom, transparent, var(--off-white) 60%)" }}>
              <div style={{ backgroundColor: "white", padding: "3rem", borderRadius: "8px", boxShadow: "0 20px 40px rgba(2,47,66,0.15)", maxWidth: "420px", textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", backgroundColor: "var(--navy)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginInline: "auto", marginBottom: "1.5rem" }}>
                  <Lock size={28} color="var(--yellow)" />
                </div>
                <h3 className="heading-card" style={{ fontSize: "1.25rem" }}>Unlock Your Full Report</h3>
                <p style={{ fontSize: "0.85rem", color: "rgba(2,47,66,0.6)", margin: "1rem 0 2rem", lineHeight: 1.6 }}>
                  See exactly what investors will push back on. Get your Custom 30-Day Growth Plan and permanent shareable link.
                </p>
                <UnlockButton reportId={reportData.id} />
                <p style={{ fontSize: "0.7rem", color: "rgba(2,47,66,0.4)", marginTop: "1rem" }}>
                  One-time payment of $29. Secured by Stripe.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
