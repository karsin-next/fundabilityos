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
  audit_id: string;
  primary_thought: string;
  critic_thought: string;
  consensus_delta: string;
  prompt_version_id: string;
  created_at: string;
}

export default function TelemetryPage() {
  const [traces, setTraces] = useState<ReasoningTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchTraces();
  }, []);

  async function fetchTraces() {
    setLoading(true);
    // In a real app, this would join with prompt_registry and audit_responses
    const { data, error } = await supabase
      .from("reasoning_traces")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setTraces(data);
    setLoading(false);
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
            <div className="text-[10px] font-medium text-[#ffd800]/60 uppercase tracking-widest">Protocol v4.2.0-baseline | Node 001-A</div>
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
             <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mb-4">Calibration Core</div>
             <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                   <div className="text-[10px] font-bold text-[#022f42] uppercase tracking-widest">Avg Precision Delta</div>
                   <div className="text-sm font-black text-amber-600">4.2 pts</div>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                   <div className="text-[10px] font-bold text-[#022f42] uppercase tracking-widest">Bias Alerts (24h)</div>
                   <div className="text-sm font-black text-red-600">2 Detects</div>
                </div>
                <div className="flex justify-between items-center">
                   <div className="text-[10px] font-bold text-[#022f42] uppercase tracking-widest">Drift Tolerance</div>
                   <div className="text-sm font-black text-[#022f42]">±15 pts</div>
                </div>
             </div>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mb-2 px-1">Recent Activity Feed</div>
          {loading ? (
            Array(5).fill(0).map((_, i) => <div key={i} className="h-24 bg-white animate-pulse" />)
          ) : traces.length === 0 ? (
            <div className="p-10 bg-white border border-dashed border-[#022f42]/10 text-center">
              <MessageSquare className="w-8 h-8 text-[#022f42]/10 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-[#022f42]/40 uppercase tracking-widest">No traces recorded yet</p>
            </div>
          ) : traces.map((trace) => (
            <button 
              key={trace.id}
              className="w-full text-left bg-white p-5 border border-[#022f42]/5 hover:border-[#ffd800]/50 hover:shadow-lg transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-100 text-[#022f42]/60">#{trace.id.slice(0, 8)}</span>
                 <span className="text-[9px] font-bold text-[#022f42]/30 uppercase tracking-widest flex items-center gap-1">
                   <Clock className="w-3 h-3" /> {new Date(trace.created_at).toLocaleTimeString()}
                 </span>
              </div>
              <div className="text-xs font-black text-[#022f42] mb-1 group-hover:text-[#ffd800] transition-colors">Strategic Narrative Audit</div>
              <p className="text-[10px] font-medium text-[#022f42]/40 line-clamp-2 italic">"{trace.primary_thought?.slice(0, 100)}..."</p>
              <div className="flex items-center gap-3 mt-3">
                 <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-700 uppercase">Validated</span>
                 </div>
                 <div className="text-[9px] font-black text-[#022f42]/20 uppercase ml-auto">Score: 88</div>
              </div>
            </button>
          ))}
        </div>

          <div className="lg:col-span-3 space-y-6">
           <div className="bg-white border border-[#022f42]/5 shadow-xl min-h-[600px] flex flex-col">
              <div className="p-6 border-b border-[#022f42]/5 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#022f42] text-[#ffd800] rounded-sm">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#022f42] uppercase tracking-tight leading-none">Internal Reasoning Trace</h3>
                    <p className="text-[10px] font-bold text-[#022f42]/40 uppercase tracking-widest mt-1">Session Audit: 00b-33fd-41e</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200">Refinement Successful</span>
                </div>
              </div>

              <div className="p-8 space-y-8 flex-1">
                {/* Agentic Debate Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#f2f6fa] border border-[#022f42]/5 rounded-full flex items-center justify-center z-10 hidden md:flex">
                      <span className="text-[10px] font-black text-[#022f42]/40 uppercase">vs</span>
                   </div>

                   {/* Primary Thought */}
                   <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Primary Auditor Thought</span>
                      </div>
                      <div className="p-5 bg-blue-50/50 border-l-4 border-blue-500 min-h-[150px]">
                        <p className="text-xs font-medium text-[#022f42]/80 leading-relaxed italic">
                          "The founder's claim of 'Market Dominance' in a fragmented space like B2B logistics feels premature. I am looking for signals of defensibility Beyond the sales cycle. I'll ask about their LTV/CAC ratio to pressure test the unit economics."
                        </p>
                      </div>
                   </div>

                   {/* Critic Thought */}
                   <div className="space-y-3">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#ffd800] bg-[#022f42] px-2 py-0.5">Critic Agent Reflection</span>
                        <div className="w-2 h-2 bg-[#ffd800] rounded-full" />
                      </div>
                      <div className="p-5 bg-gray-50 border-r-4 border-[#022f42] min-h-[150px] text-right">
                        <p className="text-xs font-medium text-[#022f42]/80 leading-relaxed italic">
                          "LTV/CAC is a lag indicator. If they are Pre-Seed, they won't have it. We should critique the **Burn-to-Milestone** ratio instead. Focus the interview on the roadmap clarity rather than historical metrics."
                        </p>
                      </div>
                   </div>
                </div>

                {/* Consensus Outcome */}
                <div className="pt-8 border-t border-[#022f42]/5">
                   <div className="flex items-center gap-3 mb-4">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Autonomous Consensus Reached</h4>
                   </div>
                   <div className="p-6 bg-[#f2f6fa] border border-[#022f42]/5 relative group">
                      <Terminal className="absolute top-4 right-4 w-4 h-4 text-[#022f42]/10" />
                      <div className="font-mono text-[11px] text-[#022f42]/70 leading-relaxed">
                        <span className="text-emerald-600 font-bold">$ log.decision:</span> "Switching strategy from Metrics-First to Roadmap-First for this candidate based on stage-appropriate reflection. Injecting 'Capital Efficiency' module into the interview tree."
                      </div>
                   </div>
                </div>

                   {/* Final Score Impact */}
                <div className="grid grid-cols-4 gap-4 pt-4">
                  <div className="p-4 bg-white border border-[#022f42]/5 shadow-sm">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mb-1">Precision Delta</div>
                    <div className="text-lg font-black text-amber-600">3.8 pts</div>
                  </div>
                  <div className="p-4 bg-white border border-[#022f42]/5 shadow-sm">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mb-1">Benchmark Match</div>
                    <div className="text-lg font-black text-emerald-600">96.2%</div>
                  </div>
                  <div className="p-4 bg-white border border-[#022f42]/5 shadow-sm">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mb-1">Agent Confidence</div>
                    <div className="text-lg font-black text-[#022f42]">94%</div>
                  </div>
                  <div className="p-4 bg-white border border-[#022f42]/5 shadow-sm">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mb-1">Status</div>
                    <div className="text-lg font-black text-emerald-600">Safe</div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-[#022f42]/5 text-right">
                 <button className="px-8 py-3 bg-[#022f42] text-[#ffd800] text-[10px] font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-colors">
                    Approve Logic Correction
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
