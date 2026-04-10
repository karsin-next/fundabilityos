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
  ChevronRight
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
  const supabase = createClient();

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  async function fetchBenchmarks() {
    setLoading(true);
    const { data } = await supabase
      .from("benchmarks")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setBenchmarks(data);
    setLoading(false);
  }

  const regions = ["All", "US", "SE Asia", "Europe", "Middle East", "Global"];
  
  const filteredBenchmarks = activeRegion === "All" 
    ? benchmarks 
    : benchmarks.filter(b => b.region === activeRegion);

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-[#022f42] uppercase tracking-tighter">Pattern Vault</h2>
          <p className="text-sm font-medium text-[#022f42]/50 mt-1">Manage institutional 'Golden Profiles' and regional benchmark anchors.</p>
        </div>
        <button className="flex items-center gap-2 px-8 py-4 bg-[#022f42] text-[#ffd800] text-[10px] font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-all shadow-xl">
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
                 <button className="p-2 hover:bg-white rounded-sm text-[#022f42]/40 hover:text-red-600 shadow-sm transition-all"><Trash2 className="w-4 h-4" /></button>
               </div>
               <button className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#022f42] hover:text-[#ffd800] transition-colors">
                  Run simulation benchmarks <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
