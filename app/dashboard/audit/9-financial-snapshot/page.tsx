// @ts-nocheck
"use client";

import { DynamicAuditComponent } from "@/components/assessment/DynamicAuditComponent";
import { DollarSign, ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

/**
 * Financial Snapshot Module (1.1.9)
 * Provides a quick financial health overview: revenue, burn, runway, and cash position.
 * Mirrors the style of other audit pages and integrates with existing assessment flow.
 */
export default function FinancialSnapshotPage() {
  const initialSeedOptions = [
    { id: "opt-1", label: "Strong Revenue & Positive Cash Flow", value: 90 },
    { id: "opt-2", label: "Growing Revenue but Negative Cash Flow", value: 65 },
    { id: "opt-3", label: "Pre‑Revenue or Minimal Cash", value: 35 },
    { id: "opt-4", label: "Unsustainable Burn Rate", value: 10 },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 hover:text-[#022f42] transition-colors mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Audit Hub
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#022f42] text-[#ffd800] flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-[#022f42] uppercase tracking-tighter">
            1.1.9 Financial Snapshot
          </h1>
        </div>
        <p className="text-sm text-[#1e4a62] font-medium leading-relaxed max-w-2xl">
          Capture the essential financial metrics that matter to investors: revenue, burn, runway, and cash balance.
        </p>
      </div>

      <div className="space-y-8">
        <DynamicAuditComponent
          moduleId="9-financial-snapshot"
          moduleContext="Financial Snapshot – current revenue, burn rate, runway, and cash position."
          maxQuestions={4}
          initialQuestion={{
            questionTitle: "What is your current monthly recurring revenue (MRR) or total revenue?",
            options: initialSeedOptions,
            placeholder: "Enter the exact revenue figure in USD. If pre‑revenue, state $0 and describe any LOIs or pilots."
          }}
        />

        {/* Supporting Context Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-[#022f42] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign size={60} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ffd800] mb-4">Investor Lens</h4>
            <p className="text-xs leading-relaxed text-[#b0d0e0] font-medium uppercase tracking-tight">
              Investors look for sustainable cash flow, disciplined burn, and a clear runway to the next raise.
            </p>
          </div>
          <div className="bg-white border-2 border-[#022f42]/5 p-8 flex flex-col justify-between group cursor-pointer hover:border-[#022f42]/20 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-[#022f42]" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Academy Resource</h4>
              </div>
              <p className="text-sm font-bold text-[#022f42] mb-2 group-hover:text-[#ffd800] transition-colors">
                Building a Financial Snapshot
              </p>
              <p className="text-[11px] text-[#1e4a62]/60 font-medium">
                Learn how to present revenue, burn, and runway in a VC‑ready format.
              </p>
            </div>
            <Link href="/academy" className="mt-6 text-[9px] font-black uppercase tracking-widest text-[#022f42] flex items-center gap-2">
              View Guide <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
