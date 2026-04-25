/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useUser } from "@clerk/nextjs";
import { 
  Zap, Users, TrendingUp, ShieldCheck, 
  ArrowUpRight, MessageSquare, Filter, Search,
  Radar, BarChart3, Globe, Clock, X
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function InvestorDashboard() {
  const { user } = useUser();
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadDealFlow() {
      // Mock deal flow for V1 - curated startups > 75 score
      // In production, we query the 'reports' table joined with 'profiles'
      setTimeout(() => {
        setStartups([
          { 
            id: "s1", 
            name: "HyperScale AI", 
            score: 92, 
            sector: "AI Infrastructure", 
            stage: "Seed", 
            highlight: "85% Gross Margin • 120% YoY Growth",
            lastCheck: "2h ago",
            integrations: ["plaid", "linkedin"]
          },
          { 
            id: "s2", 
            name: "Lumina Fintech", 
            score: 88, 
            sector: "Payments", 
            stage: "Series A", 
            highlight: "RM 2.4M ARR • Verified Transaction Ledger",
            lastCheck: "5h ago",
            integrations: ["plaid"]
          },
          { 
            id: "s3", 
            name: "EcoGraph", 
            score: 81, 
            sector: "SaaS / Climate", 
            stage: "Pre-Seed", 
            highlight: "Founding team from Google/Grab • $0.4M raised",
            lastCheck: "1d ago",
            integrations: ["linkedin"]
          }
        ]);
        setLoading(false);
      }, 1000);
    }
    loadDealFlow();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#fcfdfd] flex items-center justify-center">
       <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-[#022f42] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#022f42]">Synchronizing Deal Flow...</p>
       </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-10 pb-32">
      {/* Institutional Header */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <div className="inline-block bg-[#022f42] text-[#ffd800] font-black px-4 py-1 mb-5 text-[10px] uppercase tracking-[0.3em] rounded-sm">
            Investor Command Center
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-[#022f42] tracking-tighter mb-4">
             CURATED DEAL FLOW <span className="text-[#ffd800]">v4.0</span>
          </h1>
          <p className="text-sm text-[#1e4a62] font-medium max-w-2xl opacity-80 uppercase tracking-widest leading-relaxed">
            Real-time access to high-conviction startups. All entities displayed have passed the 75-point physical verification audit.
          </p>
        </div>

        <div className="flex bg-white border border-[#1e4a62]/10 rounded-sm shadow-xl overflow-hidden shrink-0">
           <div className="px-6 py-4 bg-[#f2f6fa] border-r border-[#1e4a62]/10">
              <div className="text-[10px] font-black text-[#1e4a62] uppercase tracking-widest mb-1">Active Pipeline</div>
              <div className="text-2xl font-black text-[#022f42]">12 Startups</div>
           </div>
           <div className="px-6 py-4 bg-white">
              <div className="text-[10px] font-black text-[#1e4a62] uppercase tracking-widest mb-1">Avg Score</div>
              <div className="text-2xl font-black text-[#022f42] flex items-center">
                 84.2<TrendingUp className="w-4 h-4 ml-2 text-emerald-500" />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Left Sidebar: Filters */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white p-8 border border-[#1e4a62]/10 rounded-sm shadow-sm">
              <h3 className="text-xs font-black text-[#022f42] uppercase tracking-widest mb-6 flex items-center justify-between">
                Signal Thresholds <Filter className="w-3 h-3 text-[#ffd800]" />
              </h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[9px] font-black text-[#1e4a62]/60 uppercase tracking-widest mb-4 block">Minimum Fundability Score</label>
                    <input type="range" min="75" max="100" defaultValue="75" className="w-full h-1.5 bg-[#f2f6fa] rounded-full appearance-none accent-[#022f42] cursor-pointer" />
                    <div className="flex justify-between mt-2 text-[10px] font-black text-[#022f42]">
                       <span>75</span>
                       <span>100</span>
                    </div>
                 </div>
                 
                 <div className="pt-4 border-t border-gray-50">
                    <label className="text-[9px] font-black text-[#1e4a62]/60 uppercase tracking-widest mb-4 block">Verification Level</label>
                    <div className="space-y-3">
                       {['Institutional Grade', 'Plaid Verified', 'Identity Cleared'].map((lvl) => (
                         <label key={lvl} className="flex items-center gap-3 cursor-pointer group">
                            <div className="w-4 h-4 border-2 border-[#1e4a62]/20 group-hover:border-[#022f42] transition-colors rounded-sm flex items-center justify-center">
                               <div className="w-2 h-2 bg-[#ffd800] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <span className="text-[11px] font-bold text-[#1e4a62]">{lvl}</span>
                         </label>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-[#022f42] p-8 text-white rounded-sm shadow-2xl relative overflow-hidden group">
              <Radar className="absolute -bottom-10 -right-10 w-40 h-40 text-white opacity-5 group-hover:rotate-45 transition-transform duration-1000" />
              <h3 className="text-[10px] font-black text-[#ffd800] uppercase tracking-widest mb-4">Predictive Pulse</h3>
              <p className="text-xs text-[#b0d0e0] leading-relaxed font-medium mb-6">
                Analyzing 4.2k daily data points from connected startup ledger stacks.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black text-white hover:text-[#ffd800] cursor-pointer transition-colors group/link">
                 Advanced Analytics <ArrowUpRight className="w-3 h-3 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
              </div>
           </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-black text-[#022f42] uppercase tracking-[0.2em] flex items-center">
                High-Conviction Pipeline
              </h2>
              <div className="flex items-center gap-4 text-[10px] font-bold text-[#1e4a62]">
                 <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Live Sync Active</span>
                 <Search className="w-4 h-4 cursor-pointer hover:text-[#022f42]" />
              </div>
           </div>

           {startups.map((s) => (
             <div key={s.id} className="bg-white border border-[#1e4a62]/10 p-8 rounded-sm shadow-[0_10px_30px_-15px_rgba(2,47,66,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(2,47,66,0.1)] transition-all flex flex-col md:flex-row gap-8 items-start group relative">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-3 bg-white border border-gray-100 hover:bg-rose-50 hover:text-rose-500 transition-all rounded-sm shadow-sm" title="Mark as Pass (Feed feedback Loop)">
                      <X className="w-4 h-4" />
                   </button>
                </div>

                <div className="w-full md:w-32 h-32 bg-[#f2f6fa] rounded-sm flex items-center justify-center relative shrink-0">
                   <BarChart3 className="w-8 h-8 text-[#1e4a62]/20" />
                   <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#022f42] border-4 border-white flex items-center justify-center rounded-sm shadow-xl z-10">
                      <span className="text-xs font-black text-white">{s.score}</span>
                   </div>
                </div>

                <div className="flex-1 space-y-4">
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="text-2xl font-black text-[#022f42] tracking-tighter group-hover:text-[#1e4a62] transition-colors">{s.name}</h3>
                         <p className="text-[10px] font-black uppercase tracking-widest text-[#ffd800] mt-1 flex items-center gap-2">
                            {s.sector} <span className="text-[#1e4a62]/20">/</span> {s.stage}
                         </p>
                      </div>
                      <div className="flex gap-2">
                         {s.integrations.includes('plaid') && <ShieldCheck className="w-4 h-4 text-emerald-500" aria-label="Cash Verified" />}
                         {s.integrations.includes('linkedin') && <Globe className="w-4 h-4 text-emerald-500" aria-label="Team Verified" />}
                      </div>
                   </div>

                   <p className="text-sm text-[#1e4a62] font-semibold leading-relaxed line-clamp-2">
                      {s.highlight}
                   </p>

                   <div className="pt-6 flex flex-wrap items-center gap-4 border-t border-gray-50 text-[10px] font-black uppercase tracking-widest">
                      <button className="px-6 py-3 bg-[#022f42] text-white hover:bg-[#ffd800] hover:text-[#022f42] transition-all flex items-center gap-2 rounded-sm shadow-md active:scale-95">
                         Secure Deal Room <ArrowUpRight className="w-3 h-3" />
                      </button>
                      <button className="px-6 py-3 bg-white border border-[#1e4a62]/20 text-[#022f42] hover:border-[#022f42] transition-all flex items-center gap-2 rounded-sm active:scale-95">
                         Message Founder <MessageSquare className="w-3 h-3 text-[#ffd800]" />
                      </button>
                      <span className="text-[#1e4a62]/40 ml-auto">Updated {s.lastCheck}</span>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
