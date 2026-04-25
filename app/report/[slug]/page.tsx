/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Home, Share2, CheckCircle, AlertTriangle, Lock, FileDown } from "lucide-react";
import UnlockButton from "@/components/report/UnlockButton";
import ScoreGaugeMock from "@/components/score/ScoreGaugeMock";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Create client with service role for administrative access
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

  // 1. Fetch Report Data
  if (slug === "demo") {
    const componentScores = {
      problem_clarity: 12, revenue: 5, runway: 15, team_size: 8,
      product_stage: 9, previous_funding: 0, market_size: 8, ai_confidence: 9,
    };
    reportData = {
      id: "demo-report-123",
      score: 66,
      band: "Early-Stage",
      summary_paragraph: "Demo report for preview purposes.",
      top_3_gaps: [{ dimension: "Revenue", priority: "high", max: 20, score: 5, explanation: "Pre-revenue.", fix: "Fix revenue." }],
      component_scores: componentScores,
      financial_snapshot: { burn_rate: "$5k", runway_months: "8 months" },
      action_items: [{ week: 1, action: "Finalize pricing", impact: "Validates economics" }],
      investor_loves: ["Strong team"],
      investor_concerns: ["Zero funding"]
    };
    isUnlocked = false;
  } else {
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

  // 2. ADMIN & OWNER BYPASS
  // Check if current user should see the full report
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (user && supabase) {
      // Bypass if owner
      if (user.id === reportData.user_id) {
        isUnlocked = true;
      } else {
        // Bypass if admin
        const { data: profile } = await supabase.from("profiles").select("is_admin, role").eq("id", user.id).single();
        if (profile?.is_admin || profile?.role === 'admin') {
          isUnlocked = true;
        }
      }
    }
  } catch (e) {
    console.warn("[Report Auth Bypass Error]:", e);
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
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <a href={`/api/report/${slug}/pdf`} target="_blank" className="btn btn-sm btn-primary">
                  <FileDown size={14} /> Download PDF
                </a>
                <button className="btn btn-sm btn-ghost-dark" onClick={(e) => {
                  navigator.clipboard.writeText(window.location.href);
                  (e.target as HTMLButtonElement).innerText = "Copied!";
                  setTimeout(() => { if (e.target) (e.target as HTMLButtonElement).innerText = "Share Link"; }, 2000);
                }}>
                  <Share2 size={14} /> Share Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: "3rem" }}>
        <div style={{ position: "relative" }}>
          <div style={{ filter: isUnlocked ? "none" : "blur(10px)", pointerEvents: isUnlocked ? "auto" : "none", opacity: isUnlocked ? 1 : 0.4 }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "2.5rem", alignItems: "start" }} className="report-grid">
              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                <div className="card-bento-light">
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                     <div>
                        <h1 className="heading-section" style={{ fontSize: "2.5rem", color: "var(--navy)" }}>{reportData.score}<span style={{ fontSize: "1rem", opacity: 0.3 }}>/100</span></h1>
                        <p style={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--amber)", fontSize: "0.75rem" }}>{reportData.band} Band</p>
                     </div>
                     <div style={{ maxWidth: "400px" }}>
                        <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "rgba(2,47,66,0.8)" }}>{reportData.summary_paragraph}</p>
                     </div>
                   </div>

                   <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem", paddingTop: "2rem", borderTop: "1px solid rgba(2,47,66,0.05)" }}>
                      {reportData.investor_loves?.map((love: string, i: number) => (
                        <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                           <CheckCircle size={18} style={{ color: "var(--green)", flexShrink: 0, marginTop: "2px" }} />
                           <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{love}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="card-bento-light">
                   <h3 className="heading-card" style={{ marginBottom: "1.5rem" }}>Investor Concerns</h3>
                   <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {reportData.top_3_gaps?.map((gap: any, i: number) => (
                        <div key={i} style={{ backgroundColor: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.1)", padding: "1.5rem", borderRadius: "4px" }}>
                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                              <span style={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.7rem", color: "var(--red)" }}>Gap: {gap.dimension}</span>
                              <span className="tag-badge" style={{ backgroundColor: "var(--red)", color: "white", fontSize: "0.6rem" }}>{gap.priority} priority</span>
                           </div>
                           <p style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>{gap.explanation}</p>
                           <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "var(--navy)", opacity: 0.6, fontSize: "0.8rem" }}>
                              <AlertTriangle size={14} /> <strong>Fix:</strong> {gap.fix}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div className="card-bento-light" style={{ textAlign: "center" }}>
                   <div style={{ width: "160px", height: "160px", margin: "0 auto 1.5rem" }}>
                      <ScoreGaugeMock score={reportData.score} />
                   </div>
                   <h4 style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.1em", opacity: 0.4 }}>QuickAssess Result</h4>
                </div>

                <div className="card-bento-light">
                   <h3 className="heading-card" style={{ fontSize: "0.9rem", marginBottom: "1.25rem" }}>Financial Vitals</h3>
                   <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                         <span style={{ opacity: 0.5 }}>Monthly Burn</span>
                         <span style={{ fontWeight: 700 }}>{reportData.financial_snapshot?.burn_rate || "---"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                         <span style={{ opacity: 0.5 }}>Estimated Runway</span>
                         <span style={{ fontWeight: 700, color: "var(--red)" }}>{reportData.financial_snapshot?.runway_months || "---"}</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="card-bento-light" style={{ marginTop: "2.5rem" }}>
              <h3 className="heading-card" style={{ marginBottom: "1.5rem" }}>30-Day Growth Plan</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {reportData.action_items?.map((item: any) => (
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
