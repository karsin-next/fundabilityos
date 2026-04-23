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
    const { data, error } = await supabase
      .from("calibration_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15);
    
    if (error) {
      console.error("[Simulation] Fetch error:", error.message);
    } else if (data) {
      setRuns(data);
      if (data.length > 0 && !selectedRun) setSelectedRun(data[0]);
    }
    setLoading(false);
  }

  async function triggerSimulation() {
    if (!confirm("Run diagnostic simulation? This will generate 20 synthetic profiles and score them. Cost approximately $0.15 - $0.25 USD.")) return;
    setRunning(true);
    try {
      const res = await fetch("/api/cron/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-run-source": "manual" },
        body: JSON.stringify({}),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { error: `Server returned non-JSON response (Status: ${res.status})` };
      }
      
      if (!res.ok) {
        throw new Error(data.error || `Simulation failed (Status: ${res.status})`);
      }

      if (data.aborted) {
        alert(`⚠️ Budget cap reached. ${data.reason}`);
      } else if (data.success) {
        alert(`✅ Simulation complete!\n${data.batch_size} profiles scored.\n${data.pct_above_75}% scored >75.\nCalibration triggered: ${data.calibration_triggered}`);
      }
      await fetchRuns();
    } catch (e: any) {
      alert(`Simulation failed: ${e.message}`);
    } finally {
      setRunning(false);
    }
  }

  async function handleApprove(runId: string) {
    if (!confirm("Apply this logic correction to the production prompt?")) return;
    setRunning(true);
    try {
      const res = await fetch("/api/admin/calibration/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_id: runId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Logic correction applied successfully!");
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (e) {
      alert("Error applying correction");
    } finally {
      setRunning(false);
    }
  }

  const statusIcon = (run: CalibrationRun) => {
    if (run.budget_aborted) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (run.calibration_triggered) return <TrendingDown className="w-5 h-5 text-amber-500" />;
    return <CheckCircle className="w-5 h-5 text-emerald-500" />;
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
            className="flex items-center gap-2 px-6 py-3 bg-white border border-[#022f42]/10 text-[10px] font-black uppercase tracking-widest text-[#022f42] hover:bg-gray-100 transition-all font-black"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={triggerSimulation}
            disabled={running}
            className="flex items-center gap-2 px-8 py-3 bg-[#022f42] text-[#ffd800] text-[10px] font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-colors shadow-lg disabled:opacity-50"
          >
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? "Simulating..." : "Run Simulation Now"}
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
          <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mb-3 px-1">Simulation History</div>
          {loading ? (
            Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-white animate-pulse" />)
          ) : runs.length === 0 ? (
            <div className="p-8 bg-white border border-dashed border-[#022f42]/10 text-center text-xs text-[#022f42]/30 italic">No simulation runs yet. Click &quot;Run Now&quot; to begin.</div>
          ) : runs.map(run => (
            <button
              key={run.id}
              onClick={() => setSelectedRun(run)}
              className={`w-full text-left p-5 border-2 transition-all relative ${selectedRun?.id === run.id ? "border-[#ffd800] bg-white shadow-lg" : "border-transparent bg-white/70 hover:bg-white"}`}
            >
              <div className="flex items-center justify-between mb-2">
                {statusIcon(run)}
                <span className="text-[9px] font-black text-[#022f42]/20 uppercase tracking-widest">{new Date(run.created_at).toLocaleDateString()}</span>
              </div>
              <div className="text-sm font-black text-[#022f42] uppercase tracking-tighter">
                {run.profiles_generated} Profiles Scored
              </div>
              <div className="flex items-center justify-between mt-1">
                 <div className="text-[9px] font-black text-[#022f42]/40 uppercase tracking-widest">
                    {run.pct_above_75?.toFixed(1)}% &gt;75
                 </div>
                 <div className="text-[8px] font-black uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 text-[#022f42]/40">{run.run_source}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Run Detail */}
        <div className="lg:col-span-2">
          {selectedRun ? (
            <div className="bg-white border border-[#022f42]/5 shadow-xl min-h-[500px] flex flex-col">
              <div className="p-6 border-b border-[#022f42]/5 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white border border-[#022f42]/10 text-[#022f42] rounded-sm shadow-sm">
                    {statusIcon(selectedRun)}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#022f42] uppercase tracking-tight">
                       Audit Run Trace
                    </h3>
                    <p className="text-[10px] text-[#022f42]/40 font-bold uppercase tracking-widest mt-1">
                      {new Date(selectedRun.created_at).toLocaleString()} • ID: {selectedRun.id.slice(0,8)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-[9px] font-black text-[#022f42]/20 uppercase tracking-widest mb-1">Estimated Cost</div>
                   <div className="text-sm font-black text-[#022f42]">${((selectedRun.estimated_cost_cents || 0) / 100).toFixed(4)}</div>
                </div>
              </div>
              
              <div className="p-10 space-y-10 flex-1">
                {/* Score Distribution */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mb-6 flex items-center gap-2">
                    <TrendingDown className="w-3.5 h-3.5" /> Synthetic Population Benchmarking
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(selectedRun.score_distribution || { "0-24": 0, "25-49": 0, "50-74": 0, "75-100": 0 }).map(([band, count]) => (
                      <div key={band} className="text-center p-6 bg-[#f2f6fa] border border-[#022f42]/5">
                        <div className="text-3xl font-black text-[#022f42]">{count as number}</div>
                        <div className="text-[9px] font-black text-[#022f42]/30 uppercase tracking-widest mt-1">{band}</div>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-6 p-4 text-[10px] font-black uppercase tracking-widest border ${selectedRun.pct_above_75 > 15 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                    Inflation Signal: {selectedRun.pct_above_75?.toFixed(1)}% scored &gt;75 {selectedRun.calibration_triggered ? "(CRITICAL: ABOVE 15% THRESHOLD)" : "(HEALTHY)"}
                  </div>
                </div>

                {/* Calibration Amendment */}
                {selectedRun.updated_prompt_snippet ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">Proposed Strictness Amendment</div>
                       <div className="text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5">Recommended</div>
                    </div>
                    <div className="bg-[#022f42] text-[#ffd800] font-mono text-[11px] p-8 leading-relaxed whitespace-pre-wrap rounded-sm shadow-inner relative group border border-white/5">
                      <div className="absolute top-4 right-4 animate-pulse opacity-20 group-hover:opacity-100 transition-opacity">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      {selectedRun.updated_prompt_snippet}
                    </div>
                  </div>
                ) : (
                    <div className="p-10 bg-gray-50 border border-dashed border-[#022f42]/10 text-center rounded-sm">
                        <CheckCircle className="w-8 h-8 text-[#022f42]/10 mx-auto mb-3" />
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/30">No Prompt Amendment Required</div>
                        <p className="text-[9px] font-bold text-[#022f42]/20 uppercase tracking-widest mt-1">Scoring distribution remains within institutional grade parameters.</p>
                    </div>
                )}
              </div>

              {selectedRun.updated_prompt_snippet && (
                <div className="p-6 bg-[#022f42] flex justify-between items-center shadow-2xl">
                   <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">Awaiting Manual Approval</div>
                   </div>
                   <button 
                    onClick={() => handleApprove(selectedRun.id)}
                    disabled={running}
                    className="px-8 py-3 bg-[#ffd800] text-[#022f42] text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl disabled:opacity-50"
                   >
                     Approve & Apply Logic Correction
                   </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-20 text-center bg-white/40 border border-[#022f42]/5 border-dashed">
              <div className="max-w-xs grayscale opacity-20">
                <Clock className="w-12 h-12 text-[#022f42] mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Select a trace to view audit details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
