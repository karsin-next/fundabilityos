"use client";

import { useState } from "react";
import { CheckCircle2, Info, MessageSquare, Sparkles, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Option {
  id: string;
  label: string;
  value: number;
}

interface ResponseData {
  selectedOption: string;
  openText: string;
}

interface PredictiveAuditQuestionProps {
  moduleId: string;
  questionTitle: string;
  options: Option[];
  placeholder?: string;
  onSave?: (data: ResponseData) => void;
  initialData?: Partial<ResponseData>;
}

export function PredictiveAuditQuestion({
  moduleId,
  questionTitle,
  options,
  placeholder = "Type your deeper contextual answer or hypothesis here...",
  onSave,
  initialData
}: PredictiveAuditQuestionProps) {
  const supabase = createClient();
  const [selectedOption, setSelectedOption] = useState<string>(initialData?.selectedOption || "");
  const [openText, setOpenText] = useState<string>(initialData?.openText || "");
  const [isSaving, setIsSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const handleSave = async () => {
    if (!selectedOption) return;
    
    setIsSaving(true);
    setSavedStatus("saving");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("audit_responses")
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          selected_option: selectedOption,
          open_text: openText,
          score_value: options.find(o => o.id === selectedOption)?.value || 0,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setSavedStatus("success");
      if (onSave) onSave({ selectedOption, openText });
      
      setTimeout(() => setSavedStatus("idle"), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      setSavedStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border-2 border-[#022f42]/5 shadow-[0_20px_50px_-15px_rgba(2,47,66,0.05)] overflow-hidden">
      {/* Header Accent */}
      <div className="h-1 w-full bg-[#022f42]/10 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-[#ffd800] to-[#022f42] transition-all duration-1000" 
          style={{ width: selectedOption ? '100%' : '0%' }}
        />
      </div>

      <div className="p-8 md:p-10">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 bg-[#022f42] rounded-sm flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-[#ffd800]" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#022f42]/40 mb-1">Predictive Learning Model</div>
            <h2 className="text-xl font-black text-[#022f42] leading-tight uppercase tracking-tight">
              {questionTitle}
            </h2>
          </div>
        </div>

        {/* Multi-Choice Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`p-4 text-left border-2 transition-all duration-200 flex items-center justify-between group ${
                selectedOption === option.id
                  ? 'border-[#022f42] bg-[#022f42] text-white'
                  : 'border-[#022f42]/5 bg-gray-50 text-[#022f42]/70 hover:border-[#022f42]/20'
              }`}
            >
              <span className="text-xs font-bold leading-relaxed">{option.label}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selectedOption === option.id ? 'border-[#ffd800] bg-[#ffd800]' : 'border-[#022f42]/10 bg-white'
              }`}>
                {selectedOption === option.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#022f42]" />}
              </div>
            </button>
          ))}
        </div>

        {/* Open Text Area */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-2 px-1">
            <MessageSquare className="w-3.5 h-3.5 text-[#022f42]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Qualitative Deep Dive</span>
          </div>
          <textarea
            value={openText}
            onChange={(e) => setOpenText(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[#f8fafc] border-2 border-[#022f42]/5 p-6 text-sm text-[#022f42] min-h-[160px] outline-none focus:border-[#022f42]/20 transition-all font-medium leading-relaxed"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-8">
          <div className="flex items-center gap-3 text-[#1e4a62]/60 bg-[#f8fafc] px-4 py-2 rounded-sm border border-[#022f42]/5">
            <Info className="w-4 h-4" />
            <p className="text-[10px] font-medium italic">
              AI uses this qualitative data to adjust your risk profile.
            </p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={!selectedOption || isSaving}
            className={`w-full sm:w-auto px-10 py-4 font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg ${
              !selectedOption
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : savedStatus === "success"
                ? 'bg-emerald-500 text-white'
                : 'bg-[#ffd800] text-[#022f42] hover:bg-[#022f42] hover:text-[#ffd800]'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : savedStatus === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? "SYNCING DATA..." : savedStatus === "success" ? "SYNC COMPLETE" : "LOCK IN RESPONSE"}
          </button>
        </div>
      </div>
    </div>
  );
}
