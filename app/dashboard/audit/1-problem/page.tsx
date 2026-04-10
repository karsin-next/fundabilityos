"use client";

import { DynamicAuditComponent } from "@/components/assessment/DynamicAuditComponent";
import { Lightbulb, ArrowLeft, Target, BookOpen } from "lucide-react";
import Link from "next/link";

export default function ProblemDiagnosticPage() {
  const initialSeedOptions = [
    { id: "opt-1", label: "Critical Operational Failure (System-critical, high cost of inaction)", value: 90 },
    { id: "opt-2", label: "Inefficiency / Slow Workflow (Moderate friction, manageable cost)", value: 60 },
    { id: "opt-3", label: "Compliance or Regulatory Pressure (Legally required change)", value: 75 },
    { id: "opt-4", label: "Optimization / Performance Gain (Improvement of an existing good state)", value: 40 },
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
            <Lightbulb className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-[#022f42] uppercase tracking-tighter">1.1.1 Problem & Hypothesis</h1>
        </div>
        <p className="text-sm text-[#1e4a62] font-medium leading-relaxed max-w-2xl">
          Investors don&apos;t invest in solutions; they invest in problems worth solving. This module forces you to define the &quot;pain&quot; with extreme rigor.
        </p>
      </div>

      <div className="space-y-8">
        <DynamicAuditComponent
          moduleId="1-problem"
          moduleContext="The Problem Diagnostic - identifying the fundamental Pain Trigger, impact, and frequency."
          maxQuestions={5}
          initialQuestion={{
            questionTitle: "What is the primary 'Pain Trigger' that forces your customer to seek a solution today?",
            options: initialSeedOptions,
            placeholder: "Describe the specific scenario where this pain occurs. What is the observable 'broken' process or emotional frustration?"
          }}
        />

        {/* Supporting Context Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-[#022f42] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target size={60} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ffd800] mb-4">Investor Lens</h4>
            <p className="text-xs leading-relaxed text-[#b0d0e0] font-medium uppercase tracking-tight">
              &quot;Is this a Vitamin or a Painkiller? If the customer doesn&apos;t buy your product, does their business stop working, or do they just stay the same?&quot;
            </p>
          </div>

          <div className="bg-white border-2 border-[#022f42]/5 p-8 flex flex-col justify-between group cursor-pointer hover:border-[#022f42]/20 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-[#022f42]" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Academy Resource</h4>
              </div>
              <p className="text-sm font-bold text-[#022f42] mb-2 group-hover:text-[#ffd800] transition-colors">The Problem Slide That Wins</p>
              <p className="text-[11px] text-[#1e4a62]/60 font-medium">Learn how to frame your problem in institutional investor language.</p>
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
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
