"use client";

import { PredictiveAuditQuestion } from "@/components/assessment/PredictiveAuditQuestion";
import { Swords, ArrowLeft, Target, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CompetitorDiagnosticPage() {
  const competitorOptions = [
    { id: "opt-1", label: "New Technology Paradigm (AI/DeepTech vs Traditional/Legacy Software)", value: 85 },
    { id: "opt-2", label: "Business Model Innovation (Usage-based or Freemium vs High-Ticket Licensing)", value: 70 },
    { id: "opt-3", label: "Vertical Specialization (Solving for a niche that horizontal giants ignore)", value: 75 },
    { id: "opt-4", label: "Operational Speed/Cost (Significantly faster or cheaper than status quo)", value: 60 },
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
            <Swords className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-[#022f42] uppercase tracking-tighter">1.1.3 Competitive Positioning</h1>
        </div>
        <p className="text-sm text-[#1e4a62] font-medium leading-relaxed max-w-2xl">
          Investors don&apos;t care if you&apos;re better; they care if you&apos;re different. This module uncovers your &quot;White Space&quot; and your defensive moat.
        </p>
      </div>

      <div className="space-y-8">
        <PredictiveAuditQuestion
          moduleId="3-competitor"
          questionTitle="What is the fundamental nature of your competitive 'White Space'?"
          options={competitorOptions}
          placeholder="List your top 3 direct competitors and explain exactly why a customer would switch to you today. What is their 'unhappy path' with the status quo?"
          onSave={(data) => console.log("Competitor diagnostic saved", data)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-[#022f42] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target size={60} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ffd800] mb-4">Investor Lens</h4>
            <p className="text-xs leading-relaxed text-[#b0d0e0] font-medium uppercase tracking-tight">
              &quot;If Microsoft or Google entered this market tomorrow, what is the specific reason you wouldn&apos;t be wiped out instantly?&quot;
            </p>
          </div>

          <div className="bg-white border-2 border-[#022f42]/5 p-8 flex flex-col justify-between group cursor-pointer hover:border-[#022f42]/20 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-[#022f42]" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Academy Resource</h4>
              </div>
              <p className="text-sm font-bold text-[#022f42] mb-2 group-hover:text-[#ffd800] transition-colors">The Moat Methodology</p>
              <p className="text-[11px] text-[#1e4a62]/60 font-medium">How to build a competitive matrix that highlights your unique strengths.</p>
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
