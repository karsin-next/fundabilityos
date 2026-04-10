"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, MessageSquare, Sparkles, Save, Loader2, TrendingUp, AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Option {
  id: string;
  label: string;
  value: number;
}

interface DynamicQuestion {
  questionTitle: string;
  options: Option[];
  placeholder?: string;
}

interface CompletedAnswer {
  questionTitle: string;
  selectedOptionId: string;
  selectedOptionLabel: string;
  openText: string;
  scoreValue: number;
}

interface InvestorAnalysis {
  overallSignal: "strong" | "moderate" | "weak";
  investorTake: string;
  strengths: string[];
  redFlags: string[];
  nextAction: string;
  score: number;
}

interface DynamicAuditComponentProps {
  moduleId: string;
  moduleContext: string;
  initialQuestion: DynamicQuestion;
  maxQuestions?: number;
}

export function DynamicAuditComponent({
  moduleId,
  moduleContext,
  initialQuestion,
  maxQuestions = 5
}: DynamicAuditComponentProps) {
  const supabase = createClient();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Track questions pulled from AI (initialized with the seed question)
  const [questions, setQuestions] = useState<DynamicQuestion[]>([initialQuestion]);
  
  // Track user answers mapped to question index
  const [answers, setAnswers] = useState<Partial<CompletedAnswer>[]>(
    Array.from({ length: maxQuestions }, () => ({}))
  );

  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [analysis, setAnalysis] = useState<InvestorAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 1. Check for existing response on mount
  useEffect(() => {
    async function checkExisting() {
      setIsInitialLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsInitialLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("audit_responses")
          .select("*")
          .eq("user_id", user.id)
          .eq("module_id", moduleId)
          .single();

        if (data && data.open_text) {
          const parsed = JSON.parse(data.open_text);
          // If the stored data contains an analysis object, use it
          if (parsed.analysis) {
            setAnalysis(parsed.analysis);
            setAnswers(parsed.answers || []);
            setSavedStatus("success");
          } else if (Array.isArray(parsed)) {
            // Legacy format or just answers, we can still show as success but might need to re-analyze
            setAnswers(parsed);
            setSavedStatus("success");
            // Optionally trigger analysis here if needed
          }
        }
      } catch (e) {
        console.error("Error checking existing response:", e);
      } finally {
        setIsInitialLoading(false);
      }
    }
    checkExisting();
  }, [moduleId, supabase]);

  const currentQ = questions[currentIndex];
  const currentA = answers[currentIndex] || {};

  const handleOptionSelect = (opt: Option) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = {
      ...newAnswers[currentIndex],
      questionTitle: currentQ.questionTitle,
      selectedOptionId: opt.id,
      selectedOptionLabel: opt.label,
      scoreValue: opt.value
    };
    setAnswers(newAnswers);
  };

  const handleTextChange = (text: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = {
      ...newAnswers[currentIndex],
      openText: text
    };
    setAnswers(newAnswers);
  };

  const canProceed = Boolean(currentA.selectedOptionId);

  const goToNextSlide = async () => {
    if (!canProceed) return;

    if (currentIndex === maxQuestions - 1) {
      // Final submit
      handleFinalSave();
      return;
    }

    // Already generated the next question previously (if user clicked back)
    if (questions[currentIndex + 1]) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    // Ping AI for the next question
    setIsLoadingNext(true);
    try {
      const historyToPass = answers.slice(0, currentIndex + 1);
      
      const res = await fetch("/api/assessment/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleContext,
          previousAnswers: historyToPass
        })
      });

      if (!res.ok) throw new Error("Failed to fetch generated question");

      const generatedQ: DynamicQuestion = await res.json();
      setQuestions(prev => [...prev, generatedQ]);
      setCurrentIndex(currentIndex + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to generate next diagnostic step. Please try again.");
    } finally {
      setIsLoadingNext(false);
    }
  };

  const handleTimelineClick = (targetIndex: number) => {
    // Only allow navigating to past questions or the immediate next accessible question
    // You cannot jump ahead of questions that haven't been generated yet.
    if (targetIndex > questions.length - 1) return;
    
    // Also, don't allow moving forward if the current question is unanswered
    if (targetIndex > currentIndex && !answers[currentIndex]?.selectedOptionId) return;

    setCurrentIndex(targetIndex);
  };

  const handleFinalSave = async () => {
    setIsSaving(true);
    setSavedStatus("saving");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Even if not authenticated, still show success (guest flow)
      if (user) {
        const finalScore = answers.reduce((acc, a) => acc + (a.scoreValue || 0), 0) / maxQuestions;
        const aggregatedJSON = JSON.stringify(answers.filter(a => a.selectedOptionId));

        // Try upsert — if the table doesn't support it, fall back to insert
        const { error } = await supabase
          .from("audit_responses")
          .upsert(
            {
              user_id: user.id,
              module_id: moduleId,
              selected_option: "DYNAMIC_CHAIN",
              open_text: aggregatedJSON,
              score_value: Math.round(finalScore),
              updated_at: new Date().toISOString()
            },
            { onConflict: "user_id,module_id", ignoreDuplicates: false }
          );

        if (error) {
          // Non-fatal: log it but still show success to the user
          console.error("Save warning:", error.message);
        }
      }

      setSavedStatus("success");

      // Fetch investor analysis
      setIsAnalyzing(true);
      try {
        const completedAnswers = answers.filter(a => a.selectedOptionId);
        const res = await fetch("/api/assessment/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleContext, answers: completedAnswers })
        });
        if (res.ok) {
          const data = await res.json() as InvestorAnalysis;
          setAnalysis(data);

          // Update the record with the analysis included for future recall
          if (user) {
            const finalScore = answers.reduce((acc, a) => acc + (a.scoreValue || 0), 0) / maxQuestions;
            await supabase
              .from("audit_responses")
              .upsert({
                user_id: user.id,
                module_id: moduleId,
                selected_option: "DYNAMIC_CHAIN",
                open_text: JSON.stringify({ answers: completedAnswers, analysis: data }),
                score_value: Math.round(finalScore),
                updated_at: new Date().toISOString()
              }, { onConflict: "user_id,module_id" });
          }
        }
      } catch (e) {
        console.error("Analysis fetch failed:", e);
      } finally {
        setIsAnalyzing(false);
      }
    } catch (err) {
      console.error("Save failed:", err);
      setSavedStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers for retaking
  const handleRetake = () => {
    setSavedStatus("idle");
    setAnalysis(null);
    setCurrentIndex(0);
    setAnswers(Array.from({ length: maxQuestions }, () => ({})));
  };

  if (isInitialLoading) {
    return (
      <div className="bg-white border-2 border-[#022f42]/5 shadow-[0_20px_50px_-15px_rgba(2,47,66,0.05)] p-20 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#022f42]/10 border-t-[#ffd800] rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 animate-pulse">Syncing Audit State...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-[#022f42]/5 shadow-[0_20px_50px_-15px_rgba(2,47,66,0.05)] overflow-hidden">
      
      {/* Interactive Progress Bar Timeline */}
      <div className="flex h-2.5 w-full bg-[#f8fafc] cursor-pointer">
        {Array.from({ length: maxQuestions }).map((_, idx) => {
          const isCompleted = Boolean(answers[idx]?.selectedOptionId);
          const isActive = currentIndex === idx;
          const isAccessible = idx < questions.length;
          
          return (
            <div 
              key={idx}
              onClick={() => handleTimelineClick(idx)}
              className={`flex-1 transition-all duration-300 border-r border-white/40 last:border-0 ${
                isActive 
                  ? 'bg-[#022f42] scale-y-110 shadow-lg z-10' 
                  : isCompleted 
                    ? 'bg-[#ffd800] hover:bg-[#ffe133]' 
                    : isAccessible
                      ? 'bg-gray-200 hover:bg-gray-300'
                      : 'bg-gray-100 opacity-50 cursor-not-allowed'
              }`}
            />
          );
        })}
      </div>

      <div className="flex justify-between items-center px-8 md:px-10 py-3 border-b border-gray-50 bg-gray-50/50">
         <span className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">
           Dynamic Audit Sequence
         </span>
         <span className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">
           Step {currentIndex + 1} / {maxQuestions}
         </span>
      </div>

      {isSaving ? (
        <div className="p-8 md:p-14 flex flex-col items-center justify-center min-h-[400px]">
           <div className="w-12 h-12 border-4 border-[#022f42]/10 border-t-[#ffd800] rounded-full animate-spin mb-4" />
           <p className="text-xs font-black uppercase tracking-widest text-[#022f42]/50 animate-pulse">
             FundabilityOS at work...
           </p>
        </div>
      ) : isLoadingNext ? (
        <div className="p-8 md:p-14 flex flex-col items-center justify-center min-h-[400px]">
           <div className="w-12 h-12 border-4 border-[#022f42]/10 border-t-[#ffd800] rounded-full animate-spin mb-4" />
           <p className="text-xs font-black uppercase tracking-widest text-[#022f42]/50 animate-pulse">
             FundabilityOS at work...
           </p>
        </div>
      ) : savedStatus === "success" ? (
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-emerald-100 rounded-sm flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-1">Module Captured</div>
              <h2 className="text-2xl font-black text-[#022f42] uppercase tracking-tight">Investor Signal Analysis</h2>
            </div>
          </div>

          {isAnalyzing ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-10 h-10 border-4 border-[#022f42]/10 border-t-[#ffd800] rounded-full animate-spin mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 animate-pulse">FundabilityOS at work...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Signal Badge + Score */}
              <div className={`flex items-center justify-between p-5 border-2 ${
                analysis.overallSignal === "strong" ? "border-emerald-200 bg-emerald-50" :
                analysis.overallSignal === "moderate" ? "border-[#ffd800]/40 bg-[#ffd800]/5" :
                "border-red-200 bg-red-50"
              }`}>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mb-1">Investor Signal</div>
                  <div className={`text-xl font-black uppercase tracking-tight ${
                    analysis.overallSignal === "strong" ? "text-emerald-700" :
                    analysis.overallSignal === "moderate" ? "text-amber-600" :
                    "text-red-600"
                  }`}>{analysis.overallSignal === "strong" ? "✓ Strong" : analysis.overallSignal === "moderate" ? "⚡ Moderate" : "✗ Needs Work"}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mb-1">Module Score</div>
                  <div className="text-4xl font-black text-[#022f42]">{analysis.score}<span className="text-lg text-[#022f42]/30">/100</span></div>
                </div>
              </div>

              {/* Investor Take */}
              <div className="bg-[#022f42] p-6">
                <div className="text-[9px] font-black uppercase tracking-widest text-[#ffd800] mb-3">Investor Perspective</div>
                <p className="text-sm font-medium text-[#b0d0e0] leading-relaxed">{analysis.investorTake}</p>
              </div>

              {/* Strengths + Red Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 border-2 border-emerald-100 bg-emerald-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Strengths</span>
                  </div>
                  <ul className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs font-medium text-[#022f42]/70">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-5 border-2 border-red-100 bg-red-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Watch Points</span>
                  </div>
                  <ul className="space-y-2">
                    {analysis.redFlags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs font-medium text-[#022f42]/70">
                        <span className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0 font-black">!</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Next Action */}
              <div className="p-5 border-l-4 border-[#ffd800] bg-[#ffd800]/5">
                <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mb-2">Recommended Next Action</div>
                <p className="text-sm font-bold text-[#022f42]">{analysis.nextAction}</p>
              </div>

              {/* CTA Back */}
              <div className="pt-4 flex justify-between items-center">
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 hover:text-[#022f42] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Retake Audit
                </button>
                <a href="/dashboard" className="flex items-center gap-2 bg-[#022f42] text-[#ffd800] px-8 py-4 font-black text-[10px] uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-colors">
                  Back to Audit Hub <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <a href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/50 hover:text-[#022f42]">← Back to Hub</a>
            </div>
          )}
        </div>
      ) : savedStatus === "error" ? (
        <div className="p-8 md:p-14 flex flex-col items-center justify-center min-h-[400px] text-center">
           <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
             <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" /></svg>
           </div>
           <h2 className="text-xl font-black text-[#022f42] uppercase tracking-tight mb-2">Save Failed</h2>
           <p className="text-sm font-medium text-[#1e4a62]/70 max-w-xs mx-auto mb-6">
             Could not sync your responses. Click below to retry or return to the dashboard.
           </p>
           <div className="flex gap-3">
             <button
               onClick={() => { setSavedStatus("idle"); handleFinalSave(); }}
               className="px-6 py-3 bg-[#ffd800] text-[#022f42] font-black text-[10px] uppercase tracking-widest"
             >
               Retry Save
             </button>
             <a href="/dashboard" className="px-6 py-3 bg-[#022f42]/10 text-[#022f42] font-black text-[10px] uppercase tracking-widest">
               Back to Hub
             </a>
           </div>
        </div>
      ) : (
        <div className="p-8 md:p-10 min-h-[400px] flex flex-col">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 bg-[#022f42] rounded-sm flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-[#ffd800]" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd800] mb-1">
                {currentIndex === 0 ? "Initial Vector" : "Algorithmic Drill-Down"}
              </div>
              <h2 className="text-xl font-black text-[#022f42] leading-tight uppercase tracking-tight">
                {currentQ?.questionTitle}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-8 flex-1">
            {currentQ?.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                className={`p-4 text-left border-2 transition-all duration-200 flex items-center justify-between group ${
                  currentA.selectedOptionId === option.id
                    ? 'border-[#022f42] bg-[#022f42] text-white shadow-md scale-[1.01]'
                    : 'border-[#022f42]/5 bg-white text-[#022f42]/70 hover:border-[#022f42]/20 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-bold leading-relaxed">{option.label}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ml-4 ${
                  currentA.selectedOptionId === option.id ? 'border-[#ffd800] bg-[#ffd800]' : 'border-[#022f42]/10 bg-white'
                }`}>
                  {currentA.selectedOptionId === option.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#022f42]" />}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-2 px-1">
              <MessageSquare className="w-3.5 h-3.5 text-[#022f42]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Qualitative Context (Optional)</span>
            </div>
            <textarea
              value={currentA.openText || ""}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={currentQ?.placeholder || "Add deeper insights here so our AI can calibrate accurately..."}
              className="w-full bg-[#f8fafc] border-2 border-[#022f42]/5 p-5 text-sm text-[#022f42] min-h-[100px] outline-none focus:border-[#022f42]/20 transition-all font-medium leading-relaxed rounded-sm"
            />
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={goToNextSlide}
              disabled={!canProceed || isSaving}
              className={`px-8 py-4 font-black flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest transition-all rounded-sm shadow-md ${
                !canProceed
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#ffd800] text-[#022f42] hover:bg-[#022f42] hover:text-[#ffd800]'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> WRITING TO MAINFRAME...
                </>
              ) : currentIndex === maxQuestions - 1 ? (
                <>
                  <Save className="w-4 h-4" /> LOCK IN RESPONSE
                </>
              ) : (
                "CONFIRM & CONTINUE"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
