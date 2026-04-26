/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { AIAssistedInsight } from "@/components/AIAssistedInsight";
import { ModuleHeader } from "@/components/ModuleHeader";
import { 
  ArrowRight, ArrowLeft,
  Check, DollarSign, TrendingUp, Calculator,
  CheckCircle2, Plus, X, BarChart, PieChart, Layers, Activity
} from "lucide-react";
import Link from "next/link";
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { useUser } from "@/lib/hooks/useUser";
import { createClient } from "@/lib/supabase/client";

const METRIC_LIBRARY = [
  { id: "mrr", name: "Monthly Rec. Rev (MRR)", icon: DollarSign, req: true, desc: "Total predictable monthly revenue." },
  { id: "burn", name: "Monthly Burn Rate", icon: DollarSign, req: true, desc: "Net cash spent per month." },
  { id: "cash", name: "Current Cash Balance", icon: Calculator, req: true, desc: "Total cash in bank (for runway calculation)." },
  { id: "cac", name: "Customer Acq. Cost", icon: BarChart, req: false, desc: "Cost to acquire a single customer." },
  { id: "ltv", name: "Lifetime Value (LTV)", icon: TrendingUp, req: false, desc: "Total revenue expected from one user." },
  { id: "churn", name: "Revenue Churn %", icon: Activity, req: false, desc: "Monthly revenue lost to cancellations." },
  { id: "gm", name: "Gross Margin %", icon: PieChart, req: false, desc: "Revenue minus cost of goods sold." },
];

export default function FinancialMetricsPage() {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const supabase = createClient();

  // Unified Data State
  const [activeIds, setActiveIds] = useState<string[]>(["mrr", "burn", "cash"]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;
      
      const { data: report } = await supabase
        .from("reports")
        .select("financial_snapshot")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (report?.financial_snapshot) {
        const snap = report.financial_snapshot as Record<string, any>;
        if (snap.metrics) setMetrics(snap.metrics);
        if (snap.activeIds) setActiveIds(snap.activeIds);
      }
      setIsLoaded(true);
    }
    loadData();
  }, [user, supabase]);

  // Calculations
  const mrr = metrics.mrr || 0;
  const burn = metrics.burn || 0;
  const cash = metrics.cash || 0;
  const netBurn = Math.max(0, burn - mrr);
  const runway = netBurn > 0 ? Math.floor(cash / netBurn) : (mrr >= burn ? 99 : 0);
  
  const chartData = [
    { name: 'Month 0', cash: cash },
    { name: 'Month 1', cash: Math.max(0, cash - netBurn) },
    { name: 'Month 3', cash: Math.max(0, cash - (netBurn * 3)) },
    { name: 'Month 6', cash: Math.max(0, cash - (netBurn * 6)) },
    { name: 'Month 12', cash: Math.max(0, cash - (netBurn * 12)) },
  ];

  const addMetric = (id: string) => {
    if (!activeIds.includes(id)) setActiveIds([...activeIds, id]);
  };

  const removeMetric = (id: string) => {
    if (METRIC_LIBRARY.find(m => m.id === id)?.req) return;
    setActiveIds(activeIds.filter(x => x !== id));
    const newMetrics = { ...metrics };
    delete newMetrics[id];
    setMetrics(newMetrics);
  };

  const updateMetric = (id: string, val: string) => {
    setMetrics(prev => ({ ...prev, [id]: parseInt(val) || 0 }));
  };

  const handleNextStep = () => setStep(Math.min(4, step + 1));

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      if (!user?.id) return;

      // 1. Get latest report ID
      const { data: latestReport } = await supabase
        .from("reports")
        .select("id, financial_snapshot")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const existingSnapshot = (latestReport?.financial_snapshot as Record<string, any>) || {};
      const newSnapshot = {
        ...existingSnapshot,
        metrics,
        activeIds,
        lastUpdated: new Date().toISOString()
      };

      if (latestReport?.id) {
        await supabase
          .from("reports")
          .update({ financial_snapshot: newSnapshot })
          .eq("id", latestReport.id);
      }

      setSavedSuccess(true);
      setTimeout(() => window.location.href = "/dashboard/financials", 1500); 
    } catch (e) {
      console.error("Save Error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return (
    <div className="flex items-center justify-center min-h-screen">
       <div className="w-12 h-12 border-4 border-[#022f42]/10 border-t-[#ffd800] rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto pb-32">
      <ModuleHeader 
        badge="2.1.1"
        title="Scenario & Metrics Simulator"
        description="Select your core KPIs, enter current values, and simulate 'what-if' scenarios to calculate your investor-grade runway."
      />

      {/* Progress Bar */}
      <div className="bg-white shadow-sm border border-gray-100 p-4 mb-6 rounded-sm flex items-center justify-between">
        <div className="flex gap-1 md:gap-2">
          {[1,2,3,4].map(i => (
            <div 
              key={i} 
              className={`h-2 w-16 md:w-24 rounded-full transition-all ${step >= i ? 'bg-[#ffd800]' : 'bg-gray-200'}`} 
            />
          ))}
        </div>
        <span className="text-[10px] font-bold text-[#022f42] uppercase tracking-[0.2em] ml-4">
          {step === 1 ? "Metric Selection" : step === 2 ? "Value Entry" : step === 3 ? "Runway Trajectory" : "Scenario Testing"}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          
          {/* STEP 1: Metric Selection */}
          {step === 1 && (
            <div className="bg-white p-8 shadow-lg border-t-[4px] border-[#022f42] rounded-sm min-h-[500px] animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-xl font-black text-[#022f42] mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Select Core Metrics to Track
              </h2>
              <p className="text-sm text-[#1e4a62] mb-8">We&apos;ve pre-selected the mandatory metrics required for runway calculations. Add optional benchmarks to deepen your analysis.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {METRIC_LIBRARY.map(m => {
                  const isActive = activeIds.includes(m.id);
                  return (
                    <div 
                      key={m.id} 
                      onClick={() => isActive ? removeMetric(m.id) : addMetric(m.id)}
                      className={`p-4 border-2 transition-all cursor-pointer group flex items-start gap-4 ${
                        isActive 
                          ? "border-[#022f42] bg-[#f2f6fa]" 
                          : "border-gray-100 hover:border-[#022f42]/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-[#022f42] text-white" : "bg-gray-50 text-gray-400 group-hover:bg-[#022f42]/10"}`}>
                        <m.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-sm font-bold uppercase tracking-tight ${isActive ? "text-[#022f42]" : "text-gray-400"}`}>{m.name}</h3>
                          {m.req && <span className="text-[8px] bg-[#ffd800] text-[#022f42] px-1.5 py-0.5 rounded-sm font-black tracking-widest uppercase">REQ</span>}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{m.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? "bg-[#ffd800] border-[#ffd800]" : "border-gray-200"}`}>
                        {isActive && <Check className="w-3 h-3 text-[#022f42] stroke-[4]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Value Entry */}
          {step === 2 && (
            <div className="bg-[#f2f6fa] border-2 border-dashed border-[rgba(2,47,66,0.15)] p-8 shadow-lg min-h-[500px] animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-xl font-black text-[#022f42] mb-8 border-b border-[rgba(2,47,66,0.1)] pb-4">Active Canvas Pipeline</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeIds.map(id => {
                  const m = METRIC_LIBRARY.find(x => x.id === id)!;
                  return (
                    <div key={id} className="bg-white border border-[#022f42] p-5 shadow-sm relative group">
                      {!m.req && (
                        <button onClick={() => removeMetric(id)} className="absolute top-2 right-2 text-gray-200 group-hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <label className="text-[10px] font-black uppercase text-[#1e4a62] tracking-widest mb-3 block opacity-60">{m.name}</label>
                      <div className="flex items-center border-b-2 border-gray-100 focus-within:border-[#ffd800] transition-colors pb-1">
                        <DollarSign className="w-5 h-5 text-[#022f42]/20 mr-2" />
                        <input 
                          type="number" 
                          className="w-full bg-transparent outline-none font-bold text-2xl text-[#022f42] font-mono" 
                          placeholder="0"
                          value={metrics[id] || ""}
                          onChange={(e) => updateMetric(id, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeIds.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Layers className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">No Active Metrics</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Runway Vis */}
          {step === 3 && (
            <div className="bg-white p-10 shadow-lg border-t-[4px] border-[#022f42] rounded-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-[#022f42] mb-8 text-center uppercase tracking-tight">Runway & Survival Velocity</h2>
              
              <div className="flex flex-col items-center justify-center mb-12">
                 <div className="relative w-52 h-52 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="2.5" stroke="currentColor"/>
                    <path 
                      className={`${runway >= 12 ? 'text-emerald-500' : runway >= 6 ? 'text-[#ffd800]' : 'text-rose-500'} transition-all duration-1000`} 
                      strokeDasharray={`${Math.min(100, (runway/24)*100)}, 100`} 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" 
                      strokeWidth="2.5" 
                      stroke="currentColor"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-7xl font-black text-[#022f42]">{runway === 99 ? '∞' : runway}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#022f42]/40 mt-1">MONTHS</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full bg-[#fcfcfc] border border-gray-50 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#999'}} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{borderRadius: '0px', border: '1px solid #022f42', background: '#022f42', color: '#fff'}}
                      itemStyle={{color: '#ffd800', fontWeight: 'bold'}}
                      formatter={(val: number) => [`$${val.toLocaleString()}`, 'Projected Cash']}
                    />
                    <Bar dataKey="cash" radius={[0, 0, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#022f42' : entry.cash > 0 ? '#ffd800' : '#fda4af'} />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* STEP 4: What-If */}
          {step === 4 && (
            <div className="bg-white p-10 shadow-lg border-t-[4px] border-[#ffd800] rounded-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-[#022f42] mb-10 text-center uppercase tracking-tight">Scenario &apos;What-If&apos; Stress Test</h2>
              
              <div className="space-y-12 mb-12">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Simulated Revenue Target</label>
                      <span className="text-2xl font-black text-emerald-600">${mrr.toLocaleString()}</span>
                    </div>
                    <input type="range" min="0" max={mrr * 5 || 50000} value={mrr} onChange={e=>updateMetric('mrr', e.target.value)} className="w-full accent-emerald-500 cursor-ew-resize" />
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Simulated OpEx Burn</label>
                      <span className="text-2xl font-black text-rose-500">${burn.toLocaleString()}</span>
                    </div>
                    <input type="range" min="0" max={burn * 2 || 50000} value={burn} onChange={e=>updateMetric('burn', e.target.value)} className="w-full accent-rose-500 cursor-ew-resize" />
                 </div>
              </div>

              <div className="bg-[#022f42] text-white p-10 rounded-sm text-center shadow-inner relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-[#ffd800]"></div>
                 <h3 className="text-[#ffd800] font-black uppercase tracking-[0.3em] text-[10px] mb-4">Projected Exit Velocity</h3>
                 <div className="text-7xl font-black mb-2">{runway === 99 ? 'DEFAULT ALIVE' : `${runway} MO`}</div>
                 <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2">{runway === 99 ? 'Revenue ≥ Burn (Profitable)' : `Cash depletion at standard burn levels.`}</p>
              </div>

              <div className="flex justify-center mt-12">
                <button 
                  onClick={handleSaveAndContinue} 
                  disabled={isSaving}
                  className={`px-12 py-5 font-black uppercase tracking-widest transition-all rounded-sm flex items-center gap-2 shadow-2xl ${savedSuccess ? 'bg-emerald-500 text-white' : 'bg-[#ffd800] hover:bg-[#022f42] hover:text-[#ffd800] text-[#022f42]'}`}
                >
                  {isSaving ? (
                     <div className="w-5 h-5 border-2 border-[#022f42] border-t-transparent rounded-full animate-spin"></div>
                  ) : savedSuccess ? (
                    <><CheckCircle2 className="w-5 h-5" /> Data Synchronized</>
                  ) : (
                    <>Commit Financials & Lock Hub <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              className={`font-black text-[10px] tracking-widest uppercase flex items-center gap-2 transition-colors ${step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-[#1e4a62] hover:text-[#022f42]'}`}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4"/> Back
            </button>
            {step < 4 && (
              <button
                onClick={handleNextStep}
                disabled={step === 2 && activeIds.some(id => !metrics[id] && METRIC_LIBRARY.find(m => m.id === id)?.req)}
                className={`px-8 py-3 font-black text-[10px] tracking-widest uppercase rounded-sm transition-all flex items-center gap-2 shadow-md ${
                  (step === 2 && activeIds.some(id => !metrics[id] && METRIC_LIBRARY.find(m => m.id === id)?.req)) 
                    ? "bg-gray-100 text-gray-400 grayscale cursor-not-allowed" 
                    : "bg-[#022f42] text-white hover:bg-[#1b4f68]"
                }`}
              >
                {step === 2 ? "Review Trajectory" : "Next Step"} <ArrowRight className="w-4 h-4"/>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 space-y-6">
          <AIAssistedInsight 
            content={
              step === 1 ? "Minimum Viable Telemetry: We require MRR, Burn, and Cash for any fundability modeling." : 
              step === 2 ? "Precision Warning: Investor confidence drops significantly if actual metrics deviate >15% from self-reported entry during DD." :
              step === 3 ? (runway < 6 ? "Critical Fatigue: Under 6 months of runway triggers automated gap analysis for 'Business Continuity' risk." : "Stable Orbit: Runway is within the 12-18 month target for Seed/Series A expansion.") :
              "The What-If simulator allows you to identify where a 10% burn reduction offsets a 20% revenue miss."
            }
          />

          <div className="bg-[#f2f6fa] p-8 border border-[#e5e9f0] rounded-sm">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#022f42]/40 mb-3">Live Runway Delta</h4>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black text-[#022f42]">{runway === 99 ? '∞' : runway}</div>
              <div className="text-[10px] font-bold text-[#022f42]/60 uppercase tracking-widest">MONTHS</div>
            </div>
            <div className={`mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden`}>
              <div className={`h-full transition-all duration-1000 ${runway >= 12 ? 'bg-emerald-500' : runway >= 6 ? 'bg-[#ffd800]' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, (runway/24)*100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
