"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";

export default function UnlockButton({ reportId, userId }: { reportId: string; userId?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, userId: userId || "anonymous" }),
      });
      
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (err) {
      console.error(err);
      alert("Checkout failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleUnlock} disabled={isLoading} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
      {isLoading ? "Redirecting to Secure Checkout…" : "Unlock Full Report — $29"}
    </button>
  );
}
