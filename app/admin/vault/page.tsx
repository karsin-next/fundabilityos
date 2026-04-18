"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Globe, 
  Plus, 
  MapPin, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Database,
  Trash2,
  Edit3,
  Search,
  ChevronRight,
  X,
  Check
} from "lucide-react";

interface Benchmark {
  id: string;
  name: string;
  region: string;
  sector: string;
  target_stage: string;
  metrics: {
    monthly_revenue: number;
    team_size: number;
    runway_months: number;
    target_raise: number;
    market_size: string;
  };
  expected_score: number;
  rationale: string;
}

export default function PatternVaultPage() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    region: "SE Asia",
    sector: "SaaS",
    target_stage: "Seed",
    expected_score: 75,
    rationale: "",
    metrics: {
      monthly_revenue: 0,
      team_size: 1,
      runway_months: 12,
      target_raise: 0,
      market_size: "Regional"
    }
  });

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  async function fetchBenchmarks() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/benchmarks");
      if (res.ok) {
        const data = await res.json();
        setBenchmarks(data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddBenchmark(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/benchmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchBenchmarks();
        setFormData({
            name: "",
            region: "SE Asia",
            sector: "SaaS",
            target_stage: "Seed",
            expected_score: 75,
            rationale: "",
            metrics: {
              monthly_revenue: 0,
              team_size: 1,
              runway_months: 12,
              target_raise: 0,
              market_size: "Regional"
            }
        });
      }
    } catch (err) {
      alert("Failed to add benchmark");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this golden benchmark profile?")) return;
    try {
      const res = await fetch("/api/admin/benchmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchBenchmarks();
    } catch (err) {
      alert("Failed to delete benchmark");
    }
  }

  const regions = ["All", "US", "SE Asia", "Europe", "Middle East", "Global"];
  
  const filteredBenchmarks = activeRegion === "All" 
    ? benchmarks 
    : benchmarks.filter((b: Benchmark) => b.region === activeRegion);

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-[#022f42] uppercase tracking-tighter">Pattern Vault</h2>
          <p className="text-sm font-medium text-[#022f42]/50 mt-1">Manage institutional 'Golden Profiles' and regional benchmark anchors.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-8 py-4 bg-[#022f42] text-[#ffd800] text-[10px] font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-all shadow-xl"
        >
           <Plus className="w-4 h-4" /> Add Golden Benchmark
        </button>
      </div>

      {/* Regional Filter Bar */}
      <div className="flex flex-wrap gap-2">
         {regions.map(region => (
           <button
             key={region}
             onClick={() => setActiveRegion(region)}
             className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest border transition-all ${
               activeRegion === region 
               ? "bg-[#022f42] text-[#ffd800] border-[#022f42]" 
               : "bg-white text-[#022f42]/40 border-[#022f42]/5 hover:border-[#022f42]/20"
             }`}
           >
             {region === "All" ? <Globe className="w-3.5 h-3.5 mb-0.5 inline-block mr-1" /> : <MapPin className="w-3.5 h-3.5 mb-0.5 inline-block mr-1" />}
             {region}
           </button>
         ))}
      </div>

      {/* Benchmarks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-64 bg-white animate-pulse" />)
        ) : filteredBenchmarks.length === 0 ? (
          <div className="col-span-full p-20 bg-white border border-dashed border-[#022f42]/10 text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8 text-[#022f42]/10" />
             </div>
             <h4 className="text-lg font-black text-[#022f42] uppercase tracking-tighter">No Benchmarks in {activeRegion}</h4>
             <p className="text-xs font-medium text-[#022f42]/40 mt-2">Create your first 'Golden Profile' to lock in localized institutional standards.</p>
          </div>
        ) : filteredBenchmarks.map((b) => (
          <div key={b.id} className="bg-white border border-[#022f42]/5 shadow-xl group overflow-hidden">
            <div className="p-6 border-b border-[#022f42]/5 bg-gray-50/50 flex justify-between items-start">
               <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mb-1">{b.region} • {b.sector}</div>
                  <h3 className="text-lg font-black text-[#022f42] uppercase tracking-tighter">{b.name}</h3>
               </div>
               <div className="text-right">
                  <div className="text-[9px] font-black text-[#022f42]/40 uppercase tracking-widest mb-1">Target Score</div>
                  <div className="text-2xl font-black text-[#022f42]">{b.expected_score}<span className="text-[10px] text-[#022f42]/20">/100</span></div>
               </div>
            </div>
            
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div className="flex items-center gap-3">
                     <DollarSign className="w-4 h-4 text-[#ffd800]" />
                     <div>
                        <div className="text-[9px] font-bold text-[#022f42]/30 uppercase tracking-widest">MRR</div>
                        <div className="text-xs font-black text-[#022f42]">${b.metrics.monthly_revenue.toLocaleString()}</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <Users className="w-4 h-4 text-[#ffd800]" />
                     <div>
                        <div className="text-[9px] font-bold text-[#022f42]/30 uppercase tracking-widest">Team Size</div>
                        <div className="text-xs font-black text-[#022f42]">{b.metrics.team_size} Founders</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <TrendingUp className="w-4 h-4 text-[#ffd800]" />
                     <div>
                        <div className="text-[9px] font-bold text-[#022f42]/30 uppercase tracking-widest">Target Raise</div>
                        <div className="text-xs font-black text-[#022f42]">${b.metrics.target_raise.toLocaleString()}</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <Globe className="w-4 h-4 text-[#ffd800]" />
                     <div>
                        <div className="text-[9px] font-bold text-[#022f42]/30 uppercase tracking-widest">Stage</div>
                        <div className="text-xs font-black text-[#022f42]">{b.target_stage}</div>
                     </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-[#022f42]/5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 mb-2">Rationale</div>
                  <p className="text-[11px] font-medium text-[#022f42]/60 line-clamp-3 leading-relaxed">
                    {b.rationale}
                  </p>
               </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-[#022f42]/5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="flex gap-2">
                 <button className="p-2 hover:bg-white rounded-sm text-[#022f42]/40 hover:text-[#022f42] shadow-sm transition-all"><Edit3 className="w-4 h-4" /></button>
                 <button 
                  onClick={() => handleDelete(b.id)}
                  className="p-2 hover:bg-white rounded-sm text-[#022f42]/40 hover:text-red-600 shadow-sm transition-all text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
               </div>
               <button className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#022f42] hover:text-[#ffd800] transition-colors">
                  Run simulation benchmarks <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#022f42]/90 backdrop-blur-sm shadow-2xl overflow-y-auto">
          <div className="bg-[#f2f6fa] w-full max-w-4xl shadow-2xl border border-white/20 relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-2 text-[#022f42]/20 hover:text-[#022f42] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-10 border-b border-[#022f42]/5 flex items-center gap-4">
               <div className="w-1.5 h-10 bg-[#ffd800]" />
               <div>
                 <h2 className="text-2xl font-black text-[#022f42] uppercase tracking-tighter">New Golden Benchmark</h2>
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mt-1">Institutional Anchor Profile Creation</p>
               </div>
            </div>

            <form onSubmit={handleAddBenchmark} className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 ml-1">Profile Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. SG Fintech Seed Anchor"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white border border-[#022f42]/5 p-4 text-xs font-black uppercase tracking-widest text-[#022f42] focus:border-[#ffd800] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 ml-1">Region</label>
                       <select 
                        value={formData.region}
                        onChange={e => setFormData({...formData, region: e.target.value})}
                        className="w-full bg-white border border-[#022f42]/5 p-4 text-xs font-black uppercase tracking-widest text-[#022f42] focus:border-[#ffd800] outline-none"
                       >
                         {regions.filter(r => r !== "All").map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 ml-1">Target Stage</label>
                       <select 
                        value={formData.target_stage}
                        onChange={e => setFormData({...formData, target_stage: e.target.value})}
                        className="w-full bg-white border border-[#022f42]/5 p-4 text-xs font-black uppercase tracking-widest text-[#022f42] focus:border-[#ffd800] outline-none"
                       >
                         {["Pre-Seed", "Seed", "Series A", "Series B"].map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 ml-1">Rationale</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Why is this profile investor ready?"
                      value={formData.rationale}
                      onChange={e => setFormData({...formData, rationale: e.target.value})}
                      className="w-full bg-white border border-[#022f42]/5 p-4 text-xs font-medium text-[#022f42] focus:border-[#ffd800] outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-6">
                   <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 mb-4 px-1">Institutional Metrics</div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/30">Monthly Revenue ($)</label>
                        <input 
                          type="number"
                          value={formData.metrics.monthly_revenue}
                          onChange={e => setFormData({...formData, metrics: {...formData.metrics, monthly_revenue: parseInt(e.target.value) || 0}})}
                          className="w-full bg-white border border-[#022f42]/5 p-4 text-xs font-black text-[#022f42] focus:border-[#ffd800] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/30">Runway (Months)</label>
                        <input 
                          type="number"
                          value={formData.metrics.runway_months}
                          onChange={e => setFormData({...formData, metrics: {...formData.metrics, runway_months: parseInt(e.target.value) || 0}})}
                          className="w-full bg-white border border-[#022f42]/5 p-4 text-xs font-black text-[#022f42] focus:border-[#ffd800] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/30">Founders</label>
                        <input 
                          type="number"
                          value={formData.metrics.team_size}
                          onChange={e => setFormData({...formData, metrics: {...formData.metrics, team_size: parseInt(e.target.value) || 0}})}
                          className="w-full bg-white border border-[#022f42]/5 p-4 text-xs font-black text-[#022f42] focus:border-[#ffd800] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/30">Target Raise ($M)</label>
                        <input 
                          type="number"
                          step="0.1"
                          value={formData.metrics.target_raise / 1000000}
                          onChange={e => setFormData({...formData, metrics: {...formData.metrics, target_raise: (parseFloat(e.target.value) || 0) * 1000000}})}
                          className="w-full bg-white border border-[#022f42]/5 p-4 text-xs font-black text-[#022f42] focus:border-[#ffd800] outline-none"
                        />
                      </div>
                   </div>
                   <div className="bg-[#022f42] p-8 text-center shadow-xl border border-white/5">
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Target Resulting Score</div>
                      <div className="flex items-center justify-center gap-6">
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={formData.expected_score}
                          onChange={e => setFormData({...formData, expected_score: parseInt(e.target.value)})}
                          className="flex-1 accent-[#ffd800]"
                        />
                        <span className="text-4xl font-black text-[#ffd800] w-16">{formData.expected_score}</span>
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-10 border-t border-[#022f42]/5">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 hover:text-[#022f42] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-12 py-5 bg-[#022f42] text-[#ffd800] text-[10px] font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-all shadow-2xl disabled:opacity-50 flex items-center gap-2"
                >
                   {saving ? <div className="w-4 h-4 border-2 border-[#ffd800]/20 border-t-[#ffd800] rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                   {saving ? "Deploying Anchor..." : "Deploy Anchor Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
