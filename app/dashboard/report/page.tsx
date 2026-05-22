"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { FileText, ArrowRight, ShieldCheck, Lock, Loader2, Sparkles, CheckCircle2, AlertCircle, FileDown, Eye } from "lucide-react";
import Link from "next/link";

interface ReportItem {
  id: string;
  score: number;
  band: string;
  created_at: string;
  is_unlocked: boolean;
}

export default function ReportDashboardPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [completedModules, setCompletedModules] = useState<Map<string, any>>(new Map());
  const [previousReports, setPreviousReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);

  // Load completed gates and previous reports
  async function loadData() {
    if (!user?.id) return;
    try {
      // 1. Fetch completed modules
      const { data: responses } = await supabase
        .from("audit_responses")
        .select("*")
        .eq("user_id", user.id);

      if (responses) {
        const moduleMap = new Map();
        responses.forEach((r: any) => {
          moduleMap.set(r.module_id, r);
        });
        setCompletedModules(moduleMap);
      }

      // 2. Fetch user reports
      const { data: reports } = await supabase
        .from("reports")
        .select("id, score, band, created_at, is_unlocked")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (reports) {
        setPreviousReports(reports as ReportItem[]);
      }
    } catch (err) {
      console.error("Error loading report hub data:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  // Core 8 modules list
  const coreModules = [
    { id: "1-problem", name: "1.1.1 Problem & Hypothesis" },
    { id: "2-customer", name: "1.1.2 Customer Persona" },
    { id: "3-competitor", name: "1.1.3 Competitor Analysis" },
    { id: "4-product", name: "1.1.4 Product Readiness" },
    { id: "5-market", name: "1.1.5 Market Opportunity" },
    { id: "6-pmf", name: "1.1.6 Product‑Market Fit" },
    { id: "7-revenue", name: "1.1.7 Revenue Model Explorer" },
    { id: "8-team", name: "1.1.8 Team Composition Audit" },
  ];

  // Additional modules
  const extraModules = [
    { id: "9-financial-snapshot", name: "1.1.9 Financial Snapshot" },
    { id: "10-fundraising-ask", name: "1.1.10 Fundraising Ask" },
  ];

  // Count core completed
  const coreCompletedCount = coreModules.filter(m => completedModules.has(m.id)).length;
  const isCoreComplete = coreCompletedCount === 8;

  // Handle report generation
  const handleGenerateReport = async () => {
    if (!isCoreComplete || !user) return;
    setIsGenerating(true);
    setGenStep(1);

    // Dynamic animation sequence for premium VC-audit look
    const steps = [
      "Aggregating due diligence metrics...",
      "Synthesizing dimension answers...",
      "Calibrating benchmark overrides...",
      "Generating strategic VC actions...",
      "Formulating investor audit report..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setGenStep(i + 1);
      await new Promise((res) => setTimeout(res, 1200));
    }

    try {
      // Aggregate answers for score route
      const aggregatedAnswers: Record<string, string> = {};
      
      // Merge all 10 modules if available
      [...coreModules, ...extraModules].forEach((mod) => {
        const response = completedModules.get(mod.id);
        if (response && response.open_text) {
          try {
            const parsed = JSON.parse(response.open_text);
            const ansList = parsed.answers || parsed;
            if (Array.isArray(ansList)) {
              aggregatedAnswers[mod.name] = ansList.map((a: any) => `${a.questionTitle}: ${a.selectedOptionLabel}`).join(" | ");
            }
          } catch (e) {
            aggregatedAnswers[mod.name] = response.selected_option || "Completed";
          }
        }
      });

      // Call score API to compute final report
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: aggregatedAnswers,
          userId: user.id,
          userEmail: user.email
        })
      });

      if (res.ok) {
        // Reload page data to reflect the new report
        await loadData();
      } else {
        throw new Error("Report generation endpoint failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error compiling report. Please check server logs.");
    } finally {
      setIsGenerating(false);
      setGenStep(0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#ffd800]" />
        <p className="text-xs font-black uppercase tracking-widest text-[#022f42]/40">Loading Report Hub...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div className="mb-8 border-b border-[#022f42]/10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#022f42] text-[#ffd800] flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-[#022f42] uppercase tracking-tighter">
            Investor-Ready Report Hub
          </h1>
        </div>
        <p className="text-sm text-[#1e4a62] font-medium leading-relaxed max-w-2xl">
          Bilingual: Penjanaan Laporan Fundability. Lengkapkan audit teras untuk menjana analisis VC.
          <br />
          <span className="text-[#022f42]/60">Generate and manage your startup&apos;s investor-readiness audit analysis. Complete the 8 core gates to unlock.</span>
        </p>
      </div>

      {isGenerating ? (
        /* ─── GENERATION LOADER ────────────────────────────────────────────── */
        <div className="bg-[#022f42] border-2 border-[#1b4f68] text-white p-12 text-center space-y-6 shadow-2xl animate-pulse">
          <Sparkles className="w-12 h-12 text-[#ffd800] animate-spin mx-auto" />
          <h3 className="text-lg font-black uppercase tracking-wider">Compiling Dynamic Audit Data</h3>
          
          <div className="max-w-xs mx-auto space-y-2">
            <div className="h-1.5 bg-white/10 w-full overflow-hidden relative">
              <div 
                className="h-full bg-[#ffd800] transition-all duration-1000 ease-out" 
                style={{ width: `${(genStep / 5) * 100}%` }}
              />
            </div>
            <p className="text-[10px] font-black text-[#ffd800] uppercase tracking-widest">
              {genStep === 1 && "Aggregating due diligence metrics..."}
              {genStep === 2 && "Synthesizing dimension answers..."}
              {genStep === 3 && "Calibrating benchmark overrides..."}
              {genStep === 4 && "Generating strategic VC actions..."}
              {genStep === 5 && "Formulating investor audit report..."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* ─── LEFT: COMPILER & CHECKLIST ─────────────────────────────────── */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Generate Report Card */}
            <div className="bg-white border-2 border-[#022f42]/5 p-8 space-y-6 shadow-sm">
              <h3 className="text-xs font-black text-[#022f42] uppercase tracking-widest">
                Compile New Fundability Audit
              </h3>
              
              <p className="text-xs text-[#1e4a62]/80 leading-relaxed font-medium">
                When you generate a new audit report, our VC scoring engine runs deep-dive analytics over your 10 completed modules, evaluates overrides, and crafts a customized 30-Day execution roadmap.
              </p>

              {isCoreComplete ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wide">Core Modules Met</h4>
                    <p className="text-[10px] text-emerald-700/80 font-bold uppercase mt-1">
                      You have fully completed the 8 core due diligence modules. You are ready to generate your comprehensive audit score!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-amber-800 uppercase tracking-wide">Core Audit Incomplete</h4>
                    <p className="text-[10px] text-amber-700/80 font-bold uppercase mt-1">
                      Please complete all 8 core modules below to unlock report generation. Currently completed: {coreCompletedCount} of 8.
                    </p>
                  </div>
                </div>
              )}

              <button
                disabled={!isCoreComplete}
                onClick={handleGenerateReport}
                className="w-full bg-[#022f42] disabled:opacity-40 text-[#ffd800] py-4 text-xs font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-all flex items-center justify-center gap-2"
              >
                Generate Investor-Ready Report <ArrowRight size={14} />
              </button>
            </div>

            {/* Checklist of Gates */}
            <div className="bg-white border-2 border-[#022f42]/5 p-8 space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-[#022f42] uppercase tracking-widest">
                Gate Progress Checklist
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {coreModules.map((mod) => {
                  const completed = completedModules.has(mod.id);
                  return (
                    <Link
                      key={mod.id}
                      href={`/dashboard/audit/${mod.id.replace(/^\d+-/, "")}`}
                      className={`p-3 border-2 transition-all flex items-center justify-between group ${
                        completed 
                          ? "bg-emerald-50/20 border-emerald-500/10 hover:border-emerald-500/30" 
                          : "border-gray-100 hover:border-[#022f42]/20"
                      }`}
                    >
                      <span className="text-[11px] font-bold text-[#022f42]/70 group-hover:text-[#022f42] transition-colors">{mod.name}</span>
                      {completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <span className="text-[8px] font-black bg-[#022f42]/10 text-[#022f42] px-1 py-0.5 uppercase rounded-sm shrink-0">Gaps</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ─── RIGHT: PREVIOUS REPORTS LIST ──────────────────────────────── */}
          <div className="space-y-6">
            <div className="bg-[#022f42] text-white p-6 shadow-sm border border-[#1b4f68]/30 space-y-4">
              <h3 className="text-xs font-black text-[#ffd800] uppercase tracking-widest border-b border-white/10 pb-3">
                My Generated Reports
              </h3>

              {previousReports.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <FileText className="w-8 h-8 text-white/20 mx-auto" />
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">No reports compiled yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {previousReports.map((rep) => (
                    <div 
                      key={rep.id} 
                      className="p-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-sm space-y-3 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[8px] font-bold text-white/40 uppercase">
                            {new Date(rep.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-[#ffd800] mt-0.5">
                            {rep.band}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black font-mono text-white">{rep.score}</span>
                          <span className="text-[8px] text-white/40 block">/100</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <Link 
                          href={`/report/${rep.id}`}
                          className="flex-1 bg-white/10 hover:bg-white/20 transition-all text-center py-2 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          <Eye size={10} /> Preview
                        </Link>
                        {rep.is_unlocked ? (
                          <a 
                            href={`/api/report/${rep.id}/pdf`}
                            target="_blank"
                            className="flex-1 bg-[#ffd800] hover:bg-[#ffd800]/90 text-[#022f42] transition-all text-center py-2 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                          >
                            <FileDown size={10} /> PDF
                          </a>
                        ) : (
                          <Link 
                            href={`/report/${rep.id}`}
                            className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-[#ffd800] border border-amber-500/30 transition-all text-center py-2 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                          >
                            <Lock size={10} /> Unlock
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
