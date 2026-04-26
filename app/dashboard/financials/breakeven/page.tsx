/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { AIAssistedInsight } from "@/components/AIAssistedInsight";
import { ModuleHeader } from "@/components/ModuleHeader";
import { 
  ArrowRight, ArrowLeft,
  Calculator
} from "lucide-react";
import Link from "next/link";
import { 
  AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useUser } from "@/lib/hooks/useUser";
import { createClient } from "@/lib/supabase/client";

export default function BreakevenPage() {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const supabase = createClient();

  // Data State
  const [data, setData] = useState({
    fixedCosts: 0,
    variableCostPercent: 0,
    interestExpense: 0
  });

  const [aiFlags, setAiFlags] = useState({ step1: "", step2: "", step3: "" });

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
        if (snap.breakeven) setData(snap.breakeven);
      }
      setIsLoaded(true);
    }
    loadData();
  }, [user, supabase]);

  // Calculations
  const totalFixed = data.fixedCosts + data.interestExpense;
  const contributionMargin = 1 - (data.variableCostPercent / 100);
  const breakevenRevenue = contributionMargin > 0 ? Math.round(totalFixed / contributionMargin) : 0;

  const chartData = [
    { name: '$0', rev: 0, cost: totalFixed },
    { name: 'BE', rev: breakevenRevenue, cost: totalFixed + (breakevenRevenue * (data.variableCostPercent / 100)) },
    { name: 'Target', rev: breakevenRevenue * 2, cost: totalFixed + (breakevenRevenue * 2 * (data.variableCostPercent / 100)) },
  ];

  // AI Feedback Updates
  useEffect(() => {
    if (data.variableCostPercent > 60) setAiFlags(p => ({...p, step2: "Caution: High variable costs detected. Your breakeven threshold is radically sensitive to even small volume drops."}));
    else if (data.variableCostPercent < 30) setAiFlags(p => ({...p, step2: "Strong: Low variable costs imply massive operating leverage once you clear fixed overheads."}));
    else setAiFlags(p => ({...p, step2: ""}));
  }, [data]);

  const handleNextStep = () => setStep(Math.min(3, step + 1));

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      if (!user?.id) return;

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
        breakeven: data,
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
        badge="2.1.2"
        title="Survival Revenue Calculator"
        description="Determine the exact revenue needed to cover cash fixed and variable costs – the point where you stop burning cash."
      />

      {/* Progress Bar */}
      <div className="bg-white shadow-sm border border-gray-100 p-4 mb-6 rounded-sm flex items-center justify-between">
        <div className="flex gap-1 md:gap-2">
          {[1,2,3].map(i => (
            <div 
              key={i} 
              className={`h-2 w-20 md:w-32 rounded-full transition-all ${step >= i ? 'bg-[#ffd800]' : 'bg-gray-200'}`} 
            />
          ))}
        </div>
        <span className="text-sm font-bold text-[#022f42] uppercase tracking-widest ml-4">Step {step} of 3</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          
          {/* STEP 1: Fixed Costs */}
          {step === 1 && (
            <div className="bg-white p-8 md:p-10 shadow-lg border-t-[4px] border-[#022f42] rounded-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-[#022f42] mb-8 text-center">Cash Fixed Costs</h2>
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-sm">
                  <label className="text-xs font-black uppercase text-gray-400 mb-2 block">Monthly Operating Fixed Costs ($)</label>
                  <input type="number" value={data.fixedCosts} onChange={e=>setData({...data, fixedCosts: parseInt(e.target.value) || 0})} placeholder="30000" className="w-full p-4 border border-gray-100 rounded-sm outline-none focus:border-[#ffd800] font-mono font-bold text-2xl text-[#022f42]" />
                </div>
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-sm">
                  <label className="text-xs font-black uppercase text-gray-400 mb-2 block">Monthly Interest / Debt Service ($)</label>
                  <input type="number" value={data.interestExpense} onChange={e=>setData({...data, interestExpense: parseInt(e.target.value) || 0})} placeholder="0" className="w-full p-4 border border-gray-100 rounded-sm outline-none focus:border-[#ffd800] font-mono font-bold text-2xl text-[#022f42]" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Variable Costs */}
          {step === 2 && (
            <div className="bg-white p-8 md:p-10 shadow-lg border-t-[4px] border-[#022f42] rounded-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-[#022f42] mb-8 text-center">Variable Allocation</h2>
              <div className="p-8 bg-[#022f42] text-white rounded-sm text-center">
                 <h3 className="text-[#ffd800] font-black uppercase tracking-[0.2em] text-xs mb-6">Variable Cost Percentage (%)</h3>
                 <div className="text-6xl font-black mb-8">{data.variableCostPercent}%</div>
                 <input type="range" min="0" max="95" step="5" value={data.variableCostPercent} onChange={e=>setData({...data, variableCostPercent: parseInt(e.target.value)})} className="w-full accent-[#ffd800]" />
                 <div className="flex justify-between mt-4 text-[10px] font-black uppercase text-gray-400">
                    <span>0% (Hyper Scale)</span>
                    <span>95% (Reseller / Low Moat)</span>
                 </div>
                 {aiFlags.step2 && <div className="mt-8 p-4 bg-white/10 rounded-sm text-sm font-medium border border-white/10 animate-in fade-in duration-700">{aiFlags.step2}</div>}
              </div>
            </div>
          )}

          {/* STEP 3: Breakeven Analysis */}
          {step === 3 && (
            <div className="bg-white p-8 md:p-10 shadow-lg border-t-[4px] border-[#ffd800] rounded-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-[#022f42] mb-10 text-center text-[#ffd800]">The Breakeven Threshold</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                 <div className="bg-black text-white p-8 rounded-sm text-center flex flex-col justify-center">
                    <h4 className="text-[10px] uppercase font-black text-gray-500 mb-2">Monthly Breakeven Revenue</h4>
                    <div className="text-4xl font-black text-[#ffd800]">${breakevenRevenue.toLocaleString()}</div>
                    <p className="text-xs mt-4 text-gray-400 leading-relaxed font-medium">To clear ${totalFixed.toLocaleString()} in fixed overhead at a {(100-data.variableCostPercent)}% margin efficiency.</p>
                 </div>
                 <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <Area type="monotone" dataKey="rev" stroke="#ffd800" fill="#fffbeb" strokeWidth={3} />
                        <Area type="monotone" dataKey="cost" stroke="#022f42" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                        <Tooltip content={<></>} />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="flex justify-center mt-6">
                <button 
                  onClick={handleSaveAndContinue} 
                  disabled={isSaving}
                  className={`px-12 py-5 font-black uppercase tracking-widest transition-all rounded-sm flex items-center gap-2 shadow-lg ${savedSuccess ? 'bg-green-500 text-white' : 'bg-[#ffd800] hover:bg-[#ffe24d] text-[#022f42]'}`}
                >
                  {isSaving ? (
                     <div className="w-5 h-5 border-2 border-[#022f42] border-t-transparent rounded-full animate-spin"></div>
                  ) : savedSuccess ? 'Threshold Committed' : 'Finalize Breakeven Analysis'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              className={`font-bold text-sm tracking-widest uppercase flex items-center gap-2 transition-colors ${step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-[#1e4a62] hover:text-[#022f42]'}`}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4"/> Back
            </button>
            {step < 3 && (
              <button
                onClick={handleNextStep}
                className="bg-[#022f42] text-white px-8 py-3 font-bold text-sm tracking-widest uppercase rounded-sm hover:bg-[#1b4f68] transition-colors flex items-center gap-2 shadow-md"
              >
                Next Step <ArrowRight className="w-4 h-4"/>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="w-full lg:w-80 space-y-6">
          <AIAssistedInsight 
            content={
              step === 1 ? "Fixed costs act like a hurdle. The higher the hurdle, the more momentum (revenue) you need just to stop depleting cash." : 
              step === 2 ? "Contribution margin (1 - Variable%) is the efficiency which converts revenue into fixed cost coverage." :
              "A lower breakeven point increases your 'Default Alive' probability, which is a massive leverage point in VC negotiations."
            }
          />

          <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-sm text-center">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Target Revenue Efficiency</h4>
            <div className="text-2xl font-black text-emerald-500">{(100 - data.variableCostPercent)}%</div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Contribution Margin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
