"use client";

import QuickAssess from "@/components/assessment/QuickAssess";

export default function InterviewPage() {
  return (
    <div style={{ paddingTop: "68px", minHeight: "100vh", backgroundColor: "var(--navy)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div className="container" style={{ maxWidth: "800px", padding: "4rem 1.25rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="tag-badge" style={{ marginBottom: "1rem" }}>Free Assessment</span>
          <h1 className="heading-section">Fundability Profiling</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "0.5rem" }}>
            Answer the dynamic AI questions to see where you stand with investors.
          </p>
        </div>
        
        <div style={{ backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid var(--yellow-10)", padding: "2.5rem" }}>
          <QuickAssess />
        </div>
      </div>
    </div>
  );
}
