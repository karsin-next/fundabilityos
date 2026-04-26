"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const targetUrl = searchParams.get("url");

  const handleConfirm = () => {
    if (!targetUrl) return;
    setIsRedirecting(true);
    window.location.href = targetUrl;
  };

  if (!targetUrl) {
    return (
      <div className="text-center">
        <h1 className="text-white text-2xl font-bold mb-4">Invalid Link</h1>
        <button onClick={() => router.push("/login")} className="text-[#ffd800] underline">
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-2xl shadow-2xl text-center">
      <div className="w-20 h-20 bg-[#ffd800]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#ffd800]/20">
        <ShieldCheck className="w-10 h-10 text-[#ffd800]" />
      </div>
      
      <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">
        Confirm Your Login
      </h1>
      
      <p className="text-blue-100/60 mb-10 leading-relaxed">
        To protect your account, please click the button below to securely sign in to your FundabilityOS dashboard.
      </p>

      <button
        onClick={handleConfirm}
        disabled={isRedirecting}
        className="w-full bg-[#ffd800] text-[#022f42] py-4 px-8 rounded-lg font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(255,216,0,0.3)] disabled:opacity-50"
      >
        {isRedirecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Securing Session...
          </>
        ) : (
          <>
            Confirm & Sign In
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
      
      <p className="mt-8 text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
        Encrypted • Secure • FundabilityOS
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-[#022f42] flex items-center justify-center p-6 font-sans">
      <Suspense fallback={<Loader2 className="w-8 h-8 text-[#ffd800] animate-spin" />}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}

