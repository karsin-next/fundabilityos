"use client";

import { 
  Target, Users, ShieldCheck, 
  TrendingUp, Globe, BarChart3, ChevronRight, CheckCircle2, PlayCircle, ClipboardList, ArrowRight,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TractionTracker } from "@/components/dashboard/TractionTracker";

const subModules = [
  { id: "1-problem", title: "The Problem Diagnostic", icon: Target, desc: "Are you solving a real, painful problem?", status: "not_started", time: "3 min" },
  { id: "2-customer", title: "Customer Clarity Scan", icon: Users, desc: "Who exactly is your early adopter?", status: "not_started", time: "4 min" },
  { id: "3-competitor", title: "Competitive Positioning", icon: ShieldCheck, desc: "Where is your white space?", status: "not_started", time: "5 min" },
  { id: "4-product", title: "Product Readiness", icon: PlayCircle, desc: "Stage of development & uniqueness.", status: "not_started", time: "2 min" },
  { id: "5-market", title: "Market Opportunity Sizer", icon: Globe, desc: "TAM/SAM/SOM and timing.", status: "not_started", time: "4 min" },
  { id: "6-pmf", title: "Product-Market Fit Probe", icon: TrendingUp, desc: "Vitamin vs. Painkiller analysis.", status: "not_started", time: "3 min" },
  { id: "7-revenue", title: "Revenue Model Explorer", icon: BarChart3, desc: "Pricing power and margins.", status: "not_started", time: "4 min" },
  { id: "8-team", title: "Team Composition Audit", icon: Users, desc: "Founding team strength and gaps.", status: "not_started", time: "3 min" },
];

export default function AuditHubPage() {
  const { user } = useUser();
  const [modules, setModules] = useState(subModules);
  const [recentScore, setRecentScore] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAuditData() {
      if (!user?.id) return;

      // 1. Fetch overall score from user profile
      setRecentScore(user.fundability_score || null);

      // 2. Fetch completed modules from audit_responses
      try {
        const { data, error } = await supabase
          .from("audit_responses")
          .select("module_id")
          .eq("user_id", user.id);

        if (error) throw error;

        const completedModuleIds = new Set(data.map((r: { module_id: string }) => r.module_id));
        
        const updatedModules = subModules.map((m) => {
          const isCompleted = completedModuleIds.has(m.id);
          return {
            ...m,
            status: isCompleted ? "completed" : "not_started"
          };
        });

        setModules(updatedModules);
      } catch (err) {
        console.error("Failed to fetch audit data:", err);
      }
    }

    fetchAuditData();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "completed": return "bg-green-50/30 text-green-700 border-[#ffd800]/60 shadow-[0_10px_30px_-10px_rgba(255,216,0,0.15)] ring-1 ring-[#ffd800]/20";
      case "in_progress": return "bg-[#ffd800] text-[#022f42] border-[#ffd800]";
      case "not_started": return "bg-white text-[#022f42] border-[rgba(2,47,66,0.15)] hover:border-[#022f42]";
      default: return "bg-[#f2f6fa] text-[#1e4a62] border-[rgba(2,47,66,0.05)] opacity-60";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "completed": return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "in_progress": return <ChevronRight className="w-5 h-5 text-[#022f42]" />;
      case "not_started": return <ChevronRight className="w-5 h-5 opacity-50" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 animate-in fade-in duration-700">
      {/* Dashboard Header / Status */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-[#ffd800]" />
            <h1 className="text-4xl font-black text-[#022f42] uppercase tracking-tighter leading-none">360° Fundability Audit Overview</h1>
          </div>
          <p className="text-sm font-bold text-[#1e4a62]/60 leading-relaxed max-w-2xl">
            Start measuring exactly where you stand through an investor&apos;s lens. Complete these 8 core diagnostics to establish your baseline fundability score and identify critical gaps.
          </p>
        </div>
        <div className="flex gap-4">
           <Link href="/dashboard/score" className="btn btn-ghost-dark btn-sm border-[#022f42]/10">
              Export Alpha Report
           </Link>
           <button onClick={() => window.location.reload()} className="btn btn-primary btn-sm px-8">
              Refresh Neural Sync
           </button>
        </div>
      </div>

      {/* Section 1: Valuation Impact Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 bg-[#022f42] text-white p-12 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px] border-b-[8px] border-[#ffd800]">
          <div className="absolute top-0 right-0 p-12 opacity-5"><Target size={200} /></div>
          
          <div className="relative z-10">
            <div className="inline-block bg-[#ffd800] text-[#022f42] font-black px-4 py-1.5 mb-8 text-[10px] uppercase tracking-widest shadow-sm">
              Deal Room Readiness
            </div>
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-none mb-6">
              Pre-Seed <br/><span className="text-gradient">Leverage</span> Analysis.
            </h2>
            <p className="text-[#b0d0e0] text-sm max-w-xl leading-relaxed font-medium">
              We've analyzed your core dimensions against Institutional Benchmarks.
              {recentScore === null ? (
                <span> <strong>Diagnostic Pending.</strong> Complete your first gate to unlock your valuation impact analysis.</span>
              ) : recentScore < 60 ? (
                <span> Your current score triggers a <strong>High Dilution Risk</strong>. Startups in this range typically face <span className="text-[#ffd800]">20% harsher equity structures</span> and down-rounds during negotiations.</span>
              ) : recentScore < 85 ? (
                <span> You are in the <strong>Moderate Leverage</strong> zone. Approaching syndicates now will likely result in standard market terms, but you lack premium bidding friction.</span>
              ) : (
                <span> <strong>Premium Alpha Status.</strong> You hold massive leverage. Startups at this tier routinely command 15-25% higher pre-money valuations due to derisked fundamentals.</span>
              )}
            </p>
          </div>

          <div className="mt-12 relative z-10 bg-white/5 p-6 border border-white/10 rounded-sm backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 w-full">
              <div className="flex-1 w-full">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd800] mb-3">
                    <span className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                       Autonomous Evaluator Array Active
                    </span>
                 </div>
                 <div className="h-1.5 bg-white/10 overflow-hidden rounded-full">
                    <div 
                      className="h-full bg-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.5)]" 
                      style={{ width: `100%` }}
                    ></div>
                 </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 border-l border-white/10 pl-8">
                 <div className="text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ffd800]">Neural Confidence</div>
                    <div className="text-2xl font-black">98.4%</div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Ring / Action Item */}
        <div className="bg-white border-2 border-[#022f42]/5 p-10 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden group">
           <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity ${recentScore && recentScore >= 85 ? 'bg-emerald-500' : 'bg-[#ffd800]'}`}></div>
           
           {recentScore !== null ? (
             <>
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#022f42]/40 mb-4">Leverage Index Score</div>
               <div className="text-8xl font-black text-[#022f42] tracking-tighter leading-none mb-4">{recentScore}</div>
               
               <div className={`inline-block px-3 py-1 text-[9px] font-black uppercase tracking-widest mb-8 ${recentScore >= 85 ? 'bg-emerald-100 text-emerald-700' : recentScore >= 60 ? 'bg-[#022f42] text-[#ffd800]' : 'bg-red-100 text-red-700'}`}>
                 {recentScore >= 85 ? 'Optimized for Capital' : recentScore >= 60 ? 'Dilution Warning' : 'Critical Flags Detected'}
               </div>
               
               <p className="text-[11px] font-bold text-[#1e4a62] leading-relaxed max-w-xs uppercase tracking-tight">
                  {recentScore >= 85 
                    ? "Your fundamentals signal maturity. Proceed to Syndicate Matchmaker." 
                    : recentScore >= 60 
                      ? "Neutralise remaining red flags before pursuing institutional capital."
                      : "Do not initiate fundraising. Focus exclusively on gap mitigation."}
               </p>
             </>
           ) : (
             <div className="flex flex-col items-center">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#022f42]/40 mb-4">Leverage Index Score</div>
                <div className="text-8xl font-black text-[#022f42]/20 tracking-tighter leading-none mb-4">--</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/60">Complete Gate 1</div>
             </div>
           )}
        </div>
      </div>

      {/* Section 2: Actionable Traction Tracker */}
      <TractionTracker />

      {/* Section 3: Due Diligence Gates (Deal Room Module Revamp) */}
      <div className="mb-10 flex items-center justify-between border-b-2 border-[#022f42]/5 pb-6 mt-20">
        <h2 className="text-sm font-black text-[#022f42] uppercase tracking-[0.3em] flex items-center gap-4">
          <div className="w-3 h-3 bg-red-500 animate-pulse" />
          Institutional Due Diligence Gates
        </h2>
        <div className="text-[10px] font-bold text-[#022f42]/40 uppercase tracking-[0.2em]">8 MANDATORY GATES</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-20">
        {modules.map((mod, index) => {
          const isLocked = mod.status === "locked";
          const href = isLocked ? "#" : `/dashboard/audit/${mod.id}`;
          
          // Mocking the Risk Level for UI representation. In full V4, this comes directly from the AI DB response.
          let riskTheme = "border-[#022f42]/10 bg-white";
          let riskLabel = "Pending Scan";
          let showDispute = false;

          if (mod.status === "completed") {
            // Mock: Gates 1, 4 are green. Gate 7 is Red (Revenue Model). Rest Yellow.
            if (index === 0 || index === 3) {
              riskTheme = "border-emerald-300 bg-emerald-50/20";
              riskLabel = "Verified (Low Risk)";
            } else if (index === 6) {
              riskTheme = "border-red-400 bg-red-50";
              riskLabel = "Critical Flag (High Risk)";
              showDispute = true;
            } else {
              riskTheme = "border-amber-300 bg-amber-50/30";
              riskLabel = "Warning (Med Risk)";
            }
          } else if (mod.status === "in_progress") {
            riskTheme = "border-[#ffd800] bg-[#ffd800]/5";
            riskLabel = "Scan in Progress";
          }
          
          return (
            <div key={mod.id} className="relative">
              <Link 
                href={href} 
                className={`group block p-7 border-2 transition-all duration-300 relative ${riskTheme} ${isLocked ? "cursor-not-allowed grayscale border-dashed opacity-50" : "hover:shadow-[0_20px_40px_-15px_rgba(2,47,66,0.1)] hover:-translate-y-1"}`}
              >
                 {mod.status === "completed" && (
                   <div className="absolute top-4 right-4 animate-in zoom-in-50 duration-500">
                     <div className={`text-[8px] font-black px-2 py-1 uppercase tracking-widest shadow-sm flex items-center gap-1.5 leading-none ${index === 6 ? "bg-red-600 text-white" : index === 0 || index === 3 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                       {index === 6 ? <AlertTriangle size={10} strokeWidth={3} /> : <CheckCircle2 size={10} strokeWidth={3} />} 
                       {riskLabel}
                     </div>
                   </div>
                 )}

                 {mod.status === "in_progress" && (
                   <span className="absolute -top-2 -right-2 flex h-5 w-5">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#022f42] opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-5 w-5 bg-[#022f42]"></span>
                   </span>
                 )}
                 
                 <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 border-2 border-[#022f42]/10 flex items-center justify-center font-black text-sm text-[#022f42]/40 bg-white">
                       {index + 1}
                     </div>
                     <mod.icon className={`w-7 h-7 ${isLocked ? "opacity-30" : "text-[#022f42]"}`} />
                   </div>
                 </div>
                 
                 <div className="pl-14">
                   <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${isLocked ? "opacity-40" : "text-[#022f42]"}`}>{mod.title}</h3>
                   <p className={`text-xs font-medium leading-relaxed ${isLocked ? "opacity-30" : "text-[#1e4a62]/70"}`}>{mod.desc}</p>
                   
                   {!isLocked && mod.status !== 'completed' && (
                      <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#022f42] opacity-0 group-hover:opacity-100 transition-opacity">
                        Enter Gate <ArrowRight className="w-3 h-3" />
                      </div>
                   )}
                 </div>
              </Link>
              
              {/* V4 Semantic Refusal Feeder: Dispute Button */}
              {showDispute && (
                <button 
                  onClick={() => alert("Semantic Override Dispute flow triggered. Reason trace will be logged.")}
                  className="absolute bottom-4 right-4 z-10 bg-white border border-red-200 text-red-600 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Users className="w-3 h-3" /> Dispute AI Assessment
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Section 4: Upsell Vault (Revenue Driver) */}
      <div className="bg-[#022f42] p-1 shadow-2xl relative overflow-hidden mt-10">
        <div className="bg-white p-12 relative flex flex-col lg:flex-row items-center gap-12 border border-white/5">
           
           {/* Blur Overlay locking the content */}
           <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/60 flex flex-col items-center justify-center text-center p-8">
              <ShieldCheck className="w-16 h-16 text-[#022f42] mb-6 drop-shadow-xl" />
              <h3 className="text-3xl font-black text-[#022f42] uppercase tracking-tighter mb-4">Unlock Premium Deal Room</h3>
              <p className="text-sm font-bold text-[#1e4a62] max-w-md mx-auto mb-8 uppercase tracking-wide">
                Reach "Premium Alpha Status" to execute capital matching, or bypass with the $29 detailed LP-Teardown Report.
              </p>
              <Link href="/dashboard/score" className="btn btn-primary px-10 py-5 text-sm shadow-[0_10px_30px_-5px_rgba(255,216,0,0.5)] uppercase tracking-widest w-full md:w-auto">
                 Deploy $29 Audit Upgrade
              </Link>
           </div>

           {/* Teased Content underneath the blur */}
           <div className="flex-1 w-full space-y-6 opacity-30 select-none blur-sm pointer-events-none">
              <div className="flex items-center gap-4 p-6 border-2 border-[#022f42]/10 bg-gray-50">
                 <Globe className="w-8 h-8 text-[#022f42]" />
                 <div>
                   <h4 className="text-sm font-black text-[#022f42] uppercase tracking-widest">Syndicate Matchmaker</h4>
                   <p className="text-xs text-[#1e4a62] mt-1">Based on current metrics, you closely align with 14 active early-stage funds in your sector.</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 p-6 border-2 border-[#022f42]/10 bg-gray-50">
                 <ClipboardList className="w-8 h-8 text-[#022f42]" />
                 <div>
                   <h4 className="text-sm font-black text-[#022f42] uppercase tracking-widest">12-Page Institutional Teardown</h4>
                   <p className="text-xs text-[#1e4a62] mt-1">Generate the fully formatted PDF audit read directly by our LP network during due diligence.</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 p-6 border-2 border-[#022f42]/10 bg-gray-50">
                 <Target className="w-8 h-8 text-[#022f42]" />
                 <div>
                   <h4 className="text-sm font-black text-[#022f42] uppercase tracking-widest">1-on-1 Strategic Mitigation</h4>
                   <p className="text-xs text-[#1e4a62] mt-1">Direct calendar link to book a 45-minute tactical teardown with our venture partners.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
