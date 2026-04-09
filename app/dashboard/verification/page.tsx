"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { 
  Landmark, CheckCircle2, 
  Lock, Zap,
  ShieldAlert, Fingerprint, Globe
} from "lucide-react";

export default function VerificationPage() {
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [isPlaidConnected, setIsPlaidConnected] = useState(false);

  const handleLinkedInConnect = () => {
    // Mock connection
    setTimeout(() => setIsLinkedInConnected(true), 1500);
  };

  const handlePlaidConnect = () => {
    // Mock connection
    setTimeout(() => setIsPlaidConnected(true), 2000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto pb-32">
      <ModuleHeader 
        badge="Trust & Verification"
        title="Institutional Proof Layer"
        description="Verify your financial data and founding identity to unlock &apos;Institutional Grade&apos; badging on your Deal Room."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* LinkedIn Verification */}
        <div className={`p-8 border-2 transition-all relative rounded-sm ${isLinkedInConnected ? 'border-emerald-500 bg-emerald-50/30' : 'border-[#0a66c2]/10 bg-white hover:border-[#0a66c2]/30'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className={`w-12 h-12 flex items-center justify-center rounded-sm shadow-lg ${isLinkedInConnected ? 'bg-emerald-500 text-white' : 'bg-[#0a66c2] text-white'}`}>
              <Globe className="w-6 h-6" />
            </div>
            {isLinkedInConnected ? (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-sm">
                <CheckCircle2 className="w-3 h-3" /> Identity Verified
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0a66c2] opacity-40">Awaiting Auth</span>
            )}
          </div>
          
          <h3 className="text-xl font-black text-[#022f42] mb-3 tracking-tighter uppercase">Founder Identity</h3>
          <p className="text-sm text-[#1e4a62] mb-8 leading-relaxed font-medium">
            Sync your LinkedIn profile to verify your professional history and education. Institutional investors require verified team backgrounds for high-conviction checks.
          </p>

          {!isLinkedInConnected ? (
            <button 
              onClick={handleLinkedInConnect}
              className="w-full bg-[#0a66c2] text-white py-4 text-xs font-black uppercase tracking-widest hover:bg-[#084e96] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#0a66c2]/20"
            >
              Connect LinkedIn <Globe className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-xs font-bold text-[#1e4a62] bg-white border border-emerald-100 p-4 rounded-sm">
              Linked Accounts: <span className="text-emerald-600 ml-1">Verified Founding Partner</span>
            </div>
          )}
        </div>

        {/* Plaid Verification */}
        <div className={`p-8 border-2 transition-all relative rounded-sm ${isPlaidConnected ? 'border-emerald-500 bg-emerald-50/30' : 'border-[#11acff]/10 bg-white hover:border-[#11acff]/30'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className={`w-12 h-12 flex items-center justify-center rounded-sm shadow-lg ${isPlaidConnected ? 'bg-emerald-500 text-white' : 'bg-black text-white'}`}>
              <Landmark className="w-6 h-6" />
            </div>
            {isPlaidConnected ? (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-sm">
                 <CheckCircle2 className="w-3 h-3" /> Cash Verified
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-black opacity-40">Awaiting Auth</span>
            )}
          </div>
          
          <h3 className="text-xl font-black text-[#022f42] mb-3 tracking-tighter uppercase">Banking & Revenue</h3>
          <p className="text-sm text-[#1e4a62] mb-8 leading-relaxed font-medium">
            Connect your primary business bank account through Plaid. This auto-verifies your current cash balance and MRR trajectory against institutional snapshots.
          </p>

          {!isPlaidConnected ? (
            <button 
              onClick={handlePlaidConnect}
              className="w-full bg-black text-white py-4 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/20"
            >
              Verify with Plaid <Landmark className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-xs font-bold text-[#1e4a62] bg-white border border-emerald-100 p-4 rounded-sm">
              Live Connection: <span className="text-emerald-600 ml-1">Verified Transaction Ledger</span>
            </div>
          )}
        </div>
      </div>

      {/* Trust & Security Footnote */}
      <div className="bg-[#f2f6fa] p-10 border border-gray-100 relative overflow-hidden rounded-sm">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#022f42]"></div>
        <div className="flex flex-col md:flex-row items-start gap-10">
          <div className="bg-white p-5 shadow-inner shrink-0 border border-gray-50">
             <Lock className="w-8 h-8 text-[#022f42]" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-[#022f42] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3 text-[#ffd800]" /> Data Sanitization & Security
            </h4>
            <p className="text-sm text-[#1e4a62] leading-relaxed max-w-4xl font-medium opacity-80">
              FundabilityOS never stores your login credentials. We use OAuth-level handshakes and read-only API access. Your data is sanitized and tokenized before being processed by the predictive fundability engine.
            </p>
            <div className="mt-8 flex items-center gap-8">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#022f42]">
                 <Fingerprint className="w-4 h-4 text-[#ffd800]" /> Bio-Sync Ready
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#022f42]">
                 <Zap className="w-4 h-4 text-[#ffd800]" /> Zero-Knowledge Proofs
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Level Matrix */}
      <div className="mt-16 bg-white border border-gray-100 p-10 rounded-sm">
        <h3 className="text-lg font-black text-[#022f42] mb-8 uppercase tracking-tighter">Verification Levels</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-[#fcfdfd] border border-gray-50 rounded-sm">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#ffd800] text-[#022f42] flex items-center justify-center font-black rounded-sm shadow-sm">1</div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Baseline Audit</div>
                <div className="text-xs text-[#1e4a62] font-medium">Self-reported data from the 8-pillar diagnostic.</div>
              </div>
            </div>
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white border border-[#1e4a62]/10 rounded-sm">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 flex items-center justify-center font-black rounded-sm shadow-sm transition-colors ${(isLinkedInConnected || isPlaidConnected) ? 'bg-[#ffd800] text-[#022f42]' : 'bg-gray-100 text-gray-400'}`}>2</div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Verified Snapshot</div>
                <div className="text-xs text-[#1e4a62] font-medium">LinkedIn or Plaid connection established.</div>
              </div>
            </div>
            {(isLinkedInConnected || isPlaidConnected) ? (
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
            ) : (
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Pending</span>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-[#1e4a62]/10 rounded-sm opacity-50 grayscale">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-100 text-gray-400 flex items-center justify-center font-black rounded-sm shadow-sm">3</div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Institutional Grade</div>
                <div className="text-xs text-[#1e4a62] font-medium">Lien check, Cap table audit, and KYC complete.</div>
              </div>
            </div>
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Locked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
