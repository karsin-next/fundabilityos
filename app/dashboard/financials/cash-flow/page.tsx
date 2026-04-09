"use client";

import { useState, useEffect } from "react";
import { AIAssistedInsight } from "@/components/AIAssistedInsight";
import { ModuleHeader } from "@/components/ModuleHeader";
import { 
  ArrowRight, ArrowLeft,
  ArrowUpCircle, ArrowDownCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

export default function CashFlowPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const supabase = createClient();

  // Data State
  const [data, setData] = useState({
    receipts: 0,
    newFunding: 0,
    payroll: 0,
    marketing: 0,
    rent: 0,
    cogs: 0,
    otherOut: 0
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
        const snap = report.financial_snapshot as Record<string, number>;
        if (snap.cashFlow) setData(snap.cashFlow as any);
      }
      setIsLoaded(true);
    }
    loadData();
  }, [user, supabase]);

  // Calculations
  const totalIn = (data.receipts || 0) + (data.newFunding || 0);
  const totalOut = (data.payroll || 0) + (data.marketing || 0) + (data.rent || 0) + (data.cogs || 0) + (data.otherOut || 0);
  const netFlow = totalIn - totalOut;

  // AI Feedback Updates
  useEffect(() => {
    if (data.newFunding > 0 && data.receipts === 0) setAiFlags(p => ({...p, step1: "Caution: Your cash-in is 100% financing-led. Investors will want to see operational receipts (revenue) to validate product-market pull."}));
    else if (data.receipts > totalOut && totalOut > 0) setAiFlags(p => ({...p, step1: "Strong: You are generating positive operational cash flow. This provides massive leverage."}));
    else setAiFlags(p => ({...p, step1: ""}));

    if (totalOut > 0 && data.payroll > (totalOut * 0.70)) setAiFlags(p => ({...p, step2: "Heads up: Payroll accounts for 70%+ of your outflows. This is common for early tech but requires strict talent-density management."}));
    else setAiFlags(p => ({...p, step2: ""}));
  }, [data, totalOut]);

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
        cashFlow: data,
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
        badge="2.1.3"
        title="Cash Flow Snapshot"
        description="Manually enter monthly cash inflows and outflows to generate a simplified cash flow statement."
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
          
          {/* STEP 1: Cash In */}
          {step === 1 && (
            <div className="bg-white p-8 md:p-10 shadow-lg border-t-[4px] border-[#022f42] rounded-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-[#022f42] mb-8 text-center flex items-center justify-center gap-2">
                 <ArrowUpCircle className="w-6 h-6 text-emerald-500" /> Cash Inflows
              </h2>
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-sm">
                  <label className="text-xs font-black uppercase text-gray-400 mb-2 block">Customer Receipts ($)</label>
                  <input type="number" value={data.receipts} onChange={e=>setData({...data, receipts: parseInt(e.target.value) || 0})} placeholder="25000" className="w-full p-4 border border-gray-100 rounded-sm outline-none focus:border-[#ffd800] font-mono font-bold text-2xl text-[#022f42]" />
                </div>
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-sm">
                  <label className="text-xs font-black uppercase text-gray-400 mb-2 block">New Financing / Equity ($)</label>
                  <input type="number" value={data.newFunding} onChange={e=>setData({...data, newFunding: parseInt(e.target.value) || 0})} placeholder="0" className="w-full p-4 border border-gray-100 rounded-sm outline-none focus:border-[#ffd800] font-mono font-bold text-2xl text-[#022f42]" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Cash Out */}
          {step === 2 && (
            <div className="bg-white p-8 md:p-10 shadow-lg border-t-[4px] border-[#022f42] rounded-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-[#022f42] mb-8 text-center flex items-center justify-center gap-2">
                 <ArrowDownCircle className="w-6 h-6 text-rose-500" /> Cash Outflows
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-sm">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Payroll</label>
                  <input type="number" value={data.payroll} onChange={e=>setData({...data, payroll: parseInt(e.target.value) || 0})} className="w-full p-3 border border-gray-100 rounded-sm outline-none font-mono font-bold text-[#022f42]" />
                </div>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-sm">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Marketing</label>
                  <input type="number" value={data.marketing} onChange={e=>setData({...data, marketing: parseInt(e.target.value) || 0})} className="w-full p-3 border border-gray-100 rounded-sm outline-none font-mono font-bold text-[#022f42]" />
                </div>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-sm">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Rent / AWS / Fixed</label>
                  <input type="number" value={data.rent} onChange={e=>setData({...data, rent: parseInt(e.target.value) || 0})} className="w-full p-3 border border-gray-100 rounded-sm outline-none font-mono font-bold text-[#022f42]" />
                </div>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-sm">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">COGS / Variable</label>
                  <input type="number" value={data.cogs} onChange={e=>setData({...data, cogs: parseInt(e.target.value) || 0})} className="w-full p-3 border border-gray-100 rounded-sm outline-none font-mono font-bold text-[#022f42]" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Net Flow Summary */}
          {step === 3 && (
            <div className="bg-white p-10 shadow-lg border-t-[4px] border-[#ffd800] rounded-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-[#022f42] mb-10 text-center uppercase tracking-tight">Scenario &apos;What-If&apos; Stress Test</h2>
              
              <div className="flex flex-col items-center justify-center mb-12">
                 <div className={`p-10 rounded-full border-8 ${netFlow >= 0 ? 'border-emerald-500 bg-emerald-50' : 'border-rose-500 bg-rose-50'} transition-colors duration-500`}>
                    <div className={`text-5xl font-black ${netFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {netFlow >= 0 ? '+' : ''}${netFlow.toLocaleString()}
                    </div>
                 </div>
                 <p className={`mt-6 font-black uppercase tracking-widest text-sm ${netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {netFlow >= 0 ? 'DEFAULT ALIVE Zone' : 'BURN Zone'}
                 </p>
              </div>

              <div className="bg-[#022f42] text-white p-8 rounded-sm">
                 <div className="grid grid-cols-2 gap-8 text-center">
                    <div>
                       <h4 className="text-[10px] font-black uppercase text-gray-400 mb-1">Inflow Velocity</h4>
                       <div className="text-2xl font-black text-emerald-400">${totalIn.toLocaleString()}</div>
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black uppercase text-gray-400 mb-1">Outflow Intensity</h4>
                       <div className="text-2xl font-black text-rose-400">${totalOut.toLocaleString()}</div>
                    </div>
                 </div>
              </div>

              <div className="flex justify-center mt-12">
                <button 
                  onClick={handleSaveAndContinue} 
                  disabled={isSaving}
                  className={`px-12 py-5 font-black uppercase tracking-widest transition-all rounded-sm flex items-center gap-2 shadow-lg ${savedSuccess ? 'bg-green-500 text-white' : 'bg-[#ffd800] hover:bg-[#ffe24d] text-[#022f42]'}`}
                >
                  {isSaving ? (
                     <div className="w-5 h-5 border-2 border-[#022f42] border-t-transparent rounded-full animate-spin"></div>
                  ) : savedSuccess ? 'Delta Recorded' : 'Finalize Cash Flow Audit'}
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

        {/* Info Column */}
        <div className="w-full lg:w-80 space-y-6">
          <AIAssistedInsight 
            content={
              step === 1 ? "Inflows are the fuel of the venture engine. High-quality fuel comes from recurring customer receipts." : 
              step === 2 ? (aiFlags.step2 || "Payroll concentration is a proxy for organizational R&D or Sales intensity.") :
              "A positive net cash flow is the ultimate proof of unit-economic viability."
            }
          />

          <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-sm text-center">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Net Flow Intensity</h4>
            <div className={`text-2xl font-black ${netFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>${Math.abs(netFlow).toLocaleString()}</div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{netFlow >= 0 ? 'Surplus' : 'Deficit'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
