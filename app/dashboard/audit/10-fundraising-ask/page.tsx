// @ts-nocheck
"use client";

import { DynamicAuditComponent } from "@/components/assessment/DynamicAuditComponent";
import { PieChart, ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

/**
 * Fundraising Ask Module (1.1.10)
 * Captures the fundraising target, use of funds, and timeline.
 * Mirrors other audit pages and integrates with the assessment flow.
 *
 * Bahasa Malaysia & English: Semua teks bilingual.
 */
export default function FundraisingAskPage() {
  const initialSeedOptions = [
    { id: "opt-1", label: "Clear $9K raise for specific milestones (strong use‑of‑funds)", value: 90 },
    { id: "opt-2", label: "Raise $50K‑$100K with moderate runway (needs detailed plan)", value: 70 },
    { id: "opt-3", label: "Pre‑seed < $20K or vague amount (high risk)", value: 40 },
    { id: "opt-4", label: "No clear raise amount or timeline (unsuitable)", value: 10 },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 hover:text-[#022f42] transition-colors mb-6">
          <ArrowLeft className="w-3 h-3" /> Back to Audit Hub
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#022f42] text-[#ffd800] flex items-center justify-center">
            <PieChart className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-[#022f42] uppercase tracking-tighter">
            1.1.10 Fundraising Ask
          </h1>
        </div>
        <p className="text-sm text-[#1e4a62] font-medium leading-relaxed max-w-2xl">
          Define the amount you aim to raise, how you will use the funds, and the timeline – essential for investor conversations.
        </p>
      </div>

      <div className="space-y-8">
        <DynamicAuditComponent
          moduleId="10-fundraising-ask"
          moduleContext="Fundraising Ask – target raise amount, allocation of funds, and timeline."
          maxQuestions={3}
          initialQuestion={{
            questionTitle: "What is the amount you plan to raise and the target timeline?",
            options: initialSeedOptions,
            placeholder: "Enter the raise amount in USD and the expected closing month/year."
          }}
        />

        {/* Supporting Context Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-[#022f42] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <PieChart size={60} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ffd800] mb-4">Investor Lens</h4>
            <p className="text-xs leading-relaxed text-[#b0d0e0] font-medium uppercase tracking-tight">
              Investors evaluate whether the raise amount aligns with milestones and if the use‑of‑funds is realistic.
            </p>
          </div>
          <div className="bg-white border-2 border-[#022f42]/5 p-8 flex flex-col justify-between group cursor-pointer hover:border-[#022f42]/20 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-[#022f42]" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Academy Resource</h4>
              </div>
              <p className="text-sm font-bold text-[#022f42] mb-2 group-hover:text-[#ffd800] transition-colors">
                Crafting a Compelling Fundraising Ask
              </p>
              <p className="text-[11px] text-[#1e4a62]/60 font-medium">
                Learn how to structure the raise amount, allocation, and timeline for VC‑ready pitches.
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
