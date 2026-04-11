"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquareMore, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Search } from "lucide-react";

interface Debate {
  id: string;
  assessment_id: string;
  bull_argument: string;
  bear_argument: string;
  arbiter_output: {
    score: number;
    gap_1: string;
    gap_2: string;
    investor_take: string;
  };
  consensus_score: number;
  delta_from_primary: number;
  created_at: string;
}

export default function DebatePage() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchDebates();
  }, []);

  async function fetchDebates() {
    setLoading(true);
    const { data } = await supabase
      .from("score_debates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setDebates(data);
    setLoading(false);
  }

  const filtered = debates.filter(d =>
    !search || d.assessment_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-[#022f42] uppercase tracking-tighter">Reasoning Traces</h2>
          <p className="text-sm font-medium text-[#022f42]/50 mt-1">
            Bull vs. Bear debate transcripts for every completed QuickAssess.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#022f42]/10 px-4 py-3 shadow-sm">
          <Search className="w-4 h-4 text-[#022f42]/30" />
          <input
            type="text"
            placeholder="Search by Assessment ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-xs font-medium text-[#022f42] outline-none w-64 placeholder:text-[#022f42]/30"
          />
        </div>
      </div>

      {/* Debates List */}
      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-white animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="p-16 bg-white text-center">
            <MessageSquareMore className="w-12 h-12 text-[#022f42]/10 mx-auto mb-4" />
            <p className="text-sm text-[#022f42]/30 italic">No debate transcripts yet. Debates are generated after every real QuickAssess run.</p>
          </div>
        ) : filtered.map(debate => (
          <div key={debate.id} className="bg-white border border-[#022f42]/5 shadow-sm">
            {/* Row Header */}
            <button
              onClick={() => setExpanded(expanded === debate.id ? null : debate.id)}
              className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50/50 transition-all"
            >
              <div className="flex items-center gap-6">
                {/* Delta indicator */}
                <div className={`w-16 text-center p-2 font-black text-base ${
                  (debate.delta_from_primary || 0) > 0
                    ? "bg-emerald-50 text-emerald-700"
                    : (debate.delta_from_primary || 0) < 0
                    ? "bg-red-50 text-red-700"
                    : "bg-gray-50 text-gray-700"
                }`}>
                  {(debate.delta_from_primary || 0) > 0 ? "+" : ""}{debate.delta_from_primary || 0}
                </div>
                <div>
                  <div className="text-xs font-black text-[#022f42] uppercase tracking-tight">
                    Assessment: <span className="font-mono text-[#022f42]/50">{debate.assessment_id.slice(0, 8)}...</span>
                  </div>
                  <div className="text-[10px] font-bold text-[#022f42]/40 mt-1 uppercase tracking-widest">
                    Consensus Score: <strong className="text-[#022f42]">{debate.consensus_score}</strong> / 100 • {new Date(debate.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {(debate.delta_from_primary || 0) > 5 && (
                  <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1">
                    <TrendingUp className="w-3 h-3" /> Bull Won
                  </span>
                )}
                {(debate.delta_from_primary || 0) < -5 && (
                  <span className="flex items-center gap-1 text-[9px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-2 py-1">
                    <TrendingDown className="w-3 h-3" /> Bear Won
                  </span>
                )}
                {expanded === debate.id ? <ChevronUp className="w-5 h-5 text-[#022f42]/30" /> : <ChevronDown className="w-5 h-5 text-[#022f42]/30" />}
              </div>
            </button>

            {/* Expanded Debate Transcript */}
            {expanded === debate.id && (
              <div className="border-t border-[#022f42]/5 p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bull Case */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Bull Case (Optimistic VC)</span>
                    </div>
                    <div className="p-5 bg-emerald-50 border-l-4 border-emerald-400 text-xs text-[#022f42]/80 leading-relaxed">
                      {debate.bull_argument || "—"}
                    </div>
                  </div>

                  {/* Bear Case */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Bear Case (Skeptical Analyst)</span>
                    </div>
                    <div className="p-5 bg-red-50 border-l-4 border-red-400 text-xs text-[#022f42]/80 leading-relaxed">
                      {debate.bear_argument || "—"}
                    </div>
                  </div>
                </div>

                {/* Arbiter Consensus */}
                {debate.arbiter_output && (
                  <div className="p-6 bg-[#022f42]/5 border border-[#022f42]/10 space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">Arbiter Consensus</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1 text-center">
                        <div className="text-4xl font-black text-[#022f42]">{debate.arbiter_output.score}</div>
                        <div className="text-[9px] font-black text-[#022f42]/40 uppercase tracking-widest">Consensus Score</div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <div className="p-3 bg-white border-l-4 border-amber-400 text-xs font-bold text-[#022f42]">
                          Gap 1: {debate.arbiter_output.gap_1}
                        </div>
                        <div className="p-3 bg-white border-l-4 border-amber-400 text-xs font-bold text-[#022f42]">
                          Gap 2: {debate.arbiter_output.gap_2}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm italic text-[#022f42]/60 leading-relaxed border-t border-[#022f42]/5 pt-4">
                      &ldquo;{debate.arbiter_output.investor_take}&rdquo;
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
