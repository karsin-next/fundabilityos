"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, PieChart, Map, FileText, BarChart3,
  CheckSquare, FolderOpen, ShieldCheck, Eye, Target, Settings,
  Calculator, Activity, Users,
  ChevronRight, User, Lightbulb, Swords, Package, Globe, TrendingUp, DollarSign, HeartHandshake,
  LineChart, LayoutDashboard, Layers, AlertTriangle, Search, Wallet, Edit, Tally3, Flame,
  Percent, RefreshCw, Infinity, ArrowDownToLine, Clock, Folders, ListChecks, Lock, Wrench, Bot,
  UserPlus, FileSearch, Briefcase, Copyleft, MessageSquare, ShieldAlert, BookOpen
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  children?: NavItem[];
  isLocked?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
  isLocked?: boolean;
}

// Full sitemap tree structure from Table 1 Methodology
const siteMap = [
  {
    label: "1. DIAGNOSE – Establish Baseline",
    items: [
      {
        name: "1.1 360° Fundability Audit",
        href: "/dashboard",
        icon: Zap,
        children: [
          { name: "1.1.1 Problem & Hypothesis", href: "/dashboard/audit/1-problem", icon: Lightbulb },
          { name: "1.1.2 Customer Persona", href: "/dashboard/audit/2-customer", icon: User },
          { name: "1.1.3 Competitor Analysis", href: "/dashboard/audit/3-competitor", icon: Swords },
          { name: "1.1.4 Product Readiness", href: "/dashboard/audit/4-product", icon: Package },
          { name: "1.1.5 Market Opportunity", href: "/dashboard/audit/5-market", icon: Globe },
          { name: "1.1.6 Product‑Market Fit & Traction", href: "/dashboard/audit/6-pmf", icon: TrendingUp },
          { name: "1.1.7 Revenue Model Explorer", href: "/dashboard/audit/7-revenue", icon: DollarSign },
          { name: "1.1.8 Team Composition Audit", href: "/dashboard/audit/8-team", icon: HeartHandshake },
        ],
      },
      {
        name: "1.2 Live Fundability Score",
        href: "/dashboard/score",
        icon: Target,
        children: [
          { name: "1.2.1 Fundability Score", href: "/dashboard/score/overview", icon: Activity },
          { name: "1.2.2 Key Criteria Breakdown", href: "/dashboard/score/breakdown", icon: Layers },
          { name: "1.2.3 Benchmark Comparison", href: "/dashboard/score/benchmark", icon: BarChart3 },
          { name: "1.2.4 Score History", href: "/dashboard/score/history", icon: LineChart },
        ],
      },
      {
        name: "1.3 Gap Analysis Report",
        href: "/dashboard/gap-report",
        icon: BarChart3,
        children: [
          { name: "1.3.1 Gap Analysis Report", href: "/dashboard/gap-report/overview", icon: FileText },
          { name: "1.3.2 Growth Benchmarks", href: "/insights", icon: BookOpen },
          { name: "1.3.3 Priority Gaps", href: "/dashboard/gap-report/top-3", icon: AlertTriangle },
          { name: "1.3.4 Gap Mitigation", href: "/dashboard/gap-report/mitigation", icon: Edit },
          { name: "1.3.5 Investor Report", href: "/dashboard/gap-report/report", icon: FileSearch },
        ],
      },
    ],
  },
  {
    label: "2. ACTIVATE – Financial Foundation",
    items: [
      {
        name: "2.1 Manual Financial Input",
        href: "/dashboard/financials",
        icon: Calculator,
        children: [
          { name: "2.1.1 Key Metrics Entry", href: "/dashboard/financials/metrics", icon: Edit },
          { name: "2.1.2 EBDAT Breakeven", href: "/dashboard/financials/breakeven", icon: Tally3 },
          { name: "2.1.3 Cash Flow Snapshot", href: "/dashboard/financials/cash-flow", icon: Wallet },
        ],
      },
      {
        name: "2.2 Investor Dashboard",
        href: "/dashboard/metrics",
        icon: LayoutDashboard,
        children: [
          { name: "2.2.1 Runway & Burn", href: "/dashboard/metrics/runway", icon: Flame },
          { name: "2.2.2 Revenue & Growth", href: "/dashboard/metrics/revenue", icon: TrendingUp },
          { name: "2.2.3 Expense Breakdown", href: "/dashboard/metrics/expenses", icon: PieChart },
        ],
      },
      {
        name: "2.3 Unit Economics",
        href: "/dashboard/unit-economics",
        icon: LineChart,
        children: [
          { name: "2.3.1 CAC Calculator", href: "/dashboard/unit-economics/cac", icon: Users },
          { name: "2.3.2 LTV Estimator", href: "/dashboard/unit-economics/ltv", icon: Infinity },
          { name: "2.3.3 Gross Margin", href: "/dashboard/unit-economics/margin", icon: Percent },
          { name: "2.3.4 Cash Conversion Cycle", href: "/dashboard/unit-economics/ccc", icon: RefreshCw },
          { name: "2.3.5 Investor Report", href: "/dashboard/unit-economics/report", icon: LayoutDashboard },
        ],
      },
      {
        name: "2.4 Fundraising Strategy Canvas",
        href: "/dashboard/strategy",
        icon: Map,
        children: [
          { name: "2.4.1 WHAT: Capital Needs", href: "/dashboard/strategy/what", icon: DollarSign },
          { name: "2.4.2 WHY: Use of Funds", href: "/dashboard/strategy/why", icon: PieChart },
          { name: "2.4.3 WHEN: Timing & Runway", href: "/dashboard/strategy/when", icon: Clock },
          { name: "2.4.4 HOW: Cash Flow Projection", href: "/dashboard/strategy/how", icon: LineChart },
          { name: "2.4.5 WHO: Investor Matching", href: "/dashboard/strategy/who", icon: Users },
          { name: "2.4.6 Fundraising Roadmap", href: "/dashboard/strategy/roadmap", icon: Map },
        ],
      },
      {
        name: "2.5 Data Room Builder",
        href: "/dashboard/data-room",
        icon: FolderOpen,
        children: [
          { name: "2.5.1 Structure Template", href: "/dashboard/data-room/structure", icon: Folders },
          { name: "2.5.2 Document Checklist", href: "/dashboard/data-room/checklist", icon: ListChecks },
          { name: "2.5.3 Investor Access Simulator", href: "/dashboard/data-room/simulator", icon: Lock },
          { name: "2.5.4 Readiness Score", href: "/dashboard/data-room/score", icon: ShieldCheck },
          { name: "2.5.5 Data Room Builder", href: "/dashboard/data-room/builder", icon: FolderOpen },
        ],
      },
    ],
  },
  {
    label: "3. ACCELERATE – Closing Gaps",
    isLocked: true,
    items: [
      {
        name: "3.1 Gap Closure Workbench",
        href: "/dashboard/workbench",
        icon: Activity,
        children: [
          { name: "3.1.1 Personalised Action Plan", href: "/dashboard/workbench/plan", icon: CheckSquare },
          { name: "3.1.2 Tool Library", href: "/dashboard/workbench/tools", icon: Wrench },
          { name: "3.1.3 AI Coach Assistant", href: "/dashboard/workbench/coach", icon: Bot },
        ],
      },
      {
        name: "3.2 Investor Targeting",
        href: "/dashboard/investors",
        icon: Target,
        children: [
          { name: "3.2.1 Investor Profile Builder", href: "/dashboard/investors/profile", icon: UserPlus },
          { name: "3.2.2 Portfolio & Competitor Check", href: "/dashboard/investors/portfolio", icon: Search },
        ],
      },
      {
        name: "3.3 Visibility & Verification",
        href: "/dashboard/visibility",
        icon: Eye,
        children: [
          { name: "3.3.1 Profile Visibility", href: "/dashboard/visibility/toggle", icon: Eye },
          { name: "3.3.2 FundabilityOS Verified Badge", href: "/dashboard/verification", icon: ShieldCheck },
        ],
      },
    ],
  },
  {
    label: "4. MASTER – Advanced Topics",
    isLocked: true,
    items: [
      {
        name: "4.1 Term Sheet Mastery",
        href: "/dashboard/term-sheet",
        icon: FileSearch,
        children: [
          { name: "4.1.1 Term Sheet Anatomy", href: "/dashboard/term-sheet/anatomy", icon: FileText },
          { name: "4.1.2 Valuation Simulator", href: "/dashboard/term-sheet/valuation", icon: Calculator },
          { name: "4.1.3 Liquidation Preference Simulator", href: "/dashboard/term-sheet/liquidation", icon: ArrowDownToLine },
          { name: "4.1.4 Anti‑Dilution Comparison", href: "/dashboard/term-sheet/anti-dilution", icon: ShieldAlert },
        ],
      },
      {
        name: "4.2 Due Diligence Simulator",
        href: "/dashboard/dd-simulator",
        icon: Search,
        children: [
          { name: "4.2.1 Legal DD Checklist", href: "/dashboard/dd-simulator/legal", icon: Briefcase },
          { name: "4.2.2 Financial DD Prep", href: "/dashboard/dd-simulator/financial", icon: PieChart },
          { name: "4.2.3 IP Audit Tool", href: "/dashboard/dd-simulator/ip", icon: Copyleft },
          { name: "4.2.4 Mock Q & A", href: "/dashboard/dd-simulator/qa", icon: MessageSquare },
        ],
      },
      {
        name: "4.3 Negotiation Playbook",
        href: "/dashboard/negotiation",
        icon: FileText,
        children: [
          { name: "4.3.1 Deal-Breaker Builder", href: "/dashboard/negotiation/deal-breakers", icon: CheckSquare },
          { name: "4.3.2 Exit Value Distribution", href: "/dashboard/negotiation/exit-value", icon: PieChart },
          { name: "4.3.3 Red Flag Identifier", href: "/dashboard/negotiation/red-flags", icon: ShieldAlert },
        ],
      },
    ],
  },
  {
    label: "Education",
    items: [
      { 
        name: "Fundability Academy", 
        href: "/academy", 
        icon: BookOpen,
        children: [
          { name: "SaaS Valuation", href: "/academy/saas-valuation-benchmarks-2026", icon: FileText },
          { name: "CAC Payback Gap", href: "/academy/cac-payback-gap-mitigation", icon: FileText },
          { name: "Investor Matching", href: "/academy/investor-matching-algorithms", icon: FileText },
        ]
      },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Company Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const isActive = (href: string) => pathname === href;
  const isAnyChildActive = (children?: { href: string }[]) =>
    children?.some(c => pathname === c.href) ?? false;

  // Set initial expanded section based on pathname
  useEffect(() => {
    const activeSection = siteMap.find(section => 
      section.items.some(item => 
        isActive(item.href) || isAnyChildActive(item.children)
      )
    );
    if (activeSection) {
      setExpandedSection(activeSection.label);
    }
  }, [pathname]);

  const toggleSection = (label: string) => {
    setExpandedSection(prev => prev === label ? null : label);
  };

  return (
    <aside className="w-64 bg-[#022f42] border-r border-[#1b4f68] hidden md:flex flex-col flex-shrink-0 overflow-y-auto min-h-screen sticky top-0">
      <div className="py-5">
        {/* User Identity Box */}
        <div className="px-4 mb-5">
           <div className="bg-white/5 border border-[#1b4f68] p-4 rounded-sm shadow-inner">
              <div className="w-8 h-8 bg-[#ffd800] text-[#022f42] rounded-sm font-black flex items-center justify-center text-lg mb-3 shadow-sm">
                {(user?.company_name || user?.full_name || "S").charAt(0).toUpperCase()}
              </div>
              <h2 className="text-sm font-bold text-white leading-tight truncate">
                {user?.company_name || "Unregistered Startup"}
              </h2>
              <p className="text-[10px] text-[#b0d0e0] font-medium mt-0.5 truncate">
                {user?.full_name || "Founder"}
              </p>
              {user?.email && (
                <p className="text-[9px] text-white/70 truncate leading-tight mt-2 bg-black/20 px-1.5 py-0.5 rounded-sm">
                  {user.email}
                </p>
              )}
           </div>
        </div>

        {/* Full Sitemap Navigation */}
        <nav className="space-y-4">
          {siteMap.map((section) => {
            const isExpanded = expandedSection === section.label;
            
            return (
              <div key={section.label}>
                {/* Section header */}
                <button 
                  onClick={() => !section.isLocked && toggleSection(section.label)}
                  disabled={section.isLocked}
                  className={`w-full px-4 mb-1 flex items-center justify-between group ${
                    section.isLocked ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {section.isLocked && <Lock className="w-3 h-3 text-[#b0d0e0] opacity-50" />}
                    <h3 className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                      isExpanded 
                        ? "text-[#ffd800]" 
                        : section.isLocked 
                          ? "text-[#b0d0e0]/40" 
                          : "text-[#b0d0e0]/60 group-hover:text-[#b0d0e0]"
                    }`}>
                      {section.label} {section.isLocked && <span className="text-[#ffd800]/70 ml-1 bg-[#ffd800]/10 px-1 py-0.5 rounded-sm">PRO</span>}
                    </h3>
                  </div>
                  {!section.isLocked && (
                    <ChevronRight className={`w-3 h-3 text-[#b0d0e0]/30 transition-transform duration-300 ${isExpanded ? "rotate-90 text-[#ffd800]" : ""}`} />
                  )}
                </button>

                {/* Sub-menu with Tailwind Transition */}
                <div 
                  className={`px-2 space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? "max-h-[1000px] opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"
                  }`}
                >
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const childActive = isAnyChildActive(item.children);

                    return (
                      <div key={item.href}>
                        {/* Top-level item */}
                        <Link
                          href={item.href}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-sm transition-colors text-[12px] group ${
                            active
                              ? "bg-[#1b4f68] text-[#ffd800] font-black"
                              : childActive
                              ? "text-white font-semibold"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <item.icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-[#ffd800]" : childActive ? "text-white/80" : "text-white/40 group-hover:text-white/60"}`} />
                            <span className={`truncate ${active ? "text-[#ffd800] font-black" : ""}`}>{item.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {item.isLocked && (
                              <span className="text-[7px] font-black uppercase tracking-widest text-[#ffd800]/50 bg-[#ffd800]/10 px-1 py-0.5 rounded-sm">Soon</span>
                            )}
                            {item.children && (
                              <ChevronRight className={`w-3 h-3 transition-transform ${childActive ? "rotate-90 text-[#ffd800]" : "text-white/30"}`} />
                            )}
                          </div>
                        </Link>

                        {/* Sub-items (level 2) */}
                        {item.children && childActive && (
                          <div className="ml-3 mt-1 mb-2 border-l border-[#1b4f68]/60 pl-2 space-y-0.5">
                            {item.children.map((child: NavItem) => {
                              const childIsActive = isActive(child.href);
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded-sm transition-colors text-[11px] ${
                                    childIsActive
                                      ? "bg-[#1b4f68] text-[#ffd800] font-black"
                                      : "text-white/50 hover:text-white hover:bg-white/5"
                                  }`}
                                >
                                  <child.icon className={`w-3.5 h-3.5 shrink-0 ${childIsActive ? "text-[#ffd800]" : "text-white/30"}`} />
                                  <span className={childIsActive ? "text-[#ffd800] font-black" : ""}>{child.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
