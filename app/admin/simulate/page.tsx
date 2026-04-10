"use client";

import { useState, useEffect } from "react";
import { 
  Zap, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  BarChart,
  Target
} from "lucide-react";

export default function SimulationConsole() {
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoCruise, setIsAutoCruise] = useState(false);
  const [progress, setProgress] = useState(1240); // Mock current progress
  const [totalTarget] = useState(10000);
  const [latestResults, setLatestResults] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
    addLog(isRunning ? "Simulation suspended by admin." : "Initiating calibration batch...");
  };

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#022f42] uppercase tracking-tighter">Simulation Console</h2>
          <p className="text-sm font-medium text-[#022f42]/50 mt-1">Autonomous 10,000-profile stress-test and logic calibration.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#022f42]/10 rounded-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">Auto-Cruise</span>
              <button 
                onClick={() => {
                   setIsAutoCruise(!isAutoCruise);
                   addLog(isAutoCruise ? "Cruise Control disabled." : "Cruise Control enabled (100 profiles/hr).");
                }}
                className={`w-12 h-6 rounded-full relative transition-colors ${isAutoCruise ? 'bg-emerald-500' : 'bg-gray-200'}`}
              >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAutoCruise ? 'left-7' : 'left-1'}`} />
              </button>
           </div>
           <button 
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${
              isRunning 
              ? 'bg-rose-500 text-white shadow-rose-500/20' 
              : 'bg-[#ffd800] text-[#022f42] shadow-[#ffd800]/20 hover:scale-[1.02]'
            }`}
           >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? "Stop Simulation" : "Start Next Batch"}
           </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-[#022f42] p-10 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-40 h-40 text-white" />
         </div>
         
         <div className="relative z-10 max-w-2xl">
            <div className="flex justify-between items-end mb-4">
               <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#ffd800] mb-1">Total Engine Calibration Progress</div>
                  <div className="text-5xl font-black text-white">{( (progress / totalTarget) * 100 ).toFixed(1)}%</div>
               </div>
               <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Target</div>
                  <div className="text-2xl font-black text-white">{progress.toLocaleString()} <span className="text-white/20">/ {totalTarget.toLocaleString()}</span></div>
               </div>
            </div>
            
            <div className="h-4 bg-black/20 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-gradient-to-r from-[#ffd800] to-[#ffff00] transition-all duration-1000"
                 style={{ width: `${(progress/totalTarget)*100}%` }}
               />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Live Calibration Log */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#022f42]/5 shadow-sm p-6">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                     <Activity className="w-4 h-4 text-[#022f42]" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Live Output Stream</h3>
                  </div>
                  <span className="text-[9px] font-bold text-[#022f42]/30 uppercase">Node: Calibration-Alpha-9</span>
               </div>
               
               <div className="bg-gray-50 p-6 font-mono text-[11px] space-y-2 h-[300px] overflow-y-auto">
                  {logs.map((log, i) => (
                    <div key={i} className="text-[#022f42]/70 leading-relaxed border-b border-gray-100 pb-1">
                      {log}
                    </div>
                  ))}
                  <div className="text-emerald-600 animate-pulse">
                     {isRunning ? "> Processing synthetic batch #15..." : "> Idle. Waiting for trigger."}
                  </div>
               </div>
            </div>

            {/* Batch Status */}
            <div className="grid grid-cols-2 gap-6">
               <div className="bg-white p-6 border border-[#022f42]/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                     <Target className="w-4 h-4 text-emerald-500" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Accuracy Precision</span>
                  </div>
                  <div className="text-3xl font-black text-[#022f42]">96.8%</div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase mt-1">+0.4% from last batch</div>
               </div>
               <div className="bg-white p-6 border border-[#022f42]/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                     <AlertTriangle className="w-4 h-4 text-amber-500" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Bias Drift Detected</span>
                  </div>
                  <div className="text-3xl font-black text-[#022f42]">4</div>
                  <div className="text-[10px] font-bold text-amber-600 uppercase mt-1">Pending Calibration</div>
               </div>
            </div>
         </div>

         {/* Sidebar Controls */}
         <div className="space-y-6">
            <div className="bg-white p-8 border border-[#022f42]/5 shadow-xl">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-[#022f42] mb-6">Simulation Settings</h3>
               
               <div className="space-y-6">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 block mb-2">Batch Density</label>
                    <select className="w-full bg-gray-50 border-none p-4 text-xs font-black uppercase tracking-widest text-[#022f42] outline-none">
                       <option>10 Profiles / Batch</option>
                       <option>50 Profiles / Batch</option>
                       <option selected>100 Profiles / Batch</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/40 block mb-2">Engine Stress Level</label>
                    <div className="flex items-center gap-2">
                       <div className="h-1 bg-[#ffd800] flex-1 rounded-full" />
                       <div className="h-1 bg-[#ffd800] flex-1 rounded-full" />
                       <div className="h-1 bg-gray-200 flex-1 rounded-full" />
                       <span className="text-[10px] font-black ml-2">High</span>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 p-4 bg-gray-100 text-[10px] font-black uppercase tracking-widest text-[#022f42]/60 hover:bg-gray-200 transition-all">
                     <RotateCcw className="w-4 h-4" /> Reset Calibration Data
                  </button>
               </div>
            </div>

            <div className="bg-gradient-to-br from-[#022f42] to-[#044a69] p-8 text-white shadow-xl">
               <BarChart className="w-8 h-8 text-[#ffd800] mb-4" />
               <h3 className="text-sm font-black uppercase tracking-tight mb-2">Why Simulation?</h3>
               <p className="text-[10px] font-medium text-white/60 leading-relaxed uppercase tracking-widest">
                  Autonomous stress-testing ensures your institutional diagnostic logic remains sharp, even without real user data. Every simulation identifies potential logic drift.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
