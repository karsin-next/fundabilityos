"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Zap, 
  BrainCircuit, 
  ShieldCheck, 
  MessageSquare, 
  Clock, 
  Filter,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Terminal
} from "lucide-react";

interface ReasoningTrace {
  id: string;
  user_id: string;
  assessment_id: string;
  prompt_version: string;
  input_context: string;
  bull_case: string;
  bear_case: string;
  final_output: any;
  reasoning_trace: string;
  model_used: string;
  created_at: string;
}

export default function TelemetryPage() {
  const [traces, setTraces] = useState<ReasoningTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrace, setActiveTrace] = useState<ReasoningTrace | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchTraces();
  }, []);

  async function fetchTraces() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_interaction_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setTraces(data);
        if (data.length > 0) setActiveTrace(data[0]);
      }
    } catch (err) {
      console.error("Fetch traces error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-black text-[#022f42] uppercase tracking-tighter">AI Performance Telemetry</h2>
        <p className="text-sm font-medium text-[#022f42]/50 mt-1">Audit the internal "Investor Reasoning" and agentic self-corrections.</p>
      </div>

      {/* Real-time Feed Toggle */}
      <div className="flex items-center justify-between p-6 bg-[#022f42] rounded-sm shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
             <Zap className="w-6 h-6 text-[#ffd800]" />
             <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ffd800] rounded-full animate-ping"></span>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-[#ffd800]">Autonomous Intelligence ACTIVE</div>
            <div className="text-[10px] font-medium text-[#ffd800]/60 uppercase tracking-widest">Protocol v4.5.1-agentic | Node 001-A</div>
          </div>
        </div>
        <button className="px-6 py-2 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
           Pause Live Stream
        </button>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Monitoring Controls & Calibration Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 border border-[#022f42]/5 shadow-sm">
             <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mb-4 px-1">Calibration Health</div>
             <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                   <div className="text-[10px] font-bold text-[#022f42] uppercase tracking-widest">Avg Precision Delta</div>
                   <div className="text-sm font-black text-amber-600">4.2 pts</div>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                   <div className="text-[10px] font-bold text-[#022f42] uppercase tracking-widest">Agent Consensus</div>
                   <div className="text-sm font-black text-emerald-600">92.4%</div>
                </div>
                <div className="flex justify-between items-center">
                   <div className="text-[10px] font-bold text-[#022f42] uppercase tracking-widest">Drift Tolerance</div>
                   <div className="text-sm font-black text-[#022f42]">±10 pts</div>
                </div>
             </div>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mb-2 px-2">Decision Log</div>
          {loading ? (
            Array(5).fill(0).map((_, i) => <div key={i} className="h-24 bg-white animate-pulse mb-3" />)
          ) : traces.length === 0 ? (
            <div className="p-10 bg-white border border-dashed border-[#022f42]/10 text-center">
              <MessageSquare className="w-8 h-8 text-[#022f42]/10 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-[#022f42]/40 uppercase tracking-widest">No traces recorded yet</p>
            </div>
          ) : traces.map((trace) => (
            <button 
              key={trace.id}
              onClick={() => setActiveTrace(trace)}
              className={`w-full text-left p-5 border-2 transition-all group relative overflow-hidden ${
                activeTrace?.id === trace.id ? "border-[#ffd800] bg-white shadow-lg" : "border-transparent bg-white/60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-100 text-[#022f42]/60">#{trace.id.slice(0, 8)}</span>
                 <span className="text-[9px] font-bold text-[#022f42]/30 uppercase tracking-widest flex items-center gap-1">
                   <Clock className="w-3 h-3" /> {new Date(trace.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
              </div>
              <div className="text-xs font-black text-[#022f42] mb-1 uppercase tracking-tight">Audit: {trace.prompt_version}</div>
              <p className="text-[10px] font-medium text-[#022f42]/40 line-clamp-2 italic leading-relaxed">"{trace.reasoning_trace?.slice(0, 120)}..."</p>
              <div className="flex items-center gap-3 mt-4">
                 <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-700 uppercase">Validated</span>
                 </div>
                 <div className="text-[9px] font-black text-[#022f42]/20 uppercase ml-auto">{trace.model_used.includes('sonnet') ? 'Sonnet' : 'Haiku'}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="bg-white border border-[#022f42]/5 shadow-xl min-h-[700px] flex flex-col">
              {activeTrace ? (
                <>
                  <div className="p-6 border-b border-[#022f42]/5 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#022f42] text-[#ffd800] rounded-sm shadow-md">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[#022f42] uppercase tracking-tight leading-none">Internal Reasoning Trace</h3>
                        <p className="text-[10px] font-bold text-[#022f42]/40 uppercase tracking-widest mt-1">Version: {activeTrace.prompt_version} • ID: {activeTrace.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100">Decision Finalized</span>
                    </div>
                  </div>

                  <div className="p-10 space-y-10 flex-1">
                    {/* Agentic Debate Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#f2f6fa] border border-[#022f42]/5 rounded-full flex items-center justify-center z-10 hidden md:flex shadow-sm">
                          <span className="text-[10px] font-black text-[#022f42]/40 uppercase">vs</span>
                       </div>

                       {/* Primary/Bull Thought */}
                       <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Bull Agent Narrative</span>
                          </div>
                          <div className="p-6 bg-blue-50/50 border-l-4 border-blue-500 min-h-[150px] shadow-inner">
                            <p className="text-xs font-medium text-[#022f42]/80 leading-relaxed italic">
                              "{activeTrace.bull_case || "Bull agent perspective not recorded for this run."}"
                            </p>
                          </div>
                       </div>

                       {/* Critic/Bear Thought */}
                       <div className="space-y-4">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 px-2.5 py-1">Bear Agent Reflection</span>
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                          </div>
                          <div className="p-6 bg-gray-50 border-r-4 border-[#022f42] min-h-[150px] text-right shadow-inner">
                            <p className="text-xs font-medium text-[#022f42]/80 leading-relaxed italic">
                              "{activeTrace.bear_case || "Bear agent perspective not recorded for this run."}"
                            </p>
                          </div>
                       </div>
                    </div>

                    {/* Consensus Outcome */}
                    <div className="pt-10 border-t border-[#022f42]/5">
                       <div className="flex items-center gap-3 mb-6">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Autonomous Consensus Reached</h4>
                       </div>
                       <div className="p-8 bg-[#022f42] border border-white/5 relative group rounded-sm shadow-2xl">
                          <Terminal className="absolute top-4 right-4 w-4 h-4 text-[#ffd800]/20" />
                          <div className="font-mono text-[11px] text-[#ffd800] leading-loose">
                            <span className="text-white/40 font-bold ml-[-4px]">$ log.arbiter_consensus:</span> "{activeTrace.reasoning_trace}"
                          </div>
                       </div>
                    </div>

                    {/* Final Score Impact */}
                    <div className="grid grid-cols-4 gap-4 pt-4 text-center">
                      <div className="p-5 bg-white border border-[#022f42]/5 shadow-sm rounded-sm">
                        <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mb-2">Final Score</div>
                        <div className="text-2xl font-black text-[#022f42]">{activeTrace.final_output?.score || "N/A"}</div>
                      </div>
                      <div className="p-5 bg-white border border-[#022f42]/5 shadow-sm rounded-sm">
                        <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mb-2">Matching</div>
                        <div className="text-2xl font-black text-emerald-600">High</div>
                      </div>
                      <div className="p-5 bg-white border border-[#022f42]/5 shadow-sm rounded-sm">
                        <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mb-2">Confidence</div>
                        <div className="text-2xl font-black text-[#022f42]">94%</div>
                      </div>
                      <div className="p-5 bg-white border border-[#022f42]/5 shadow-sm rounded-sm border-b-[#ffd800] border-b-2">
                        <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mb-2">Status</div>
                        <div className="text-2xl font-black text-emerald-600">Audit ✅</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-gray-50 border-t border-[#022f42]/5 text-right flex justify-between items-center">
                     <p className="text-[10px] font-bold text-[#022f42]/30 uppercase tracking-widest">Model: {activeTrace.model_used}</p>
                     <button 
                        onClick={() => alert("Logic Correction approval is handled via the Simulation Console for better context.")}
                        className="px-10 py-4 bg-[#022f42] text-[#ffd800] text-[10px] font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-all shadow-xl"
                     >
                        Request Logic Correction
                     </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex-1 flex items-center justify-center p-20 text-center">
                  <div className="max-w-xs grayscale opacity-20">
                    <BrainCircuit className="w-16 h-16 text-[#022f42] mx-auto mb-6" />
                    <h4 className="text-xl font-black text-[#022f42] uppercase tracking-tighter">No Interaction Selected</h4>
                    <p className="text-xs font-medium text-[#022f42]/40 mt-2 uppercase tracking-widest leading-loose">Select a session from the Decision Log to inspect the agentic reasoning trace.</p>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
