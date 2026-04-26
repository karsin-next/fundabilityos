"use client";

import { useState } from "react";
import { ArrowRight, Mail, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send magic link");
      }

      setIsSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#022f42] p-6">
        <div className="max-w-md w-full bg-white rounded-sm p-12 text-center shadow-2xl border-b-[8px] border-[#ffd800]">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Mail className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-[#022f42] uppercase tracking-tighter mb-4">Check Your Email</h2>
          <p className="text-[#1e4a62] font-medium leading-relaxed mb-8">
            We've sent a magic link to <span className="font-bold">{email}</span>. Click the link in the email to sign in securely.
          </p>
          <button 
            onClick={() => setIsSent(false)}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#022f42]/40 hover:text-[#022f42] transition-colors"
          >
            Entered the wrong email? Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#022f42]">
      {/* Left Side: Branding/Visual */}
      <div className="hidden lg:flex flex-col justify-between p-16 relative overflow-hidden bg-[#022f42]">
        <div className="absolute top-0 right-0 p-24 opacity-5 rotate-12">
          <Sparkles size={400} />
        </div>
        
        <Link href="/" className="flex items-center gap-4 relative z-10">
          <Image src="/logo.png" alt="NextBlaze" width={180} height={50} className="h-12 w-auto object-contain" />
          <div className="h-10 w-[1px] bg-white/20" />
          <span className="text-white font-black text-xl uppercase tracking-tight">FundabilityOS</span>
        </Link>

        <div className="relative z-10">
          <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-none mb-8">
            The Standard for <br/><span className="text-[#ffd800]">Investor-Ready</span> <br/>Founders.
          </h1>
          <div className="flex items-center gap-4 text-[#ffd800]">
            <ShieldCheck size={24} />
            <span className="text-sm font-black uppercase tracking-widest">Neural Due Diligence Engine V4</span>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12">
           <div className="flex flex-col">
              <span className="text-2xl font-black text-white">2,400+</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Founders Scored</span>
           </div>
           <div className="flex flex-col">
              <span className="text-2xl font-black text-white">RM 60.8M</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Value Created</span>
           </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex items-center justify-center p-6 lg:p-24 bg-[#f2f6fa]">
        <div className="max-w-md w-full">
          <div className="bg-white p-10 md:p-14 shadow-[0_45px_100px_-20px_rgba(2,47,66,0.1)] border-b-[8px] border-[#ffd800]">
            <h2 className="text-4xl font-black text-[#022f42] uppercase tracking-tighter mb-2">Welcome Back.</h2>
            <p className="text-[#1e4a62] text-sm font-medium mb-10 opacity-60">Sign in with a secure magic link. No passwords required.</p>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 text-red-700 text-xs font-bold uppercase tracking-tight">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-[#022f42] uppercase tracking-widest mb-3">Work Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#022f42]/20" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="karsin@nextblaze.asia"
                    className="w-full bg-[#f8fafc] border-2 border-[#022f42]/5 rounded-sm py-4 pl-12 pr-4 focus:outline-none focus:border-[#ffd800] transition-colors font-medium text-sm text-[#022f42]"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#022f42] text-[#ffd800] font-black py-4 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-[#ffd800] hover:text-[#022f42] transition-all shadow-xl"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Magic Link <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 pt-12 border-t border-[#022f42]/5 text-center">
              <p className="text-[10px] font-black text-[#022f42]/30 uppercase tracking-widest leading-loose">
                By signing in, you agree to our <br/>
                <Link href="/terms" className="text-[#022f42] hover:text-[#ffd800] underline">Terms of Service</Link> and <Link href="/privacy" className="text-[#022f42] hover:text-[#ffd800] underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
