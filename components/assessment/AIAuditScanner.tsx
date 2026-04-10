"use client";

import { useState, useCallback, useEffect } from "react";
import { UploadCloud, FileText, Cpu, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export function AIAuditScanner({ onComplete }: { onComplete?: () => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [scanStatus, setScanStatus] = useState<"IDLE" | "SCANNING" | "COMPLETE">("IDLE");
  const [progress, setProgress] = useState(0);
  const [metricsExtracted, setMetricsExtracted] = useState<string[]>([]);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const processFile = useCallback((file: File) => {
    setFile(file);
    setScanStatus("SCANNING");
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    if (scanStatus === "SCANNING") {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => setScanStatus("COMPLETE"), 500);
            return 100;
          }
          return p + 2;
        });
      }, 50);

      const metricsList = [
        "Identified: B2B SaaS Model",
        "Extracted: TAM = $4.2B",
        "Calculated: LTV:CAC = 3.4x",
        "Found: Customer Churn = 4%",
        "Located: Pitch Deck Problem Statement",
        "Correlating: 360° Benchmark Index...",
      ];

      metricsList.forEach((m, idx) => {
        setTimeout(() => setMetricsExtracted(prev => [...prev, m]), idx * 800);
      });

      return () => clearInterval(interval);
    }
  }, [scanStatus]);

  useEffect(() => {
    if (scanStatus === "COMPLETE") {
      // Auto-trigger onComplete after a brief visual confirmation
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [scanStatus, onComplete]);



  return (
    <div 
      className={`border-4 border-dashed rounded-sm transition-all duration-300 relative overflow-hidden ${dragActive ? 'border-[#ffd800] bg-[#fffdef]' : 'border-[#022f42]/10 bg-white'}`}
      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
    >
      <div className="p-8 md:p-14 flex flex-col items-center justify-center text-center min-h-[400px]">
        {scanStatus === "IDLE" && (
          <div className="flex flex-col items-center transition-opacity animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-white shadow-2xl rounded-sm flex items-center justify-center mb-8 border border-gray-100 border-b-4 border-[#022f42]">
              <Cpu className="w-10 h-10 text-[#022f42]" />
            </div>
            <h3 className="text-2xl font-black text-[#022f42] tracking-tighter mb-3 uppercase">Institutional Neural Scanner</h3>
            <p className="text-sm font-medium text-gray-400 mb-10 max-w-sm leading-relaxed">
              Drop your Pitch Deck or Financial Model. Our V4 engine will extract 40+ investor metrics and populate your 8 core diagnostics instantly.
            </p>
            <label className="cursor-pointer bg-[#022f42] text-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-[#1b4f68] transition-all shadow-xl flex items-center gap-3">
              <UploadCloud className="w-5 h-5"/> Initialize Scan
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
            </label>
          </div>
        )}

        {(scanStatus === "SCANNING" || scanStatus === "COMPLETE") && (
          <div className="w-full max-w-lg relative transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* File Info Bar (The Preview) */}
            <div className="flex items-center gap-4 bg-white border border-[#022f42]/10 p-4 rounded-sm mb-6 shadow-sm text-left">
              <div className="w-10 h-10 bg-[#f2f6fa] rounded-sm flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-[#022f42]" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-black uppercase text-[#022f42] truncate">{file?.name}</div>
                <div className="text-[9px] font-bold text-gray-400">{(file?.size || 0) / 1024 > 1024 ? ((file?.size || 0) / (1024 * 1024)).toFixed(2) + ' MB' : ((file?.size || 0) / 1024).toFixed(0) + ' KB'} • PDF Document</div>
              </div>
              <div className="ml-auto">
                 {scanStatus === 'COMPLETE' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 border-2 border-[#ffd800] border-t-transparent rounded-full animate-spin" />}
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${scanStatus === 'COMPLETE' ? 'bg-emerald-500' : 'bg-[#ffd800] animate-pulse'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">
                    {scanStatus === 'COMPLETE' ? 'Extraction Verified' : 'A.I. Diagnostic Processing'}
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{progress}%</span>
              </div>
              
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-8">
                <div className={`h-full transition-all duration-300 ${scanStatus === 'COMPLETE' ? 'bg-emerald-500' : 'bg-[#022f42]'}`} style={{ width: `${progress}%` }} />
              </div>

              {/* Console Preview Area */}
              <div className="bg-[#022f42] text-[#ffd800] p-6 rounded-sm font-mono text-[10px] text-left h-48 overflow-y-auto shadow-inner border border-white/10 transition-all duration-500">
                <p className="mb-2 text-[#90cdf4]">{'// Initiating Institutional Audit Protocol...'}</p>
                <p className="mb-2 text-[#90cdf4]/60 italic">{`> Analyzing: ${file?.name?.substring(0, 30)}...`}</p>
                {metricsExtracted.map((m, i) => (
                  <p key={i} className="mb-1 transition-all animate-in slide-in-from-left-2 duration-300">
                    {'>'} {m}
                  </p>
                ))}
                {scanStatus === "COMPLETE" && (
                  <p className="mt-4 text-emerald-400 font-bold animate-pulse">
                    [SUCCESS] Full Alpha Report ready for sync.
                  </p>
                )}
              </div>


            </div>
          </div>
        )}
      </div>
    </div>
  );
}
