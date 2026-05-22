"use client";

import { useState, useEffect } from "react";
import { DollarSign, ArrowLeft, BookOpen, ChevronRight, CheckCircle2, AlertTriangle, PlayCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface InvestorAnalysis {
  overallSignal: "strong" | "moderate" | "weak";
  investorTake: string;
  strengths: string[];
  redFlags: string[];
  nextAction: string;
  score: number;
}

export default function FinancialSnapshotPage() {
  const supabase = createClient();
  
  // Input fields
  const [revenue, setRevenue] = useState<string>("");
  const [burn, setBurn] = useState<string>("");
  const [cash, setCash] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [analysis, setAnalysis] = useState<InvestorAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 1. Fetch existing answers on mount
  useEffect(() => {
    async function loadExisting() {
      setIsInitialLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsInitialLoading(false);
          return;
        }

        const { data } = await supabase
          .from("audit_responses")
          .select("*")
          .eq("user_id", user.id)
          .eq("module_id", "9-financial-snapshot")
          .single();

        if (data && data.open_text) {
          const parsed = JSON.parse(data.open_text);
          const restoredAnswers = parsed.answers || [];
          const restoredAnalysis = parsed.analysis || null;

          // Find the values from structured answers
          const revAns = restoredAnswers.find((a: any) => a.questionTitle.includes("Revenue") || a.questionTitle.includes("MRR"));
          const burnAns = restoredAnswers.find((a: any) => a.questionTitle.includes("Burn"));
          const cashAns = restoredAnswers.find((a: any) => a.questionTitle.includes("Cash"));
          const notesAns = restoredAnswers.find((a: any) => a.questionTitle.includes("Qualitative"));

          if (revAns) setRevenue(revAns.openText || revAns.selectedOptionLabel.replace("$", ""));
          if (burnAns) setBurn(burnAns.openText || burnAns.selectedOptionLabel.replace("$", ""));
          if (cashAns) setCash(cashAns.openText || cashAns.selectedOptionLabel.replace("$", ""));
          if (notesAns) setNotes(notesAns.openText || "");

          if (restoredAnalysis) {
            setAnalysis(restoredAnalysis);
            setSaveStatus("success");
          }
        }
      } catch (err) {
        console.error("Error loading financial snapshot:", err);
      } finally {
        setIsInitialLoading(false);
      }
    }

    loadExisting();
  }, [supabase]);

  // Runway calculation
  const revNum = parseFloat(revenue) || 0;
  const burnNum = parseFloat(burn) || 0;
  const cashNum = parseFloat(cash) || 0;

  // Runway is cash / monthly burn
  let runwayMonths: number | null = null;
  if (burnNum > 0) {
    runwayMonths = Math.round((cashNum / burnNum) * 10) / 10;
  } else if (cashNum > 0 && burnNum === 0) {
    runwayMonths = 99; // Infinite/pre-funding safety
  }

  // Get alert criteria
  const getRunwayAlert = (months: number | null) => {
    if (months === null) return { text: "Pending Calculation", color: "text-[#022f42]/40 bg-gray-100 border-gray-200" };
    if (months >= 18) return { text: "Healthy Runway", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (months >= 6) return { text: "Moderate Runway", color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
    return { text: "Critical Runway", color: "text-red-700 bg-red-50 border-red-200" };
  };

  const alertCriteria = getRunwayAlert(runwayMonths);

  const handleSubmit = async () => {
    if (!revenue || !burn || !cash) return;
    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveStatus("success");
        setIsSaving(false);
        return;
      }

      // Map to standard CompletedAnswer schema so it integrates with /api/assessment/analyze
      const completedAnswers = [
        {
          questionTitle: "Monthly Recurring Revenue (MRR)",
          selectedOptionId: "opt-mrr",
          selectedOptionLabel: `$${revNum.toLocaleString()}`,
          openText: revenue,
          scoreValue: revNum > 10000 ? 90 : revNum > 1000 ? 65 : 35
        },
        {
          questionTitle: "Monthly Burn Rate",
          selectedOptionId: "opt-burn",
          selectedOptionLabel: `$${burnNum.toLocaleString()}`,
          openText: burn,
          scoreValue: burnNum < 5000 ? 90 : burnNum < 15000 ? 65 : 35
        },
        {
          questionTitle: "Current Cash Balance",
          selectedOptionId: "opt-cash",
          selectedOptionLabel: `$${cashNum.toLocaleString()}`,
          openText: cash,
          scoreValue: cashNum > 50000 ? 90 : cashNum > 10000 ? 65 : 35
        },
        {
          questionTitle: "Calculated Cash Runway",
          selectedOptionId: "opt-runway",
          selectedOptionLabel: runwayMonths ? `${runwayMonths} months` : "0 months",
          openText: runwayMonths?.toString() || "0",
          scoreValue: runwayMonths && runwayMonths >= 18 ? 95 : runwayMonths && runwayMonths >= 6 ? 65 : 15
        },
        {
          questionTitle: "Qualitative Financial Context",
          selectedOptionId: "opt-notes",
          selectedOptionLabel: notes || "No additional context supplied",
          openText: notes,
          scoreValue: 80
        }
      ];

      const averageScore = Math.round(completedAnswers.reduce((sum, a) => sum + a.scoreValue, 0) / completedAnswers.length);

      // Save initial answers
      const { error: saveErr } = await supabase
        .from("audit_responses")
        .upsert({
          user_id: user.id,
          module_id: "9-financial-snapshot",
          selected_option: "DYNAMIC_CHAIN",
          open_text: JSON.stringify({ answers: completedAnswers }),
          score_value: averageScore,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id,module_id" });

      if (saveErr) throw saveErr;

      // Call analysis endpoint
      setIsAnalyzing(true);
      const res = await fetch("/api/assessment/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleContext: "Financial Snapshot – assessing startup cash flow metrics, burn rate, and runway efficiency.",
          answers: completedAnswers
        })
      });

      if (res.ok) {
        const data = await res.json() as InvestorAnalysis;
        setAnalysis(data);

        // Update database row with full answers and analysis
        await supabase
          .from("audit_responses")
          .upsert({
            user_id: user.id,
            module_id: "9-financial-snapshot",
            selected_option: "DYNAMIC_CHAIN",
            open_text: JSON.stringify({ answers: completedAnswers, analysis: data }),
            score_value: data.score || averageScore,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id,module_id" });
        
        setSaveStatus("success");
      } else {
        throw new Error("Analysis failed");
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
      setIsAnalyzing(false);
    }
  };

  const handleRetake = () => {
    setAnalysis(null);
    setSaveStatus("idle");
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#ffd800]" />
        <p className="text-xs font-black uppercase tracking-widest text-[#022f42]/40">Loading Financial Vitals...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 hover:text-[#022f42] transition-colors mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Audit Hub
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#022f42] text-[#ffd800] flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-[#022f42] uppercase tracking-tighter">
            1.1.9 Financial Snapshot
          </h1>
        </div>
        <p className="text-sm text-[#1e4a62] font-medium leading-relaxed max-w-2xl">
          Bilingual: Isikan data kewangan syarikat anda. Sila nyatakan nilai dalam USD.
          <br />
          <span className="text-[#022f42]/60">Enter your startup&apos;s financial health indicators. Please specify all values in USD.</span>
        </p>
      </div>

      {saveStatus === "success" && analysis ? (
        /* ─── ANALYSIS RENDER STATE ────────────────────────────────────────── */
        <div className="space-y-8 animate-in fade-in duration-500">
          
          <div className="bg-[#022f42] text-white p-8 border-b-[8px] border-[#ffd800] shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <span className="px-3 py-1 bg-white/10 text-[#ffd800] text-[9px] font-black uppercase tracking-widest rounded-sm">
                  Investor Signal Take
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tight mt-3">VC Intelligence Verdict</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-black text-[#ffd800]">{analysis.score}<span className="text-xs opacity-40">/100</span></div>
                  <div className="text-[8px] font-black text-white/50 uppercase tracking-widest">Gate Score</div>
                </div>
                <span className={`px-4 py-2 font-black text-xs uppercase tracking-widest border ${
                  analysis.overallSignal === "strong" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                  analysis.overallSignal === "moderate" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
                  "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                  {analysis.overallSignal} Signal
                </span>
              </div>
            </div>

            <p className="text-sm text-[#b0d0e0] leading-relaxed italic mb-8 font-medium">
              &quot;{analysis.investorTake}&quot;
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10 pt-8">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ffd800] mb-4">Core Strengths</h4>
                <ul className="space-y-3">
                  {analysis.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-white/80 leading-relaxed font-medium">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] mb-4">Audit Concerns</h4>
                <ul className="space-y-3">
                  {analysis.redFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-white/80 leading-relaxed font-medium">
                      <AlertTriangle size={14} className="text-[#ef4444] shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Critical Next Action</div>
                <p className="text-xs font-bold text-[#ffd800] mt-1">{analysis.nextAction}</p>
              </div>
              <button
                onClick={handleRetake}
                className="px-6 py-2.5 border-2 border-white/10 text-xs font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] hover:border-transparent transition-all"
              >
                Update Metrics
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── INPUT/CALCULATOR FORM ─────────────────────────────────────────── */
        <div className="bg-white border-2 border-[#022f42]/5 shadow-sm p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Monthly Revenue Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42] block">
                Monthly Revenue / MRR ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-[#022f42]/40" />
                <input
                  type="number"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full pl-9 pr-4 py-2.5 border-2 border-[#022f42]/10 focus:border-[#ffd800] outline-none text-xs font-mono font-bold"
                />
              </div>
              <p className="text-[9px] text-[#022f42]/40 font-bold uppercase">Pendapatan Bulanan Syarikat</p>
            </div>

            {/* Monthly Burn Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42] block">
                Monthly Burn Rate ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-[#022f42]/40" />
                <input
                  type="number"
                  value={burn}
                  onChange={(e) => setBurn(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full pl-9 pr-4 py-2.5 border-2 border-[#022f42]/10 focus:border-[#ffd800] outline-none text-xs font-mono font-bold"
                />
              </div>
              <p className="text-[9px] text-[#022f42]/40 font-bold uppercase">Kadar Pembakaran Tunai Bulanan</p>
            </div>

            {/* Cash Balance Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42] block">
                Current Cash Balance ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-[#022f42]/40" />
                <input
                  type="number"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder="e.g. 80000"
                  className="w-full pl-9 pr-4 py-2.5 border-2 border-[#022f42]/10 focus:border-[#ffd800] outline-none text-xs font-mono font-bold"
                />
              </div>
              <p className="text-[9px] text-[#022f42]/40 font-bold uppercase">Baki Tunai Semasa</p>
            </div>

          </div>

          {/* Qualitative context notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42] block">
              Qualitative Notes / Context
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide context on pricing power, capital efficiency, upcoming revenue pipelines, or bootstrap status."
              className="w-full p-4 border-2 border-[#022f42]/10 focus:border-[#ffd800] outline-none text-xs font-medium min-h-[100px]"
            />
            <p className="text-[9px] text-[#022f42]/40 font-bold uppercase">Nota ringkas berkenaan kecekapan kewangan atau LOI pelanggan.</p>
          </div>

          {/* Dynamic Runway Output Visualizer */}
          <div className={`p-6 border-2 flex items-center justify-between flex-wrap gap-4 ${alertCriteria.color} transition-all`}>
            <div className="space-y-1">
              <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/60">Calculated Cash Runway</div>
              <div className="text-3xl font-black font-mono">
                {runwayMonths !== null ? `${runwayMonths} Months` : "—"}
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 font-black text-[9px] uppercase tracking-widest rounded-full ${
                runwayMonths !== null && runwayMonths >= 18 ? "bg-emerald-500/20 text-emerald-800" :
                runwayMonths !== null && runwayMonths >= 6 ? "bg-yellow-500/20 text-yellow-800" :
                "bg-red-500/20 text-red-800"
              }`}>
                {alertCriteria.text}
              </span>
              <p className="text-[8px] font-bold text-[#022f42]/40 uppercase mt-2">Months = Cash Balance / Monthly Burn</p>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#022f42]/5">
            <button
              disabled={isSaving || isAnalyzing || !revenue || !burn || !cash}
              onClick={handleSubmit}
              className="btn bg-[#022f42] disabled:opacity-40 text-[#ffd800] px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-all flex items-center gap-2"
            >
              {isSaving || isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Running AI Analysis...
                </>
              ) : (
                <>
                  <PlayCircle size={14} />
                  Save & Analyze Metrics
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* Supporting Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="bg-[#022f42] p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={60} />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ffd800] mb-4">Investor Lens</h4>
          <p className="text-xs leading-relaxed text-[#b0d0e0] font-medium uppercase tracking-tight">
            Investors evaluate cash runway to gauge bankruptcy risk. A runway under 6 months signals high risk, while a runway above 18 months represents institutional-grade stability.
          </p>
        </div>
        <div className="bg-white border-2 border-[#022f42]/5 p-8 flex flex-col justify-between group cursor-pointer hover:border-[#022f42]/20 transition-all">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-5 h-5 text-[#022f42]" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Academy Resource</h4>
            </div>
            <p className="text-sm font-bold text-[#022f42] mb-2 group-hover:text-[#ffd800] transition-colors">
              Building a Financial Snapshot
            </p>
            <p className="text-[11px] text-[#1e4a62]/60 font-medium">
              Learn how to present revenue, burn, and runway in a VC‑ready format.
            </p>
          </div>
          <Link href="/academy" className="mt-6 text-[9px] font-black uppercase tracking-widest text-[#022f42] flex items-center gap-2">
            View Guide <ChevronRight className="w-3 h-3 text-[#022f42]" />
          </Link>
        </div>
      </div>

    </div>
  );
}
