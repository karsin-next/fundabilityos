"use client";

import { 
  Target, Users, ShieldCheck, 
  TrendingUp, Globe, BarChart3, ChevronRight, CheckCircle2, PlayCircle, ClipboardList, ArrowRight,
  AlertTriangle, RefreshCw, Zap, AlertCircle, Banknote, DollarSign, HeartHandshake, Lightbulb, Swords, Package
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/useUser";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TractionTracker } from "@/components/dashboard/TractionTracker";

const subModules = [
  { id: "1-problem",     title: "1.1.1 Problem & Hypothesis",          icon: Lightbulb,     desc: "Are you solving a real, painful problem?",          status: "not_started", time: "3 min" },
  { id: "2-customer",    title: "1.1.2 Customer Persona",               icon: Users,         desc: "Who exactly is your early adopter?",                status: "not_started", time: "4 min" },
  { id: "3-competitor",  title: "1.1.3 Competitor Analysis",            icon: Swords,        desc: "Where is your white space?",                        status: "not_started", time: "5 min" },
  { id: "4-product",     title: "1.1.4 Product Readiness",              icon: Package,       desc: "Stage of development & uniqueness.",                status: "not_started", time: "2 min" },
  { id: "5-market",      title: "1.1.5 Market Opportunity",             icon: Globe,         desc: "TAM/SAM/SOM and timing.",                           status: "not_started", time: "4 min" },
  { id: "6-pmf",         title: "1.1.6 Product-Market Fit & Traction",  icon: TrendingUp,    desc: "Vitamin vs. Painkiller analysis.",                  status: "not_started", time: "3 min" },
  { id: "7-revenue",     title: "1.1.7 Revenue Model Explorer",         icon: DollarSign,    desc: "Pricing power and margins.",                        status: "not_started", time: "4 min" },
  { id: "8-team",        title: "1.1.8 Team Composition Audit",         icon: HeartHandshake,desc: "Founding team strength and gaps.",                  status: "not_started", time: "3 min" },
  { id: "9-financial",   title: "1.1.9 Financial Snapshot",             icon: Banknote,      desc: "MRR, burn, cash balance & runway.",                 status: "not_started", time: "4 min" },
  { id: "10-fundraising",title: "1.1.10 Fundraising Ask",               icon: Target,        desc: "Raise amount, use-of-funds & close date.",          status: "not_started", time: "3 min" },
];

export default function AuditHubPage() {
  const { user } = useUser();
  const [modules, setModules] = useState(subModules);
  const [latestReport, setLatestReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id) return;
      setLoading(true);

      try {
        // 1. Fetch latest report for gaps and activity
        const { data: reportData } = await supabase
          .from("reports")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (reportData && reportData[0]) {
          setLatestReport(reportData[0]);
        }

        // 2. Fetch completed modules from audit_responses
        const { data: responseData } = await supabase
          .from("audit_responses")
          .select("module_id")
          .eq("user_id", user.id);

        const completedModuleIds = new Set(responseData?.map((r: { module_id: string }) => r.module_id) || []);
        
        const updatedModules = subModules.map((m) => ({
          ...m,
          status: completedModuleIds.has(m.id) ? "completed" : "not_started"
        }));

        setModules(updatedModules);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const score = latestReport?.score || 0;
  const band = latestReport?.band || "Pending Scan";

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
      
      {/* ─── QUICK ACTION BAR ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10 bg-white border-2 border-[#022f42]/5 p-4 shadow-sm rounded-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#ffd800] flex items-center justify-center rounded-sm">
            <Zap className="text-[#022f42]" size={24} />
          </div>
          <div>
            <h2 className="text-sm font-black text-[#022f42] uppercase tracking-widest">Founder Action Hub</h2>
            <p className="text-[10px] font-bold text-[#022f42]/40 uppercase tracking-widest">Quick controls for your assessment</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/interview" className="btn bg-[#022f42] text-[#ffd800] px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-all">
            Retake Assessment
          </Link>
          {latestReport && (
            <Link href={`/report/${latestReport.id}`} className="btn border-2 border-[#022f42]/10 px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:border-[#022f42] transition-all">
              View Full Report
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* ─── SCORE GAUGE (LEFT/CENTER) ────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-[#022f42] rounded-md shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-12 border-b-[10px] border-[#ffd800]">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Target size={300} /></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
             <div className="inline-block bg-[#ffd800] text-[#022f42] font-black px-4 py-1.5 mb-10 text-[10px] uppercase tracking-widest shadow-sm">
               Fundability Score Index
             </div>

             <div className="relative w-72 h-40 mb-10 overflow-hidden">
                <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 55">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#ffd800"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="126"
                    strokeDashoffset={126 - (score / 100) * 126}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                  <span className="text-7xl font-black text-white leading-none tracking-tighter">
                    {loading ? "--" : (latestReport ? score : "--")}
                  </span>
                  <span className="text-[10px] font-black text-[#ffd800] uppercase tracking-[0.3em] mt-2">
                    {latestReport ? "OUT OF 100" : "NO DATA"}
                  </span>
                </div>
             </div>

             <div className="bg-white/5 border border-white/10 px-8 py-4 backdrop-blur-md flex flex-col items-center gap-2">
               <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Market Readiness Level</div>
               <div className="text-lg font-black text-white uppercase tracking-tight">{band}</div>
             </div>

             {!latestReport && !loading && (
               <Link href="/interview" className="mt-8 btn bg-[#ffd800] text-[#022f42] px-8 py-3 text-xs font-black uppercase tracking-widest shadow-xl hover:bg-white transition-all">
                 Start Your First Diagnostic
               </Link>
             )}
          </div>
        </div>

        {/* ─── TOP 3 GAPS (RIGHT) ────────────────────────────────────────────── */}
        <div className="bg-white border-2 border-[#022f42]/5 shadow-sm p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#022f42]/5">
            <h3 className="text-xs font-black text-[#022f42] uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" /> Critical Gaps
            </h3>
            <span className="text-[9px] font-bold text-[#022f42]/40 uppercase tracking-widest">Priority Actions</span>
          </div>

          <div className="space-y-6 flex-1">
            {latestReport?.top_3_gaps?.length > 0 ? (
              latestReport.top_3_gaps.map((gap: any, i: number) => (
                <div key={i} className="group cursor-default">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[10px] font-black text-[#022f42] uppercase tracking-widest">{gap.dimension}</span>
                  </div>
                  <p className="text-xs font-medium text-[#1e4a62]/60 leading-relaxed pl-4 border-l-2 border-[#022f42]/5 group-hover:border-[#ffd800] transition-colors">
                    {gap.explanation}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                <ShieldCheck size={48} className="mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">No Gaps Identified Yet</p>
              </div>
            )}
          </div>
          
          <Link href="/dashboard/score" className="mt-8 text-center text-[10px] font-black text-[#022f42] uppercase tracking-widest hover:text-[#ffd800] transition-colors">
            View All Insights <ArrowRight size={10} className="inline ml-1" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        
        {/* ─── RECENT ACTIVITY ───────────────────────────────────────────────── */}
        <div className="lg:col-span-1 bg-white border-2 border-[#022f42]/5 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#022f42]/5">
            <h3 className="text-xs font-black text-[#022f42] uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={16} className="text-[#ffd800]" /> Recent Activity
            </h3>
          </div>
          <div className="space-y-6">
            {latestReport ? (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#ffd800]/20 flex items-center justify-center shrink-0">
                  <TrendingUp size={14} className="text-[#022f42]" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-[#022f42] uppercase tracking-tight">Assessment Completed</p>
                  <p className="text-[10px] text-[#022f42]/40 font-bold uppercase tracking-widest mt-1">
                    Score: {score} | {new Date(latestReport.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#022f42]/40 font-bold uppercase tracking-widest text-center py-10">No recent activity</p>
            )}
            
            {latestReport?.is_unlocked && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <ShieldCheck size={14} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-emerald-700 uppercase tracking-tight">Alpha Report Unlocked</p>
                  <p className="text-[10px] text-emerald-600/40 font-bold uppercase tracking-widest mt-1">Full 8-dimension data access</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── TRACTION TELEMETRY (CENTER/RIGHT) ───────────────────────────────── */}
        <div className="lg:col-span-2">
          <TractionTracker />
        </div>
      </div>

      {/* ─── MODULE HUB ──────────────────────────────────────────────────────── */}
      <div className="mb-10 flex items-center justify-between border-b-2 border-[#022f42]/5 pb-6 mt-10">
        <h2 className="text-sm font-black text-[#022f42] uppercase tracking-[0.3em] flex items-center gap-4">
          <div className="w-3 h-3 bg-red-500 animate-pulse" />
          Institutional Due Diligence Gates
        </h2>
        <div className="text-[10px] font-bold text-[#022f42]/40 uppercase tracking-[0.2em]">10 MANDATORY GATES</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
        {modules.map((mod, index) => (
          <Link 
            key={mod.id}
            href={`/dashboard/audit/${mod.id}`}
            className={`group p-6 border-2 transition-all relative ${
              mod.status === "completed" 
                ? "border-emerald-200 bg-emerald-50/20" 
                : "border-[#022f42]/5 bg-white hover:border-[#ffd800]"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <mod.icon className={`w-5 h-5 ${mod.status === "completed" ? "text-emerald-500" : "text-[#022f42]/40 group-hover:text-[#022f42]"}`} />
              {mod.status === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <h3 className="text-xs font-black text-[#022f42] uppercase tracking-tight mb-1">{mod.title}</h3>
            <p className="text-[10px] font-medium text-[#1e4a62]/40 leading-relaxed line-clamp-2">{mod.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
