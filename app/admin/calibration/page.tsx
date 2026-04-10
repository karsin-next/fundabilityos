"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  GitBranch, 
  Play, 
  Trash2, 
  Copy, 
  Save, 
  ExternalLink,
  Plus,
  History,
  Info
} from "lucide-react";

interface PromptVersion {
  id: string;
  version: string;
  type: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

export default function CalibrationPage() {
  const [prompts, setPrompts] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePrompt, setActivePrompt] = useState<PromptVersion | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchPrompts();
  }, []);

  async function fetchPrompts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("prompt_registry")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setPrompts(data);
      setActivePrompt(data.find(p => p.is_active) || data[0]);
    }
    setLoading(false);
  }

  async function toggleActive(id: string) {
    // In a real app, this would be a transaction to deactivate others
    await supabase.from("prompt_registry").update({ is_active: false }).neq("id", id);
    await supabase.from("prompt_registry").update({ is_active: true }).eq("id", id);
    fetchPrompts();
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-[#022f42] uppercase tracking-tighter">Logic Calibration</h2>
          <p className="text-sm font-medium text-[#022f42]/50 mt-1">Manage the proprietary "Institutional Brain" and A/B test diagnostic logic.</p>
        </div>
        <button className="flex items-center gap-2 px-8 py-4 bg-[#022f42] text-[#ffd800] text-[10px] font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-colors shadow-lg">
           <Plus className="w-4 h-4" /> New Logic Version
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Version Selection Sidebar */}
        <div className="lg:col-span-1 space-y-4">
           <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mb-2 px-1">Logic Registry</div>
           {loading ? (
             Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-white animate-pulse" />)
           ) : prompts.length === 0 ? (
             <div className="p-6 bg-white border border-[#022f42]/5 text-center italic text-xs text-[#022f42]/30">No versions registered.</div>
           ) : prompts.map((p) => (
             <button 
              key={p.id}
              onClick={() => setActivePrompt(p)}
              className={`w-full text-left p-5 border-2 transition-all relative ${
                activePrompt?.id === p.id ? "border-[#ffd800] bg-white shadow-lg" : "border-transparent bg-white/60"
              }`}
             >
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                     <GitBranch className="w-3 h-3 text-[#022f42]/30" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">{p.version}</span>
                   </div>
                   {p.is_active && (
                     <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-1.5 py-0.5">Live</span>
                   )}
                </div>
                <div className="text-[9px] font-bold text-[#022f42]/40 uppercase tracking-widest">{p.type} Engine</div>
             </button>
           ))}
        </div>

        {/* Editor & Testing Area */}
        <div className="lg:col-span-3 space-y-6">
           {activePrompt ? (
             <div className="bg-white border border-[#022f42]/5 shadow-xl flex flex-col min-h-[700px]">
                <div className="p-6 border-b border-[#022f42]/5 flex items-center justify-between bg-gray-50/50">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white border border-[#022f42]/10 text-[#022f42] rounded-sm shadow-sm">
                        <History className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[#022f42] uppercase tracking-tight">System Prompt Editor</h3>
                        <p className="text-[10px] font-bold text-[#022f42]/40 uppercase tracking-widest mt-1">Version: {activePrompt.version}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <button className="p-3 bg-white border border-[#022f42]/10 text-[#022f42]/40 hover:text-[#022f42] hover:shadow-md transition-all rounded-sm"><Copy className="w-4 h-4" /></button>
                      <button className="p-3 bg-white border border-[#022f42]/10 text-[#022f42]/40 hover:text-red-600 hover:shadow-md transition-all rounded-sm"><Trash2 className="w-4 h-4" /></button>
                      <button 
                        onClick={() => toggleActive(activePrompt.id)}
                        disabled={activePrompt.is_active}
                        className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                          activePrompt.is_active 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default" 
                          : "bg-[#ffd800] text-[#022f42] shadow-lg shadow-[#ffd800]/20 hover:scale-[1.02]"
                        }`}
                      >
                         {activePrompt.is_active ? "Currently Live" : "Deploy to Production"}
                      </button>
                   </div>
                </div>

                <div className="flex-1 flex flex-col p-8 space-y-6">
                   <div className="space-y-3 flex-1 flex flex-col">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">Diagnostic System Instruction</label>
                      <textarea 
                        className="flex-1 w-full p-6 bg-[#022f42] text-[#ffd800] font-mono text-xs leading-relaxed border-none focus:ring-4 focus:ring-[#ffd800]/20 transition-all rounded-sm resize-none"
                        value={activePrompt.content}
                        onChange={() => {}} // Handle change
                      />
                   </div>

                   <div className="p-6 bg-[#f2f6fa] border border-[#022f42]/5 rounded-sm flex items-start gap-4">
                      <Info className="w-5 h-5 text-[#022f42]/20 mt-1 shrink-0" />
                      <div className="text-xs font-medium text-[#022f42]/60 leading-relaxed">
                        <strong className="text-[#022f42]">Pro Tip:</strong> Use the <code className="bg-white px-1 font-bold">{"{REASONING_TRACE}"}</code> variable to enable agentic self-reflection for this version. This will increase token usage by approx. 15% but highly improves logic precision.
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-[#022f42]/5 flex justify-between items-center">
                   <div className="flex gap-4">
                      <button className="flex items-center gap-2 px-6 py-3 bg-white border border-[#022f42]/10 text-[10px] font-black uppercase tracking-widest text-[#022f42] hover:bg-gray-100">
                         <Play className="w-4 h-4" /> Run Regression Test
                      </button>
                      <button className="flex items-center gap-2 px-6 py-3 bg-white border border-[#022f42]/10 text-[10px] font-black uppercase tracking-widest text-[#022f42] hover:bg-gray-100 font-black">
                         <ExternalLink className="w-4 h-4" /> Compare with Baseline
                      </button>
                   </div>
                   <button className="flex items-center gap-2 px-10 py-3 bg-[#022f42] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-colors">
                      <Save className="w-4 h-4" /> Save Version Changes
                   </button>
                </div>
             </div>
           ) : (
             <div className="h-full flex items-center justify-center p-20 text-center">
                <div className="max-w-xs">
                  <GitBranch className="w-12 h-12 text-[#022f42]/10 mx-auto mb-4" />
                  <h4 className="text-xl font-black text-[#022f42] uppercase tracking-tighter">No Version Selected</h4>
                  <p className="text-xs font-medium text-[#022f42]/40 mt-2">Select a logic version from the registry to begin auditing or deployment.</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
