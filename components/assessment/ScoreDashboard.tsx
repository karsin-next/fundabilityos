import Link from "next/link";
import { CheckCircle2, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import type { ScoringResult } from "@/lib/scoring";

interface Props {
  scoringResult: ScoringResult;
  handleReset: () => void;
}

export default function ScoreDashboard({ scoringResult, handleReset }: Props) {
  return (
    <div className="results-dashboard animate-in fade-in slide-in-from-bottom-4 duration-700 text-left w-full mt-8">
      <div className="bg-[#022f42] p-8 md:p-12 relative overflow-hidden group shadow-2xl rounded-md border border-white/10 mx-auto w-full max-w-[1000px]">
        {/* Close / Back to Home Button */}
        <button 
          onClick={handleReset}
          className="absolute top-6 right-6 text-white/40 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all z-20"
          title="Clear Results and Return Home"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        {/* Header Area: Score Gauge */}
        <div className="flex flex-col items-center mb-12">
           <div className="relative mb-8">
              <svg className="w-48 h-28 transform -rotate-180" viewBox="0 0 100 55">
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="125"
                  strokeDashoffset={125 - (scoringResult.score / 100) * 125}
                  style={{ transition: "stroke-dashoffset 2s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                <span 
                  className="text-6xl font-black text-white leading-none tracking-tighter"
                >
                  {scoringResult.score}
                </span>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">AUDIT SCORE</span>
              </div>
           </div>
           
           <div className="flex flex-col items-center gap-4">
              <div className="bg-[#10b981] text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2">
                <CheckCircle2 size={14} /> Stage: {scoringResult.band}
              </div>
              <p className="text-white text-center max-w-[500px] text-sm italic font-medium opacity-80 leading-relaxed">
                 &quot;{scoringResult.summary_paragraph}&quot;
              </p>
           </div>
        </div>

        {/* Grid 1: 8-Dimension Breakdown */}
        <div className="mb-16">
           <h4 className="text-white text-xs font-black uppercase tracking-[0.3em] mb-8 border-b border-[#ffd800]/30 pb-4">Performance Matrix</h4>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(scoringResult.component_scores).map(([key, score]) => (
                <div key={key} className="space-y-2">
                   <div className="text-[9px] font-black text-white/40 uppercase tracking-widest truncate">
                     {key.replace('_', ' ')}
                   </div>
                   <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#ffd800] transition-all duration-1000"
                        style={{ width: `${(Number(score) / (key === 'revenue' ? 20 : 15)) * 100}%` }}
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Grid 2: Gaps vs Loves */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
           {/* Left: Top Gaps */}
           <div className="space-y-8">
              <h4 className="text-white text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                <AlertCircle size={16} className="text-[#ef4444]" /> Critical Gaps
              </h4>
              <div className="space-y-6">
                {scoringResult.top_3_gaps.map((gap: any, i: number) => (
                  <div key={i} className="border-l-4 border-[#ef4444] pl-6 py-1 bg-white/5 p-4 rounded-r-md">
                     <div className="text-[11px] font-black text-white uppercase tracking-widest mb-2">{gap.dimension}</div>
                     <p className="text-white/60 text-xs leading-relaxed font-medium">{gap.explanation}</p>
                     <div className="mt-3 text-[10px] font-black text-[#10b981] uppercase tracking-widest">FIX: {gap.fix}</div>
                  </div>
                ))}
              </div>
           </div>

           {/* Right: Investor Interest */}
           <div className="space-y-8">
              <h4 className="text-white text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                <TrendingUp size={16} className="text-[#10b981]" /> High Interest Signals
              </h4>
              <div className="space-y-4">
                {scoringResult.investor_loves.map((love: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-[#022f42]/50 border border-white/5 rounded-sm">
                     <CheckCircle2 size={14} className="text-[#10b981] mt-0.5 shrink-0" />
                     <span className="text-white text-xs font-medium leading-relaxed">{love}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Actions & CTA */}
        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="text-center md:text-left">
              <div className="text-white text-xs font-black uppercase tracking-widest mb-2">Priority 1 Action</div>
              <p className="text-white/40 text-[11px] font-medium">{scoringResult.action_items[0]?.action || "Review full insights inside dashboard."}</p>
           </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/coming-soon" 
                onClick={() => {
                  fetch("/api/track-click", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                      event_name: "clicked_unlock_29", 
                      email: typeof window !== "undefined" ? localStorage.getItem("guest_email") : null,
                      metadata: { source: "score_dashboard", score: scoringResult.score }
                    })
                  }).catch(() => {});
                }}
                className="btn btn-ghost border-white/20 text-white hover:bg-white hover:text-[#022f42] px-6 py-4 font-black uppercase tracking-widest text-[10px] shadow-xl transition-all flex items-center gap-2 group"
              >
                UNLOCK FULL 8-DIMENSION SCORES ($29) <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
