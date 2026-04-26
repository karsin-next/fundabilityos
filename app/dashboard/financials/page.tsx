/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { 
  Calculator, Activity, Wallet, CheckCircle2, ChevronRight,
  ArrowRight, RefreshCcw, Landmark
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/useUser";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const financialModules = [
  { id: "metrics", title: "Scenario & Metrics Simulator", icon: Calculator, desc: "Define your core KPIs and stress-test your runway.", status: "not_started", time: "5 min", num: "2.1.1" },
  { id: "breakeven", title: "EBDAT Breakeven Analysis", icon: Activity, desc: "Find the exact date your business becomes default alive.", status: "locked", time: "4 min", num: "2.1.2" },
  { id: "cash-flow", title: "Cash Flow Snapshot", icon: Wallet, desc: "Visualize your 12-month trailing vs. projected flow.", status: "locked", time: "3 min", num: "2.1.3" },
];

export default function FinancialsHubPage() {
  const { user } = useUser();
  const [modules, setModules] = useState(financialModules);
  const [overallProgress, setOverallProgress] = useState(0);
  const [runway, setRunway] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadState() {
      if (!user?.id) return;

      // Check current report for financial snapshot
      const { data: report } = await supabase
        .from("reports")
        .select("financial_snapshot")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const snapshot = report?.financial_snapshot as Record<string, any>;
      
      // Mock completion status based on snapshot presence
      const hasMetrics = !!snapshot?.metrics;
      const hasBreakeven = !!snapshot?.breakeven;
      const hasCashFlow = !!snapshot?.cashFlow;

      const mockState = financialModules.map((m) => {
        let status = "locked";
        if (m.id === "metrics") status = hasMetrics ? "completed" : "not_started";
        if (m.id === "breakeven") {
          if (hasMetrics) status = hasBreakeven ? "completed" : "not_started";
        }
        if (m.id === "cash-flow") {
          if (hasBreakeven) status = hasCashFlow ? "completed" : "not_started";
        }
        return { ...m, status };
      });

      setModules(mockState);
      const completedCount = [hasMetrics, hasBreakeven, hasCashFlow].filter(Boolean).length;
      setOverallProgress(Math.round((completedCount / financialModules.length) * 100));

      if (snapshot?.metrics) {
        const { mrr = 0, burn = 0, cash = 0 } = snapshot.metrics;
        const netBurn = Math.max(0, burn - mrr);
        const r = netBurn > 0 ? Math.floor(cash / netBurn) : (mrr >= burn ? 99 : 0);
        setRunway(r);
      }
    }

    loadState();
  }, [user, supabase]);

  const resetModule = async () => {
    if (confirm("Are you sure you want to reset all financial data?")) {
      // In production, we'd clear the snapshot in Supabase
      alert("Reset logic would clear Supabase snapshot in production.");
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
    <div className="max-w-5xl mx-auto p-4 lg:p-8">
      {/* Premium Hub Header */}
      <div className="mb-8 bg-[#022f42] text-white p-10 shadow-2xl border-b-8 border-[#ffd800] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffd800] rounded-full blur-[120px] opacity-10"></div>
        <div className="inline-block bg-[#ffd800] text-[#022f42] font-black px-4 py-1 mb-5 text-[10px] uppercase tracking-[0.3em] relative z-10 transition-transform group-hover:scale-105">
          Module 2.1
        </div>
        <h1 className="text-3xl font-bold mb-3 relative z-10">Manual Financial Input</h1>
        <p className="text-[#b0d0e0] text-sm max-w-2xl leading-relaxed relative z-10 font-medium">
          Transition from qualitative hypotheses to quantitative proof. Use these modules to build your financial foundation and generate your investor-ready runway trajectory.
        </p>
        
        <div className="mt-10 bg-white/5 p-6 border border-white/20 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 w-full">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd800] mb-3">
                <span>Activation Progress</span>
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
               <div className="text-right border-r border-white/10 pr-6 hidden md:block">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Calculated Runway</span>
                  <span className="text-3xl font-black text-white">{runway === null ? "--" : runway === 99 ? "∞" : `${runway} MO`}</span>
               </div>
               <div className="flex flex-col sm:flex-row gap-2">
                 <button onClick={resetModule} className="p-3 bg-white/5 text-white/40 hover:text-rose-400 hover:bg-rose-400/10 transition-all rounded-sm">
                   <RefreshCcw className="w-4 h-4" />
                 </button>
                 <Link href={modules.find(m => m.status === 'not_started')?.id ? `/dashboard/financials/${modules.find(m => m.status === 'not_started')?.id}` : '/dashboard/financials/metrics'} className="px-8 py-3 bg-[#ffd800] text-[#022f42] font-black uppercase tracking-widest text-xs hover:bg-white transition-all shadow-lg active:scale-95">
                   {overallProgress === 0 ? "Initial Setup" : overallProgress === 100 ? "Re-Simulate" : "Continue"}
                 </Link>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod, index) => {
          const isLocked = mod.status === "locked";
          const isCompleted = mod.status === "completed";
          const href = isLocked ? "#" : `/dashboard/financials/${mod.id}`;
          
          return (
            <Link key={mod.id} href={href} className={`group block p-6 border-2 transition-all duration-300 relative ${getStatusColor(mod.status)} ${isLocked ? "cursor-not-allowed opacity-50" : "hover:scale-[1.02] hover:shadow-2xl cursor-pointer"}`}>
               {isCompleted && (
                 <div className="absolute -top-3 -right-3 bg-emerald-500 text-white p-1 rounded-full shadow-lg z-20">
                    <CheckCircle2 className="w-5 h-5" />
                 </div>
               )}
               
               <div className="flex justify-between items-start mb-6">
                 <div className="w-10 h-10 bg-[#022f42] text-[#ffd800] flex items-center justify-center font-black rounded-sm shadow-md group-hover:bg-[#ffd800] group-hover:text-[#022f42] transition-colors">
                   <mod.icon className="w-5 h-5" />
                 </div>
                 <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1e4a62]/40 bg-[#f2f6fa] px-2 py-1 rounded-sm">
                   {mod.time}
                 </div>
               </div>
               
               <div className="mb-4">
                 <div className="text-[10px] font-black text-[#1e4a62]/40 uppercase tracking-widest mb-1">{mod.num}</div>
                 <h3 className="font-black text-[#022f42] leading-tight text-lg mb-2">{mod.title}</h3>
                 <p className="text-[11px] text-[#1e4a62]/80 leading-relaxed min-h-[3rem]">{mod.desc}</p>
               </div>

               {!isLocked ? (
                 <div className="flex items-center gap-2 text-[#022f42] font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all pt-4 border-t border-[rgba(2,47,66,0.05)]">
                   {isCompleted ? "Edit Parameters" : "Begin Module"} <ArrowRight className="w-3 h-3" />
                 </div>
               ) : (
                 <div className="pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">
                      Locked By Dependency <ChevronRight className="w-3 h-3" />
                    </div>
                    <p className="text-[9px] text-gray-400 leading-tight">
                      Requires completion of {financialModules[index - 1]?.num}
                    </p>
                 </div>
               )}
            </Link>
          );
        })}
      </div>

      {/* Compliance & Benchmarking Footnote */}
      <div className="mt-16 bg-[#f2f6fa] p-10 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#022f42]"></div>
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="bg-white p-4 shadow-sm shrink-0 border border-gray-50">
             <Landmark className="w-8 h-8 text-[#022f42]" />
          </div>
          <div>
            <h4 className="text-sm font-black text-[#022f42] uppercase tracking-widest mb-3">Institutional Benchmark Compliance</h4>
            <p className="text-xs text-[#1e4a62] leading-relaxed max-w-3xl">
              By reporting your financials through FundabilityOS, you ensure that your metrics are aligned with the <strong>Standard Venture Reporting Framework (SVRF)</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
