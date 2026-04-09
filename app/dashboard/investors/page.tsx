"use client";

import { 
  ArrowRight, CheckCircle2, RefreshCcw, Target, Zap,
  UserPlus, Search
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const investorModules = [
  { id: "profile", title: "Investor Profile Builder", icon: UserPlus, desc: "Define the exact archetype of capital partner you are sourcing for this round.", status: "not_started", time: "5 min", num: "3.2.1" },
  { id: "portfolio", title: "Portfolio & Competitor Check", icon: Search, desc: "Screen out conflicting funds and map optimal syndicate leads.", status: "locked", time: "4 min", num: "3.2.2" },
];

export default function InvestorTargetingHubPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState(investorModules);
  const [overallProgress, setOverallProgress] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function loadProgress() {
      if (!user?.id) return;
      
      // In production, we'd check a dedicated progress table or the reports table
      // For now, we'll check the 'reports' for any investor related data in 'audit_responses'
      const { data: report } = await supabase
        .from("reports")
        .select("audit_responses")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const responses = (report?.audit_responses as Record<string, any>) || {};
      const hasProfile = !!responses["3.2.1"];
      const hasPortfolio = !!responses["3.2.2"];

      const mockState = investorModules.map((m) => {
        let status = "locked";
        if (m.id === "profile") status = hasProfile ? "completed" : "not_started";
        if (m.id === "portfolio") {
          if (hasProfile) status = hasPortfolio ? "completed" : "not_started";
        }
        return { ...m, status };
      });

      setModules(mockState);
      const completedCount = [hasProfile, hasPortfolio].filter(Boolean).length;
      setOverallProgress(Math.round((completedCount / investorModules.length) * 100));
    }
    loadProgress();
  }, [user, supabase]);

  const resetModule = () => {
    if (confirm("Reset all Investor Targeting progress data?")) {
      alert("Reset logic would clear Supabase entries in production.");
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "not_started": return "bg-white text-[#022f42] border-[rgba(2,47,66,0.1)] hover:border-[#022f42]";
      default: return "bg-[#fcfdfd] text-[#1e4a62] border-[rgba(2,47,66,0.05)] opacity-50";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8">
      
      {/* Premium Hub Header */}
      <div className="mb-8 bg-[#022f42] text-white p-10 shadow-2xl relative overflow-hidden group border-b-8 border-[#ffd800] rounded-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffd800] rounded-full blur-[120px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
        <div className="inline-block bg-[#ffd800] text-[#022f42] font-black px-4 py-1 mb-5 text-[10px] uppercase tracking-[0.3em] relative z-10">
          Module 3.2
        </div>
        <h1 className="text-4xl font-black mb-3 relative z-10 tracking-tight">INVESTOR TARGETING</h1>
        <p className="text-[#b0d0e0] text-sm max-w-2xl leading-relaxed relative z-10 font-medium opacity-80 uppercase tracking-[0.05em]">
          Stop spraying and praying. Architect a highly precise targeting matrix to identify the optimal institutional partners for your specific capital needs and market position.
        </p>
        
        <div className="mt-10 bg-white/5 p-6 border border-white/10 relative z-10 shadow-inner">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 w-full">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd800] mb-3">
                <span>Targeting Accuracy Matrix</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="h-1.5 bg-white/10 overflow-hidden rounded-full">
                <div 
                  className="h-full bg-[#ffd800] transition-all duration-1000 ease-out" 
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
               <div className="flex flex-col sm:flex-row gap-2">
                 <button onClick={resetModule} title="Reset Progress" className="p-3 bg-white/5 text-white/40 hover:text-rose-400 hover:bg-rose-400/10 transition-all rounded-sm">
                   <RefreshCcw className="w-4 h-4" />
                 </button>
                 <Link href={modules.find(m => m.status === 'not_started')?.id ? `/dashboard/investors/${modules.find(m => m.status === 'not_started')?.id}` : '/dashboard/investors/profile'} className="px-8 py-3 bg-[#ffd800] text-[#022f42] font-black uppercase tracking-widest text-xs hover:bg-white transition-all shadow-lg active:scale-95 flex items-center gap-2">
                   {overallProgress === 100 ? "Review Strategy" : "Begin Analysis"} <ArrowRight className="w-3 h-3" />
                 </Link>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {modules.map((mod, index) => {
          const isLocked = mod.status === "locked";
          const isCompleted = mod.status === "completed";
          const href = isLocked ? "#" : `/dashboard/investors/${mod.id}`;
          
          return (
            <Link key={mod.id} href={href} className={`group block p-6 border-2 transition-all duration-300 relative rounded-sm ${getStatusColor(mod.status)} ${isLocked ? "cursor-not-allowed opacity-50" : "hover:scale-[1.02] hover:shadow-2xl cursor-pointer"}`}>
               {isCompleted && (
                 <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg z-20">
                    <CheckCircle2 className="w-4 h-4" />
                 </div>
               )}
               
               <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-[#022f42] text-[#ffd800] flex items-center justify-center font-black rounded-sm shadow-md group-hover:bg-[#ffd800] group-hover:text-[#022f42] transition-colors">
                   <mod.icon className="w-6 h-6" />
                 </div>
               </div>
               
               <div className="mb-6 min-h-[120px]">
                 <div className="text-[10px] font-black text-[#1e4a62]/40 uppercase tracking-widest mb-1 font-mono">{mod.num}</div>
                 <h3 className="font-black text-[#022f42] leading-tight text-xl mb-3 tracking-tight">{mod.title}</h3>
                 <p className="text-[11px] text-[#1e4a62]/80 leading-relaxed font-medium">{mod.desc}</p>
               </div>

               {!isLocked ? (
                 <div className="flex items-center gap-2 text-[#022f42] font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all pt-5 border-t border-[rgba(2,47,66,0.05)]">
                   {isCompleted ? "Audit Module" : "Begin Workshop"} <ArrowRight className="w-3 h-3" />
                 </div>
               ) : (
                 <div className="pt-5 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-gray-400 font-black text-[9px] uppercase tracking-widest">
                       Locked via {modules[index-1]?.num}
                    </div>
                 </div>
               )}
            </Link>
          );
        })}
      </div>

      {/* Strategic Insights */}
      <div className="mt-12 bg-[#f2f6fa] p-10 border border-[rgba(2,47,66,0.1)] relative overflow-hidden rounded-sm">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ffd800]"></div>
        <div className="flex flex-col md:flex-row items-start gap-10">
          <div className="bg-white p-5 shadow-inner shrink-0 border border-gray-50">
             <Target className="w-8 h-8 text-[#ffd800]" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-[#022f42] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              The Precision Edge
            </h4>
            <div className="text-sm text-[#1e4a62] leading-relaxed max-w-4xl space-y-6 font-medium opacity-80">
              <p>
                Capital is a commodity. Reaching out to the wrong investors consumes your runway and burns your equity. You must treat fundraising exactly like a highly-targeted B2B enterprise sales pipeline.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="bg-white p-6 border border-gray-100 shadow-sm relative">
                  <h5 className="font-black text-[11px] uppercase tracking-widest mb-3 text-[#022f42] flex items-center gap-2">
                     <Target className="w-3 h-3 text-[#ffd800]" /> Thesis Matching
                  </h5>
                  <p className="text-xs leading-relaxed">Approaching a pre-seed consumer fund with a Series A deep-tech pitch generates a 100% rejection rate. Align your outreach directly to their active deployment thesis.</p>
                </div>
                <div className="bg-white p-6 border border-gray-100 shadow-sm">
                  <h5 className="font-black text-[11px] uppercase tracking-widest mb-3 text-[#022f42] flex items-center gap-2">
                     <Zap className="w-3 h-3 text-[#ffd800]" /> Competitor Lock-Out
                  </h5>
                  <p className="text-xs leading-relaxed">Failing to screen an investor&apos;s current portfolio can lead to sharing sensitive strategic data directly with a board member of your core competitor.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
