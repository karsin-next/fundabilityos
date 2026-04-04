"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get("report_id");
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!reportId) return;
    
    // Redirect after 4 seconds to allow webhook to process and unlock the DB
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push(`/report/${reportId}?unlocked=true`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [reportId, router]);

  if (!reportId) {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Invalid Session</h2>
        <button onClick={() => router.push("/")} className="btn btn-primary">Return Home</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", maxWidth: "400px" }}>
      <CheckCircle size={64} style={{ color: "var(--green)", marginInline: "auto", marginBottom: "1.5rem" }} />
      <h1 className="heading-section" style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>Payment Successful</h1>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "2rem" }}>
        Thank you. Your Investor-Ready report is now unlocked. We are preparing your data...
      </p>
      
      <div style={{ padding: "1.5rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--yellow-20)" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--yellow)", marginInline: "auto", marginBottom: "1rem" }} />
        <p style={{ fontSize: "0.8rem", color: "var(--yellow)", fontWeight: 700 }}>Redirecting in {countdown}s</p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--navy)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <Suspense fallback={<Loader2 className="animate-spin" color="var(--yellow)" size={32} />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
