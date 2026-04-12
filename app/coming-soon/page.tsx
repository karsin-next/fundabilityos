"use client";

import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-[#022f42] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 mt-16 animate-fade-in-up">
        <div className="max-w-[500px] w-full text-center relative">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#ffd800] opacity-5 rounded-full blur-[100px] -z-10 pointer-events-none" />

          <div className="w-20 h-20 bg-[#ffd800]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#ffd800]/20 shadow-[0_0_20px_rgba(255,216,0,0.15)]">
            <Clock className="w-10 h-10 text-[#ffd800]" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">
            Coming <span className="text-[#ffd800]">Soon</span>.
          </h1>
          
          <p className="text-white/70 text-lg leading-relaxed mb-6 font-medium">
            The full 8-dimension diagnostic system is currently in final testing.
          </p>
          
          <div className="bg-[#ffd800]/5 border border-[#ffd800]/20 rounded-lg p-6 mb-10">
            <p className="text-[#ffd800] text-sm font-black uppercase tracking-widest leading-relaxed">
              We have securely logged your email and will notify you the moment the system goes live.
            </p>
          </div>

          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-white/50 hover:text-[#ffd800] font-black tracking-widest text-xs uppercase transition-colors"
          >
            <ArrowLeft size={16} /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
