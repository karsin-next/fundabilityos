"use client";

import { DynamicAuditComponent } from "@/components/assessment/DynamicAuditComponent";
import { Activity, ArrowLeft, Target, ShieldAlert, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function ScoreOverviewPage() {
  const { user } = useUser();
  
  // Custom interactive initial seed for the Score discussion to mimic a "Term Sheet Simulator"
  const scoreSeedOptions = [
    { id: "opt-1", label: "Defend my Revenue Model rating. I think you scored it too low.", value: 0 },
    { id: "opt-2", label: "If we raise $1.5M today, what is the most likely pre-money valuation range?", value: 0 },
    { id: "opt-3", label: "Break down the exact red-flags that are destroying my leverage.", value: 0 },
    { id: "opt-4", label: "I want to run a mock negotiation against a hostile VC.", value: 0 },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 hover:text-[#022f42] transition-colors mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard Hub
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#022f42] text-[#ffd800] flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-[#022f42] uppercase tracking-tighter">1.2 Autonomous Term Sheet Simulator</h1>
        </div>
        <p className="text-sm text-[#1e4a62] font-medium leading-relaxed max-w-2xl">
          Your Fundability Score isn&apos;t a static grade. It&apos;s a negotiation. You are now communicating directly with the semantic evaluator that scored your Deal Room inputs. Question its logic, demand explanations, or run mock negotiations to stress-test your valuation.
        </p>
      </div>

      <div className="space-y-8">
        <DynamicAuditComponent
          moduleId="1.2-score-simulator"
          moduleContext="You are acting as a hostile Lead VC partner defending the current Fundability Score given to this founder based on their previous answers. You must ruthlessly highlight their weaknesses in revenue, team, and market sizing."
          maxQuestions={10}
          initialQuestion={{
            questionTitle: `Alright ${user?.full_name?.split(' ')[0] || 'Founder'}. The syndicate has reviewed your 8 Due Diligence constraints. Your current leverage index is sitting in the danger zone. Where do you want to start your defense?`,
            options: scoreSeedOptions,
            placeholder: "Challenge the AI's assessment of your startup, or ask for a detailed teardown of your valuation calculation..."
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-[#022f42] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target size={60} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ffd800] mb-4">The 'Devil's Advocate' Loop</h4>
            <p className="text-xs leading-relaxed text-[#b0d0e0] font-medium uppercase tracking-tight">
              &quot;Every dispute you log here feeds back into the global model. If you can logically prove the AI evaluated you incorrectly, your Neural Confidence rating increases.&quot;
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 p-8 flex flex-col justify-between group cursor-pointer hover:border-red-400 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-800">Critical Requirement</h4>
              </div>
              <p className="text-sm font-bold text-red-900 mb-2 group-hover:text-red-600 transition-colors">You Cannot Hide Metrics</p>
              <p className="text-[11px] text-red-800/70 font-medium">To run the negotiation simulator, you must update the missing Traction Tracker fields on the main dashboard.</p>
            </div>
            <button className="mt-6 text-[9px] font-black uppercase tracking-widest text-red-700 flex items-center gap-2">
              Force Override <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
