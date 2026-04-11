"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Play, RefreshCw, CheckCircle, AlertTriangle, Clock, TrendingDown } from "lucide-react";

interface CalibrationRun {
  id: string;
  batch_size: number;
  profiles_generated: number;
  score_distribution: Record<string, number>;
  pct_above_75: number;
  calibration_triggered: boolean;
  updated_prompt_snippet: string | null;
  estimated_cost_cents: number;
  budget_aborted: boolean;
  run_source: string;
  created_at: string;
}

export default function SimulatePage() {
  const [runs, setRuns] = useState<CalibrationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedRun, setSelectedRun] = useState<CalibrationRun | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchRuns();
  }, []);

  async function fetchRuns() {
    setLoading(true);
    const { data } = await supabase
      .from("calibration_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15);
    if (data) {
      setRuns(data);
      if (data.length > 0 && !selectedRun) setSelectedRun(data[0]);
    }
    setLoading(false);
  }

  async function triggerSimulation() {
    setRunning(true);
    try {
      const res = await fetch("/api/cron/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-run-source": "manual" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.aborted) {
        alert(`⚠️ Budget cap reached. ${data.reason}`);
      } else if (data.success) {
        alert(`✅ Simulation complete!\n${data.batch_size} profiles scored.\n${data.pct_above_75}% scored >75.\nCalibration triggered: ${data.calibration_triggered}`);
      }
      await fetchRuns();
    } catch (e) {
      alert("Simulation failed. Check server logs.");
    } finally {
      setRunning(false);
    }
  }

  const statusIcon = (run: CalibrationRun) => {
    if (run.budget_aborted) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (run.calibration_triggered) return <TrendingDown className="w-4 h-4 text-amber-500" />;
    return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-[#022f42] uppercase tracking-tighter">Simulation Console</h2>
          <p className="text-sm font-medium text-[#022f42]/50 mt-1">
            Recursive self-calibration engine. Prevents score inflation across all QuickAssess runs.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchRuns}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-[#022f42]/10 text-[10px] font-black uppercase tracking-widest text-[#022f42] hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={triggerSimulation}
            disabled={running}
            className="flex items-center gap-2 px-8 py-3 bg-[#022f42] text-[#ffd800] text-[10px] font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-colors shadow-lg disabled:opacity-50"
          >
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? "Running..." : "Run Simulation Now"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {runs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Runs", value: runs.length },
            { label: "Calibrations Triggered", value: runs.filter(r => r.calibration_triggered).length },
            { label: "Budget Aborts", value: runs.filter(r => r.budget_aborted).length },
            { label: "Total AI Cost", value: `$${(runs.reduce((s, r) => s + (r.estimated_cost_cents || 0), 0) / 100).toFixed(3)}` },
          ].map(card => (
            <div key={card.label} className="bg-white border border-[#022f42]/5 p-5 shadow-sm">
              <div className="text-2xl font-black text-[#022f42]">{card.value}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Run List */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mb-3">Simulation History</div>
          {loading ? (
            Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-white animate-pulse" />)
          ) : runs.length === 0 ? (
            <div className="p-8 bg-white text-center text-xs text-[#022f42]/30 italic">No simulation runs yet. Click "Run Now" to begin.</div>
          ) : runs.map(run => (
            <button
              key={run.id}
              onClick={() => setSelectedRun(run)}
              className={`w-full text-left p-4 border-2 transition-all ${selectedRun?.id === run.id ? "border-[#ffd800] bg-white shadow-md" : "border-transparent bg-white/70 hover:bg-white"}`}
            >
              <div className="flex items-center justify-between mb-1">
                {statusIcon(run)}
                <span className="text-[9px] font-bold text-[#022f42]/30">{new Date(run.created_at).toLocaleDateString()}</span>
              </div>
              <div className="text-xs font-black text-[#022f42] uppercase tracking-tight">
                {run.profiles_generated} Profiles • {run.pct_above_75?.toFixed(1)}% &gt;75
              </div>
              <div className="text-[9px] font-bold text-[#022f42]/40 uppercase tracking-widest mt-1">
                {run.calibration_triggered ? "⚖️ Calibrated" : run.budget_aborted ? "🛑 Budget Abort" : "✓ Clean Run"} • {run.run_source}
              </div>
            </button>
          ))}
        </div>

        {/* Run Detail */}
        <div className="lg:col-span-2">
          {selectedRun ? (
            <div className="bg-white border border-[#022f42]/5 shadow-xl">
              <div className="p-6 border-b border-[#022f42]/5 bg-gray-50 flex items-center gap-4">
                {statusIcon(selectedRun)}
                <div>
                  <h3 className="text-sm font-black text-[#022f42] uppercase tracking-tight">
                    Run Detail — {new Date(selectedRun.created_at).toLocaleString()}
                  </h3>
                  <p className="text-[10px] text-[#022f42]/40 font-bold uppercase tracking-widest mt-0.5">
                    Source: {selectedRun.run_source} • Cost: ${((selectedRun.estimated_cost_cents || 0) / 100).toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="p-8 space-y-8">
                {/* Score Distribution */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mb-4">Score Distribution</div>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.entries(selectedRun.score_distribution || {}).map(([band, count]) => (
                      <div key={band} className="text-center p-4 bg-[#f2f6fa]">
                        <div className="text-2xl font-black text-[#022f42]">{count as number}</div>
                        <div className="text-[9px] font-black text-[#022f42]/40 uppercase tracking-widest mt-1">{band}</div>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-3 p-3 text-[11px] font-bold rounded-sm ${selectedRun.pct_above_75 > 15 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {selectedRun.pct_above_75?.toFixed(1)}% scored above 75 (threshold: 15%). {selectedRun.calibration_triggered ? "Calibration was triggered." : "Within healthy range."}
                  </div>
                </div>

                {/* Calibration Amendment */}
                {selectedRun.updated_prompt_snippet && (
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mb-3">Auto-Generated Calibration Amendment</div>
                    <div className="bg-[#022f42] text-[#ffd800] font-mono text-xs p-6 leading-relaxed whitespace-pre-wrap rounded-sm">
                      {selectedRun.updated_prompt_snippet}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-20 text-center">
              <div><Clock className="w-12 h-12 text-[#022f42]/10 mx-auto mb-4" />
                <p className="text-xs text-[#022f42]/30 italic">Select a simulation run to view details.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
