"use client";

import { useState } from "react";
import { AlertTriangle, TrendingUp, CheckCircle2, ChevronRight, X } from "lucide-react";

type MetricId = "burn" | "runway" | "revenue" | "ltvcac";

interface MetricState {
  value: string | null;
  label: string;
  options: { label: string; value: string }[];
}

export function TractionTracker() {
  const [activeModal, setActiveModal] = useState<MetricId | null>(null);

  // In a real app, this would be tied to the AuthContext user profile / database
  const [metrics, setMetrics] = useState<Record<MetricId, MetricState>>({
    burn: {
      value: null,
      label: "Monthly Burn Rate",
      options: [
        { label: "< $10k", value: "very_low" },
        { label: "$10k - $50k", value: "low" },
        { label: "$50k - $150k", value: "medium" },
        { label: "> $150k", value: "high" },
      ],
    },
    runway: {
      value: null,
      label: "Cash Runway",
      options: [
        { label: "< 3 Months", value: "critical" },
        { label: "3 - 6 Months", value: "low" },
        { label: "6 - 12 Months", value: "healthy" },
        { label: "> 12 Months", value: "optimal" },
      ],
    },
    revenue: {
      value: null,
      label: "Current MRR",
      options: [
        { label: "Pre-Revenue", value: "zero" },
        { label: "< $10k", value: "early" },
        { label: "$10k - $100k", value: "growth" },
        { label: "> $100k", value: "scale" },
      ],
    },
    ltvcac: {
      value: null,
      label: "LTV:CAC Ratio",
      options: [
        { label: "Unknown / Not tracking", value: "unknown" },
        { label: "< 1.0x (Burning)", value: "bad" },
        { label: "1.0x - 3.0x (Developing)", value: "okay" },
        { label: "> 3.0x (Healthy Engine)", value: "good" },
      ],
    },
  });

  const handleSelect = (metricId: MetricId, value: string) => {
    setMetrics((prev) => ({
      ...prev,
      [metricId]: { ...prev[metricId], value },
    }));
    setActiveModal(null);
  };

  const getMetricDisplayValue = (metricId: MetricId) => {
    const val = metrics[metricId].value;
    if (!val) return null;
    return metrics[metricId].options.find((o) => o.value === val)?.label;
  };

  const completedCount = Object.values(metrics).filter((m) => m.value !== null).length;
  const totalCount = Object.keys(metrics).length;

  return (
    <div className="mb-16">
      {/* Tracker Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-black text-[#022f42] uppercase tracking-[0.3em] flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-[#ffd800]" />
            Core Traction Telemetry
          </h2>
          <p className="text-xs font-medium text-[#022f42]/50 mt-1">
            Mandatory data intake for the AI Logic Engine. High-precision multiple-choice formats required.
          </p>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 bg-white px-3 py-1.5 border border-[#022f42]/10 rounded-sm">
          {completedCount} / {totalCount} Calibrated
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(metrics) as MetricId[]).map((id) => {
          const metric = metrics[id];
          const isMissing = metric.value === null;

          return (
            <button
              key={id}
              onClick={() => setActiveModal(id)}
              className={`text-left p-6 border-2 transition-all group relative overflow-hidden ${
                isMissing
                  ? "bg-red-50/30 border-red-200 hover:border-red-400"
                  : "bg-white border-[#ffd800]/40 hover:border-[#ffd800] shadow-sm"
              }`}
            >
              {isMissing && (
                <div className="absolute top-0 right-0 p-3 opacity-10 font-black text-6xl text-red-600 select-none">
                  !
                </div>
              )}

              <div className="flex flex-col h-full justify-between gap-4 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/60">
                    {metric.label}
                  </div>
                  {isMissing ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>

                <div>
                  {isMissing ? (
                    <div className="inline-block bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 mb-2">
                       Missing - High Risk
                    </div>
                  ) : (
                    <div className="text-lg font-black text-[#022f42]">
                      {getMetricDisplayValue(id)}
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-2 text-[9px] font-bold uppercase tracking-widest text-[#022f42]/40 group-hover:text-[#022f42] transition-colors">
                    {isMissing ? "Select Range" : "Update Value"} <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Multiple-Choice Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#022f42]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-[#022f42]/5 bg-gray-50">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffd800] mb-1">
                  Inject Baseline Data
                </div>
                <h3 className="text-xl font-black text-[#022f42] uppercase tracking-tight">
                  {metrics[activeModal].label}
                </h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 bg-white rounded-sm hover:bg-gray-100 transition-colors border border-[#022f42]/10"
              >
                <X className="w-4 h-4 text-[#022f42]/40" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs font-medium text-[#022f42]/60 mb-6 leading-relaxed">
                Select the range that most accurately reflects your current operational reality. This data is critical for the AI's risk-matrix calculation.
              </p>
              
              <div className="space-y-3">
                {metrics[activeModal].options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(activeModal, opt.value)}
                    className={`w-full text-left p-4 border-2 transition-all flex items-center justify-between group ${
                      metrics[activeModal].value === opt.value
                        ? "border-[#ffd800] bg-[#ffd800]/5"
                        : "border-[#022f42]/10 hover:border-[#022f42]/30 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-black text-[#022f42] uppercase tracking-wide">
                      {opt.label}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${metrics[activeModal].value === opt.value ? "text-[#ffd800]" : "text-[#022f42]/20 group-hover:text-[#022f42]/60"}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
