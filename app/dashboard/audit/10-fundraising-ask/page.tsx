"use client";

import { useState, useEffect } from "react";
import { PieChart, ArrowLeft, BookOpen, ChevronRight, CheckCircle2, AlertTriangle, PlayCircle, Loader2 } from "lucide-react";
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

export default function FundraisingAskPage() {
  const supabase = createClient();

  // Input states
  const [raiseAmount, setRaiseAmount] = useState<string>("");
  const [targetRound, setTargetRound] = useState<string>("seed");
  const [pctTech, setPctTech] = useState<number>(40);
  const [pctMarketing, setPctMarketing] = useState<number>(40);
  const [pctOps, setPctOps] = useState<number>(20);
  const [closeDate, setCloseDate] = useState<string>("");
  const [qualitativeMilestones, setQualitativeMilestones] = useState<string>("");

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
          .eq("module_id", "10-fundraising-ask")
          .single();

        if (data && data.open_text) {
          const parsed = JSON.parse(data.open_text);
          const restoredAnswers = parsed.answers || [];
          const restoredAnalysis = parsed.analysis || null;

          const raiseAns = restoredAnswers.find((a: any) => a.questionTitle.includes("Raise"));
          const roundAns = restoredAnswers.find((a: any) => a.questionTitle.includes("Round"));
          const closeAns = restoredAnswers.find((a: any) => a.questionTitle.includes("Close"));
          const allocationAns = restoredAnswers.find((a: any) => a.questionTitle.includes("Allocation"));
          const milestonesAns = restoredAnswers.find((a: any) => a.questionTitle.includes("Milestone") || a.questionTitle.includes("Qualitative"));

          if (raiseAns) setRaiseAmount(raiseAns.openText || raiseAns.selectedOptionLabel.replace("$", ""));
          if (roundAns) setTargetRound(roundAns.openText || "seed");
          if (closeAns) setCloseDate(closeAns.openText || "");
          if (milestonesAns) setQualitativeMilestones(milestonesAns.openText || "");

          if (allocationAns && allocationAns.openText) {
            try {
              const parsedPct = JSON.parse(allocationAns.openText);
              setPctTech(parsedPct.pctTech ?? 40);
              setPctMarketing(parsedPct.pctMarketing ?? 40);
              setPctOps(parsedPct.pctOps ?? 20);
            } catch (e) {
              console.warn("Could not parse allocation percentages:", e);
            }
          }

          if (restoredAnalysis) {
            setAnalysis(restoredAnalysis);
            setSaveStatus("success");
          }
        }
      } catch (err) {
        console.error("Error loading fundraising details:", err);
      } finally {
        setIsInitialLoading(false);
      }
    }

    loadExisting();
  }, [supabase]);

  // Numerical calculations
  const raiseNum = parseFloat(raiseAmount) || 0;
  const totalAllocation = pctTech + pctMarketing + pctOps;

  // Real-time currency allocation
  const techDollars = Math.round((pctTech / 100) * raiseNum);
  const marketingDollars = Math.round((pctMarketing / 100) * raiseNum);
  const opsDollars = Math.round((pctOps / 100) * raiseNum);

  const isAllocationValid = totalAllocation === 100;

  const handleSubmit = async () => {
    if (!raiseAmount || !isAllocationValid) return;
    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveStatus("success");
        setIsSaving(false);
        return;
      }

      // Format answers into the standardized CompletedAnswer structure
      const completedAnswers = [
        {
          questionTitle: "Target Raise Amount",
          selectedOptionId: "opt-raise",
          selectedOptionLabel: `$${raiseNum.toLocaleString()}`,
          openText: raiseAmount,
          scoreValue: raiseNum > 0 ? 90 : 20
        },
        {
          questionTitle: "Target Investment Round",
          selectedOptionId: "opt-round",
          selectedOptionLabel: targetRound.toUpperCase(),
          openText: targetRound,
          scoreValue: 80
        },
        {
          questionTitle: "Target Closing Date",
          selectedOptionId: "opt-closedate",
          selectedOptionLabel: closeDate || "Not specified",
          openText: closeDate,
          scoreValue: closeDate ? 90 : 60
        },
        {
          questionTitle: "Use of Funds Allocation",
          selectedOptionId: "opt-allocation",
          selectedOptionLabel: `Product & R&D: ${pctTech}%, Sales & Marketing: ${pctMarketing}%, Ops & Admin: ${pctOps}%`,
          openText: JSON.stringify({ pctTech, pctMarketing, pctOps }),
          scoreValue: 90
        },
        {
          questionTitle: "Qualitative Milestones",
          selectedOptionId: "opt-milestones",
          selectedOptionLabel: qualitativeMilestones || "No qualitative milestone data provided.",
          openText: qualitativeMilestones,
          scoreValue: 80
        }
      ];

      const averageScore = Math.round(completedAnswers.reduce((sum, a) => sum + a.scoreValue, 0) / completedAnswers.length);

      // Save answers initially
      const { error: saveErr } = await supabase
        .from("audit_responses")
        .upsert({
          user_id: user.id,
          module_id: "10-fundraising-ask",
          selected_option: "DYNAMIC_CHAIN",
          open_text: JSON.stringify({ answers: completedAnswers }),
          score_value: averageScore,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id,module_id" });

      if (saveErr) throw saveErr;

      // Invoke standard VC analytics analysis
      setIsAnalyzing(true);
      const res = await fetch("/api/assessment/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleContext: "Fundraising Ask – checking targeted capital requirements, use-of-funds roadmap, and timeline maturity.",
          answers: completedAnswers
        })
      });

      if (res.ok) {
        const data = await res.json() as InvestorAnalysis;
        setAnalysis(data);

        // Update database with fully formulated AI analysis
        await supabase
          .from("audit_responses")
          .upsert({
            user_id: user.id,
            module_id: "10-fundraising-ask",
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
        <p className="text-xs font-black uppercase tracking-widest text-[#022f42]/40">Loading Fundraising Ask...</p>
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
            <PieChart className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-[#022f42] uppercase tracking-tighter">
            1.1.10 Fundraising Ask
          </h1>
        </div>
        <p className="text-sm text-[#1e4a62] font-medium leading-relaxed max-w-2xl">
          Bilingual: Nyatakan sasaran pusingan dana, pembahagian dana dan tarikh tutup sasaran anda.
          <br />
          <span className="text-[#022f42]/60">Define your targeted investment ask, allocation models, and estimated closing parameters.</span>
        </p>
      </div>

      {saveStatus === "success" && analysis ? (
        /* ─── ANALYSIS RESULT STATE ────────────────────────────────────────── */
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
        /* ─── SLIDER / INPUT CALCULATOR FORM ────────────────────────────────── */
        <div className="bg-white border-2 border-[#022f42]/5 shadow-sm p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Target Raise */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42] block">
                Target Raise Amount ($)
              </label>
              <input
                type="number"
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full px-4 py-2.5 border-2 border-[#022f42]/10 focus:border-[#ffd800] outline-none text-xs font-mono font-bold"
              />
              <p className="text-[9px] text-[#022f42]/40 font-bold uppercase">Jumlah Sasaran Dana</p>
            </div>

            {/* Target Round */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42] block">
                Target Investment Round
              </label>
              <select
                value={targetRound}
                onChange={(e) => setTargetRound(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-[#022f42]/10 focus:border-[#ffd800] outline-none text-xs font-bold"
              >
                <option value="pre-seed">Pre-Seed</option>
                <option value="seed">Seed Round</option>
                <option value="pre-series-a">Pre-Series A</option>
                <option value="series-a">Series A</option>
              </select>
              <p className="text-[9px] text-[#022f42]/40 font-bold uppercase">Peringkat Pusingan Pelaburan</p>
            </div>

            {/* Target Close Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42] block">
                Target Close Date (Optional)
              </label>
              <input
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-[#022f42]/10 focus:border-[#ffd800] outline-none text-xs font-bold"
              />
              <p className="text-[9px] text-[#022f42]/40 font-bold uppercase">Tarikh Sasaran Tutup</p>
            </div>

          </div>

          {/* Use of Funds Allocation Sliders */}
          <div className="space-y-6 pt-4 border-t border-[#022f42]/5">
            <h3 className="text-xs font-black text-[#022f42] uppercase tracking-widest">
              Use of Funds Percentage Breakdown (Saling Bergantungan)
            </h3>

            <div className="space-y-6 bg-gray-50/50 p-6 border-2 border-[#022f42]/5 rounded-sm">
              
              {/* Product & R&D */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#022f42]/70 uppercase tracking-tight">Product & R&D</span>
                  <span className="font-mono font-bold text-[#022f42]">
                    {pctTech}% ({raiseNum > 0 ? `$${techDollars.toLocaleString()}` : "—"})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pctTech}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setPctTech(val);
                  }}
                  className="w-full accent-[#022f42]"
                />
              </div>

              {/* Sales & Marketing */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#022f42]/70 uppercase tracking-tight">Sales, Marketing & GTM</span>
                  <span className="font-mono font-bold text-[#022f42]">
                    {pctMarketing}% ({raiseNum > 0 ? `$${marketingDollars.toLocaleString()}` : "—"})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pctMarketing}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setPctMarketing(val);
                  }}
                  className="w-full accent-[#022f42]"
                />
              </div>

              {/* Ops & Admin */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#022f42]/70 uppercase tracking-tight">Operations & General Admin</span>
                  <span className="font-mono font-bold text-[#022f42]">
                    {pctOps}% ({raiseNum > 0 ? `$${opsDollars.toLocaleString()}` : "—"})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pctOps}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setPctOps(val);
                  }}
                  className="w-full accent-[#022f42]"
                />
              </div>

              {/* Slider Verification Indicator */}
              <div className={`mt-4 p-3 flex items-center justify-between border-2 text-[10px] font-black uppercase tracking-widest ${
                isAllocationValid ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
              }`}>
                <span>Total Allocation: {totalAllocation}%</span>
                <span>
                  {isAllocationValid ? "✓ Balanced exactly at 100%" : "✗ Must equal exactly 100% / Jumlah peruntukan mestilah genap 100%"}
                </span>
              </div>

            </div>
          </div>

          {/* Qualitative Context Area */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42] block">
              Execution Milestones (Qualitative Description)
            </label>
            <textarea
              value={qualitativeMilestones}
              onChange={(e) => setQualitativeMilestones(e.target.value)}
              placeholder="List 2-3 specific milestones this raise will fund over the next 12-18 months (e.g., scale MRR to $50k, secure SOC2 certification, hire Head of Engineering)."
              className="w-full p-4 border-2 border-[#022f42]/10 focus:border-[#ffd800] outline-none text-xs font-medium min-h-[100px]"
            />
            <p className="text-[9px] text-[#022f42]/40 font-bold uppercase">Milestones Utama Pembangunan Perniagaan.</p>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#022f42]/5">
            <button
              disabled={isSaving || isAnalyzing || !raiseAmount || !isAllocationValid}
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
                  Save & Analyze Ask
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
            <PieChart size={60} />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ffd800] mb-4">Investor Lens</h4>
          <p className="text-xs leading-relaxed text-[#b0d0e0] font-medium uppercase tracking-tight">
            Investors evaluate whether your use of funds is realistic. Allocating too much to administrative overhead is a red flag. Aim for at least 70% combined across Product R&D and Marketing/Growth!
          </p>
        </div>
        <div className="bg-white border-2 border-[#022f42]/5 p-8 flex flex-col justify-between group cursor-pointer hover:border-[#022f42]/20 transition-all">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-5 h-5 text-[#022f42]" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Academy Resource</h4>
            </div>
            <p className="text-sm font-bold text-[#022f42] mb-2 group-hover:text-[#ffd800] transition-colors">
              Crafting a Compelling Fundraising Ask
            </p>
            <p className="text-[11px] text-[#1e4a62]/60 font-medium">
              Learn how to structure the raise amount, allocation, and timeline for VC‑ready pitches.
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
