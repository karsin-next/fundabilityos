"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquare, Sparkles, Save, Loader2 } from "lucide-react";
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
      if (!user) throw new Error("Not authenticated");

      // We aggregate the entire chain into the single audit_responses row under `open_text` block or similar.
      // E.g., summing score, and JSON.stringify the historic timeline to retain the context.
      
      const finalScore = answers.reduce((acc, a) => acc + (a.scoreValue || 0), 0) / maxQuestions;
      const aggregatedJSON = JSON.stringify(answers);

      const { error } = await supabase
        .from("audit_responses")
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          selected_option: "DYNAMIC_CHAIN",
          open_text: aggregatedJSON,
          score_value: Math.round(finalScore),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setSavedStatus("success");
    } catch (err) {
      console.error("Save failed:", err);
      setSavedStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

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

      {isLoadingNext ? (
        <div className="p-8 md:p-14 flex flex-col items-center justify-center min-h-[400px]">
           <div className="w-12 h-12 border-4 border-[#022f42]/10 border-t-[#ffd800] rounded-full animate-spin mb-4" />
           <p className="text-xs font-black uppercase tracking-widest text-[#022f42]/50 animate-pulse">
             Synthesizing Neural Pathway...
           </p>
        </div>
      ) : savedStatus === "success" ? (
        <div className="p-8 md:p-14 flex flex-col items-center justify-center min-h-[400px] text-center">
           <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
             <CheckCircle2 className="w-10 h-10 text-emerald-500" />
           </div>
           <h2 className="text-2xl font-black text-[#022f42] uppercase tracking-tight mb-2">Module Captured</h2>
           <p className="text-sm font-medium text-[#1e4a62] max-w-sm mx-auto">
             Your dynamic responses have been structurally mapped into your diagnostic index.
           </p>
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
