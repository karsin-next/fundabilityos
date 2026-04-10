"use client";

import { 
  Target, Users, ShieldCheck, 
  TrendingUp, Globe, BarChart3, ChevronRight, CheckCircle2, PlayCircle, ClipboardList, ArrowRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { AIAuditScanner } from "@/components/assessment/AIAuditScanner";
import { createClient } from "@/lib/supabase/client";

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
  const { user } = useAuth();
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

      {/* Main Command Header (The Big Score) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <div className="lg:col-span-2 bg-[#022f42] text-white p-12 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px] border-b-[8px] border-[#ffd800]">
          <div className="absolute top-0 right-0 p-12 opacity-5"><Target size={200} /></div>
          
          <div className="relative z-10">
            <div className="inline-block bg-[#ffd800] text-[#022f42] font-black px-4 py-1.5 mb-8 text-[10px] uppercase tracking-widest shadow-sm">
              Current Benchmark
            </div>
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-none mb-6">
              Your <span className="text-gradient">Fundability</span> <br/>Sequence.
            </h2>
            <p className="text-[#b0d0e0] text-sm max-w-xl leading-relaxed font-medium">
              We&apos;ve analyzed your current trajectory across 8 core dimensions. You are currently in the <strong>{recentScore ? (recentScore > 70 ? 'Top 15%' : 'Top 40%') : 'Diagnostic'}</strong> of ASEAN founders in your sector.
            </p>
          </div>

          <div className="mt-12 relative z-10 bg-white/5 p-6 border border-white/10 rounded-sm backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 w-full">
              <div className="flex-1 w-full">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd800] mb-3">
                    <span className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                       Institutional Monitoring Active
                    </span>
                    <span>Next Daily Sync: 06:00 AM</span>
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
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#ffd800]">Score Reliability</div>
                    <div className="text-2xl font-black">98.4%</div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Ring / Quick Info */}
        <div className="bg-white border-2 border-[#022f42]/5 p-10 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffd800] rounded-full blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
           
           {recentScore !== null ? (
             <>
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#022f42]/40 mb-4">Global Health Score</div>
               <div className="text-8xl font-black text-[#022f42] tracking-tighter leading-none mb-4">{recentScore}</div>
               <div className="inline-block bg-[#022f42] text-[#ffd800] px-3 py-1 text-[9px] font-black uppercase tracking-widest mb-8">Investor-Ready</div>
               
               <p className="text-[11px] font-bold text-[#1e4a62] leading-relaxed max-w-xs uppercase tracking-tight">
                  High alignment in <strong>Product Readiness</strong>. Critical gap detected in <strong>Revenue Model</strong>.
               </p>
             </>
           ) : (
             <div className="flex flex-col items-center">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#022f42]/40 mb-4">Global Health Score</div>
                <div className="text-8xl font-black text-[#022f42]/20 tracking-tighter leading-none mb-4">--</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/60">Waiting for First Audit</div>
             </div>
           )}
        </div>
      </div>

      {/* AI Fast-Track Section */}
      <div className="mb-20 glass-premium p-1">
        <div className="p-10 bg-white shadow-xl flex flex-col md:flex-row gap-12 items-center">
           <div className="max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-[#ffd800]" />
                <h2 className="text-xs font-black text-[#022f42] uppercase tracking-[0.3em] leading-none">Neural Speed-Run</h2>
              </div>
              <h3 className="text-3xl font-black text-[#022f42] tracking-tighter uppercase mb-4 leading-none">Populate all 8 modules <br/><span className="text-[#ffd800] WebkitTextStroke-[1px] WebkitTextStroke-[#022f42]">instantly.</span></h3>
              <p className="text-sm font-medium text-[#1e4a62]/70 leading-relaxed mb-8">
                Drop your pitch deck here. Our AI scans 40+ investor metrics and populates your dashboard in seconds, bypassing hours of manual input.
              </p>
           </div>
           <div className="flex-1 w-full">
              <AIAuditScanner onComplete={() => window.location.reload()} />
           </div>
        </div>
      </div>

      {/* Manual Modules Grid */}
      <div className="mb-10 flex items-center justify-between border-b-2 border-[#022f42]/5 pb-6">
        <h2 className="text-sm font-black text-[#022f42] uppercase tracking-[0.3em] flex items-center gap-4">
          <div className="w-3 h-3 bg-[#ffd800]" />
          Diagnostics Index
        </h2>
        <div className="text-[10px] font-bold text-[#022f42]/40 uppercase tracking-[0.2em]">{subModules.length} CORE DIMENSIONS</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modules.map((mod, index) => {
          const isLocked = mod.status === "locked";
          const href = isLocked ? "#" : `/dashboard/audit/${mod.id}`;
          
          return (
            <Link 
              key={mod.id} 
              href={href} 
              className={`group block p-7 border-2 transition-all duration-300 relative ${getStatusColor(mod.status)} ${isLocked ? "cursor-not-allowed grayscale" : "hover:border-[#022f42] hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(2,47,66,0.1)]"}`}
            >
               {mod.status === "completed" && (
                 <div className="absolute top-4 right-4 animate-in zoom-in-50 duration-500">
                   <div className="bg-[#ffd800] text-[#022f42] text-[8px] font-black px-2 py-1 uppercase tracking-widest shadow-lg flex items-center gap-1 leading-none">
                     <CheckCircle2 size={10} strokeWidth={3} /> Verified
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
                   <div className="w-10 h-10 border-2 border-[#022f42]/10 flex items-center justify-center font-black text-sm text-[#022f42]/20 group-hover:border-[#022f42]/20 transition-colors">
                     {index + 1}
                   </div>
                   <mod.icon className={`w-7 h-7 ${isLocked ? "opacity-30" : "text-[#022f42]"}`} />
                 </div>
                 <div className="flex items-center gap-4">
                   <span className={`text-[9px] font-black uppercase tracking-widest ${isLocked ? "opacity-30" : "text-[#022f42]/40"}`}>{mod.time} Read</span>
                   <div className="transition-transform group-hover:scale-110 duration-300">
                     {getStatusIcon(mod.status)}
                   </div>
                 </div>
               </div>
               
               <div className="pl-14">
                 <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${isLocked ? "opacity-40" : "text-[#022f42]"}`}>{mod.title}</h3>
                 <p className={`text-xs font-medium leading-relaxed ${isLocked ? "opacity-30" : "text-[#1e4a62]/70"}`}>{mod.desc}</p>
                 
                 {!isLocked && mod.status !== 'completed' && (
                    <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#022f42] opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Module <ArrowRight className="w-3 h-3" />
                    </div>
                 )}
               </div>
            </Link>
          );
        })}
      </div>

      {/* ML Training Consent Notice */}
      <div className="mt-20 bg-[#022f42] text-white p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <ClipboardList size={80} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#ffd800] mb-4">Neural Data Protocol</h4>
          <p className="text-sm font-medium text-[#b0d0e0] leading-relaxed">
            By completing this institutional audit, you consent to your anonymized data being used to train the FundabilityOS Predictive Models. This enables our ecosystem to provide peer benchmarking, algorithmic risk assessment, and highly personalized gap mitigation while maintaining absolute data integrity and HIPAA-grade encryption for your specific company data.
          </p>
        </div>
      </div>
    </div>
  );
}
