/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, PieChart, FileText, BarChart3,
  ShieldCheck, Eye, Target, Settings,
  Activity, Users, ChevronRight, User, Lightbulb, Swords, Package, Globe, TrendingUp, DollarSign, HeartHandshake,
  LayoutDashboard, AlertTriangle, Search, Wallet, Edit, Tally3, Flame,
  Percent, RefreshCw, Infinity, ArrowDownToLine, Clock, Folders, ListChecks, Lock, Wrench, Bot,
  UserPlus, FileSearch, Briefcase, Copyleft, MessageSquare, ShieldAlert, BookOpen, X, CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { createClient } from "@/lib/supabase/client";

// Clean, simplified gate data representing the 10 due diligence gates
const dueDiligenceGates = [
  { id: "1-problem", name: "1.1.1 Problem & Hypothesis", href: "/dashboard/audit/1-problem", icon: Lightbulb },
  { id: "2-customer", name: "1.1.2 Customer Persona", href: "/dashboard/audit/2-customer", icon: User },
  { id: "3-competitor", name: "1.1.3 Competitor Analysis", href: "/dashboard/audit/3-competitor", icon: Swords },
  { id: "4-product", name: "1.1.4 Product Readiness", href: "/dashboard/audit/4-product", icon: Package },
  { id: "5-market", name: "1.1.5 Market Opportunity", href: "/dashboard/audit/5-market", icon: Globe },
  { id: "6-pmf", name: "1.1.6 Product‑Market Fit", href: "/dashboard/audit/6-pmf", icon: TrendingUp },
  { id: "7-revenue", name: "1.1.7 Revenue Model Explorer", href: "/dashboard/audit/7-revenue", icon: DollarSign },
  { id: "8-team", name: "1.1.8 Team Composition Audit", href: "/dashboard/audit/8-team", icon: HeartHandshake },
  { id: "9-financial-snapshot", name: "1.1.9 Financial Snapshot", href: "/dashboard/audit/9-financial-snapshot", icon: DollarSign },
  { id: "10-fundraising-ask", name: "1.1.10 Fundraising Ask", href: "/dashboard/audit/10-fundraising-ask", icon: PieChart },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useUser();
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [isDataRoomModalOpen, setIsDataRoomModalOpen] = useState(false);
  const supabase = createClient();

  const isActive = (href: string) => pathname === href;

  // Query database for completed modules to feed the progress ring and checkmarks
  useEffect(() => {
    async function fetchProgress() {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from("audit_responses")
          .select("module_id")
          .eq("user_id", user.id);
        
        if (data) {
          setCompletedModules(new Set(data.map((r: any) => r.module_id)));
        }
      } catch (err) {
        console.error("Error fetching progress for sidebar:", err);
      }
    }

    fetchProgress();

    // Listen to changes in window state or interval to keep sidebar checkmarks dynamic
    const interval = setInterval(fetchProgress, 3000);
    return () => clearInterval(interval);
  }, [user, supabase]);

  const completedCount = completedModules.size;
  const percentage = Math.round((completedCount / 10) * 100);

  // SVG Progress Ring calculations
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <aside className="w-64 bg-[#022f42] border-r border-[#1b4f68] hidden md:flex flex-col flex-shrink-0 min-h-screen sticky top-0 z-40 select-none">
      
      {/* ─── LOGO & BRANDING ─────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4 border-b border-[#1b4f68]/40">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 bg-[#ffd800] flex items-center justify-center rounded-sm transition-all group-hover:scale-105">
            <Zap className="text-[#022f42] fill-[#022f42]" size={15} />
          </div>
          <span className="text-white font-black text-sm uppercase tracking-[0.2em]">FundabilityOS</span>
        </Link>
      </div>

      {/* ─── DYNAMIC PROGRESS BLOCK ──────────────────────────────────────────── */}
      <div className="p-4 mx-4 my-4 bg-white/3 border border-[#1b4f68]/50 rounded-sm shadow-inner flex items-center gap-4">
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="4"
            />
            {/* Foreground progress circle */}
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="transparent"
              stroke="#ffd800"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-black text-white">{completedCount}</span>
            <span className="text-[7px] font-bold text-[#b0d0e0]/50 uppercase">/ 10</span>
          </div>
        </div>
        <div>
          <h4 className="text-[9px] font-black uppercase tracking-widest text-[#ffd800]">Platform Readiness</h4>
          <p className="text-[10px] text-white/70 font-bold uppercase mt-0.5">{percentage}% Completed</p>
          <p className="text-[8px] text-[#b0d0e0]/40 font-medium uppercase mt-0.5">{10 - completedCount} gates left</p>
        </div>
      </div>

      {/* ─── NAVIGATION SCROLL AREA ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">
        
        {/* SECTION 1: CORE GATES */}
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-sm transition-all text-xs font-black uppercase tracking-wider mb-2 ${
              isActive("/dashboard")
                ? "bg-[#1b4f68] text-[#ffd800]"
                : "text-white/80 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutDashboard size={14} className={isActive("/dashboard") ? "text-[#ffd800]" : "text-white/40"} />
            Dashboard Overview
          </Link>

          <div className="pl-2 border-l border-[#1b4f68]/40 ml-1.5 space-y-0.5">
            {dueDiligenceGates.map((gate) => {
              const active = isActive(gate.href);
              const completed = completedModules.has(gate.id);
              return (
                <Link
                  key={gate.id}
                  href={gate.href}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-sm transition-all text-[11px] group ${
                    active
                      ? "bg-[#1b4f68]/80 text-[#ffd800] font-black"
                      : "text-white/60 hover:text-white hover:bg-white/3"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <gate.icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-[#ffd800]" : "text-white/30 group-hover:text-white/60"}`} />
                    <span className="truncate">{gate.name}</span>
                  </div>
                  {completed && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* SEPARATOR */}
        <div className="border-t border-[#1b4f68]/30 my-2" />

        {/* SECTION 2: REPORTS */}
        <div className="space-y-1">
          <span className="px-3 text-[9px] font-black text-[#b0d0e0]/40 uppercase tracking-widest block mb-1">Reports</span>
          <Link
            href="/dashboard/report"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-sm transition-all text-xs font-black uppercase tracking-wider ${
              isActive("/dashboard/report")
                ? "bg-[#1b4f68] text-[#ffd800]"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileText size={14} className={isActive("/dashboard/report") ? "text-[#ffd800]" : "text-white/30"} />
            Generate & View Reports
          </Link>
        </div>

        {/* SEPARATOR */}
        <div className="border-t border-[#1b4f68]/30 my-2" />

        {/* SECTION 3: PREMIUM TOOLS */}
        <div className="space-y-1">
          <button
            onClick={() => setIsDataRoomModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-sm transition-all text-xs font-black uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 text-left group"
          >
            <div className="flex items-center gap-2.5">
              <Lock size={14} className="text-[#ffd800]" />
              <span className="text-[#ffd800]">Data Room Accelerator</span>
            </div>
            <span className="text-[8px] font-black bg-[#ffd800]/10 text-[#ffd800] px-1 py-0.5 rounded-sm shrink-0">🔒 PRO</span>
          </button>
        </div>

      </div>

      {/* ─── SIDEBAR FOOTER (SETTINGS & LOGOUT) ──────────────────────────────── */}
      <div className="p-4 border-t border-[#1b4f68]/40 space-y-2 mt-auto bg-black/10">
        
        {/* Support & Settings Links */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors rounded-sm flex-1 ${
              isActive("/dashboard/settings")
                ? "bg-[#1b4f68] text-[#ffd800]"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings size={13} />
            Settings
          </Link>
        </div>

        {/* Logout Secure Session */}
        <button
          onClick={async () => {
            await signOut();
            window.location.href = "/login";
          }}
          className="w-full bg-[#1b4f68]/20 hover:bg-red-500/10 hover:text-red-400 text-white/50 transition-colors border border-white/5 rounded-sm py-2 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest"
        >
          Logout Secure Session
        </button>
      </div>

      {/* ─── DATA ROOM PRO MODAL OVERLAY ──────────────────────────────────────── */}
      {isDataRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#022f42]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#022f42] border-2 border-[#1b4f68] w-full max-w-md relative p-8 shadow-2xl text-center">
            
            <button
              onClick={() => setIsDataRoomModalOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white p-1 hover:bg-white/5 transition-all"
            >
              <X size={20} />
            </button>

            <div className="w-14 h-14 bg-[#ffd800]/10 border-2 border-[#ffd800] rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={24} className="text-[#ffd800]" />
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
              Data Room Accelerator 🔒
            </h3>
            
            <p className="text-[10px] font-black text-[#ffd800] uppercase tracking-widest mb-4">
              Premium Feature — Coming Soon
            </p>

            <p className="text-xs text-[#b0d0e0] leading-relaxed mb-6 uppercase tracking-tight">
              Securely compile, clean, and organize all corporate documents, customer contracts, and IP registries in one centralized VC-ready data room, fully verified by the FundabilityOS smart-engine.
            </p>

            <button
              onClick={() => setIsDataRoomModalOpen(false)}
              className="w-full bg-[#ffd800] hover:bg-[#ffd800]/90 text-[#022f42] transition-colors rounded-sm py-3 text-xs font-black uppercase tracking-widest"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
