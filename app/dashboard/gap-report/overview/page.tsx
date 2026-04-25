"use client";

import { DynamicAuditComponent } from "@/components/assessment/DynamicAuditComponent";
import { AlertTriangle, ArrowLeft, Target, ShieldAlert, ChevronRight, FileSearch } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function GapReportOverviewPage() {
  const { user } = useUser();
  
  // Custom interactive initial seed for the Negotiation Defense Engine
  const defenseSeedOptions = [
    { id: "opt-1", label: "Defend Red Flag #1: High CAC and weak organic growth signal.", value: 0 },
    { id: "opt-2", label: "Defend Red Flag #2: Excessive reliance on founder-led sales.", value: 0 },
    { id: "opt-3", label: "Defend Red Flag #3: Indistinguishable competitive moat.", value: 0 },
    { id: "opt-4", label: "Generate an action plan to mitigate these 3 flags before pitching.", value: 0 },
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
            <FileSearch className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-[#022f42] uppercase tracking-tighter">1.3 Negotiation Defense Engine</h1>
        </div>
        <p className="text-sm text-[#1e4a62] font-medium leading-relaxed max-w-2xl">
          Based on your Deal Room inputs, the AI logic engine has isolated your top 3 Deal-Breaking Red Flags. A venture syndicate will explicitly attack these vulnerabilities during diligence. Practice your defense here, before it costs you equity.
        </p>
      </div>

      <div className="space-y-8">
        <DynamicAuditComponent
          moduleId="1.3-gap-defense"
          moduleContext="You are acting as an aggressive Due Diligence Analyst drilling into the top 3 weaknesses of the startup. You must poke holes in the founder's defense and suggest concrete mitigation steps."
          maxQuestions={10}
          initialQuestion={{
            questionTitle: `We've flagged 3 critical vulnerabilities in your current profile, ${user?.full_name?.split(' ')[0] || 'Founder'}. If you pitch today, the syndicate will attack these exact points. Which one do you want to defend first?`,
            options: defenseSeedOptions,
            placeholder: "Type your investor defense here. How do you justify this red flag, or what is your strict timeline to eliminate it?"
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-[#022f42] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target size={60} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ffd800] mb-4">The 'Devil's Advocate' Loop</h4>
            <p className="text-xs leading-relaxed text-[#b0d0e0] font-medium uppercase tracking-tight">
              &quot;The AI evaluates your defense in real-time. If your logic holds up to institutional scrutiny, the severity weighting of the red flag will automatically decrease in your global score.&quot;
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 p-8 flex flex-col justify-between group cursor-pointer hover:border-red-400 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-800">Critical Requirement</h4>
              </div>
              <p className="text-sm font-bold text-red-900 mb-2 group-hover:text-red-600 transition-colors">Missing Baseline Data</p>
              <p className="text-[11px] text-red-800/70 font-medium">To generate an accurate mitigation plan, you must complete the Deal Room Gates on your dashboard.</p>
            </div>
            <Link href="/dashboard" className="mt-6 text-[9px] font-black uppercase tracking-widest text-red-700 flex items-center gap-2">
              Return to Gates <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
