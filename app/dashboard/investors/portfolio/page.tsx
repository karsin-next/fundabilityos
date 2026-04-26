/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Users, Filter, CheckCircle2, Copy, Send, Mail, Briefcase, Zap, Radar, DollarSign } from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { createClient } from "@/lib/supabase/client";

type InvestorMatch = {
  id: string;
  firmName: string;
  type: string;
  stage: string;
  check: string;
  thesis: string;
  affinity: number; // 0-100 score
};

export default function VCMatcherPage() {
  const { user } = useUser();
  const [investors, setInvestors] = useState<InvestorMatch[]>([]);
  const [startupProfile, setStartupProfile] = useState<Record<string, any> | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();
  
  // AI Drafter State
  const [selectedVC, setSelectedVC] = useState<InvestorMatch | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadState() {
      if (!user?.id) return;
      
      // 1. Load Startup Profile from Supabase (reports table)
      const { data: report } = await supabase
        .from("reports")
        .select("audit_responses, scoring_result")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const profile = report?.audit_responses || {};
      const scoreResult = report?.scoring_result || {};
      setStartupProfile(profile);

      // 2. Mock Investor Data (In production, this comes from an 'investors' table)
      const mockInvestors: InvestorMatch[] = [
        {
          id: "inv_1",
          firmName: "Sequoia Alpha",
          type: "VC",
          stage: "Seed - Series A",
          check: "$1M - $5M",
          thesis: "Backing hyper-scale AI infrastructure and core revenue engines in the APAC region.",
          affinity: 94
        },
        {
          id: "inv_2",
          firmName: "NextBlaze Ventures",
          type: "Institutional",
          stage: "Pre-Seed - Seed",
          check: "$250k - $1M",
          thesis: "Specializing in revenue-first startups with verified fundability snapshots.",
          affinity: 88
        },
        {
          id: "inv_3",
          firmName: "Blue Chip Angels",
          type: "Angel Syndicate",
          stage: "Pre-Seed",
          check: "$50k - $200k",
          thesis: "Early-stage support for founders with strong unit economics and clear GTM clarity.",
          affinity: 72
        }
      ];

      setInvestors(mockInvestors);
      setIsLoaded(true);
    }

    loadState();
  }, [user, supabase]);

  const generateDraft = (vc: InvestorMatch) => {
    setSelectedVC(vc);
    setIsDrafting(true);
    setEmailDraft("");
    setCopied(false);

    // Simulate AI generation time
    setTimeout(() => {
       const draft = `Subject: Secure Interest: ${startupProfile?.companyName || "Our Startup"} - ${startupProfile?.industry || "High-Growth"} Investment Opportunity\n\nHi ${vc.firmName.split(' ')[0] || "Partner"},\n\nI'm the Founder of ${startupProfile?.companyName || "our company"}. We are operating in the ${startupProfile?.industry || "technology"} space, which aligns closely with your stated thesis of backing ${vc.stage} companies looking for ${vc.check} rounds.\n\nWe recently completed a comprehensive FundabilityOS diagnostic on NextBlaze and have mathematically verified our PMF and Unit Economics. Our fundability score is currently ${startupProfile?.score || "calculated"} / 100.\n\nI'd like to grant you exclusive access to our secure Deal Room via the platform to review our Cap Tables and Live Revenue Snapshots. Please let me know if you are open to continuing this conversation through the internal channel.\n\nBest,\n${startupProfile?.founderName || "Founder"}\nCEO, ${startupProfile?.companyName || "Our Startup"}`;
       setEmailDraft(draft);
       setIsDrafting(false);
    }, 1800);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(emailDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoaded) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 min-h-[calc(100vh-100px)] relative">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-block bg-[#ffd800] text-[#022f42] font-bold px-3 py-1 mb-2 text-[10px] uppercase tracking-widest">
            Module 3.2 & 3.3
          </div>
          <h1 className="text-3xl font-bold text-[#022f42] mb-2 flex items-center tracking-tighter">
             <Radar className="w-8 h-8 mr-3 text-[#1e4a62]" /> Active Deal Matcher
          </h1>
          <p className="text-[#1e4a62] text-sm max-w-2xl leading-relaxed">
            The neural grid mapping your specific metrics directly to active Capital Deployers on the NextBlaze network. Algorithms calculate the highest theoretical affinity and auto-draft your outreach payloads.
          </p>
        </div>
        
        <div className="flex bg-white border border-[#1e4a62]/10 rounded-sm shadow-sm overflow-hidden text-xs font-bold uppercase tracking-widest">
           <div className="px-4 py-3 bg-[#f2f6fa] text-[#1e4a62] border-r border-[#1e4a62]/10 flex items-center">
              <Filter className="w-3 h-3 mr-2" /> All Stages
           </div>
           <div className="px-4 py-3 text-[#022f42] bg-white flex items-center cursor-pointer hover:bg-gray-50">
              Highest Affinity
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {investors.length === 0 ? (
           <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white border border-[#1e4a62]/10 border-dashed rounded-sm">
              <Users className="w-12 h-12 text-[#1e4a62]/20 mb-4" />
              <h3 className="text-sm font-black text-[#022f42] uppercase tracking-widest mb-1">Grid Empty</h3>
              <p className="text-sm text-[#1e4a62]">No active investor nodes found matching your current physical instance.</p>
           </div>
         ) : (
           investors.map((vc) => (
             <div key={vc.id} className="bg-white border border-[#1e4a62]/10 rounded-sm shadow-[0_10px_20px_-10px_rgba(2,47,66,0.05)] hover:shadow-[0_15px_30px_-5px_rgba(2,47,66,0.15)] transition-all flex flex-col h-full group">
                <div className="p-6 border-b border-[#1e4a62]/5 relative overflow-hidden">
                   <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-20 -translate-y-1/2 translate-x-1/2 ${vc.affinity > 75 ? 'bg-green-500' : 'bg-[#ffd800]'}`}></div>
                   <div className="flex justify-between items-start relative z-10 mb-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest bg-[#f2f6fa] text-[#1e4a62] px-2 py-0.5 rounded-sm">
                        {vc.type}
                      </div>
                      <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-sm flex items-center ${vc.affinity > 75 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[#fffcf0] text-[#022f42] border-[#ffd800]'}`}>
                        <Zap className="w-3 h-3 mr-1" /> {vc.affinity}% Match
                      </div>
                   </div>
                   <h3 className="text-xl font-black text-[#022f42] truncate">{vc.firmName}</h3>
                   <div className="flex space-x-3 mt-3 text-xs font-bold text-[#1e4a62]">
                     <span className="flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1" /> {vc.stage}</span>
                     <span className="flex items-center"><DollarSign className="w-3.5 h-3.5 mr-1" /> {vc.check}</span>
                   </div>
                </div>
                
                <div className="p-6 flex-grow">
                   <div className="text-[10px] font-bold text-[#1e4a62] uppercase tracking-widest mb-2">Thesis Vector</div>
                   <p className="text-sm text-[#022f42] line-clamp-3 leading-relaxed font-medium">
                     &quot;{vc.thesis}&quot;
                   </p>
                </div>
                
                <div className="p-4 bg-[#f2f6fa]/50 border-t border-[#1e4a62]/5 mt-auto">
                   <button 
                     onClick={() => generateDraft(vc)}
                     className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-[#1e4a62]/20 hover:border-[#022f42] hover:bg-[#022f42] hover:text-white text-[#022f42] transition-colors rounded-sm text-[10px] font-black uppercase tracking-widest shadow-sm"
                   >
                     <Zap className="w-3 h-3 text-[#ffd800]" />
                     <span>Draft Warm Intro</span>
                   </button>
                </div>
             </div>
           ))
         )}
      </div>

      {/* AI Drafter Modal View */}
      {selectedVC && (
        <div className="fixed inset-0 z-[100] bg-[#022f42]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-sm w-full max-w-2xl shadow-2xl overflow-hidden border border-[#1e4a62]/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
             <div className="bg-[#022f42] p-5 flex justify-between items-center border-b border-white/10 shrink-0">
               <div>
                  <h3 className="text-[10px] uppercase font-black tracking-widest text-[#ffd800] flex items-center mb-1">
                    <Zap className="w-3 h-3 mr-2" /> Neural Engine Active
                  </h3>
                  <div className="text-white font-bold text-sm">Target Payload: {selectedVC.firmName}</div>
               </div>
               <button onClick={() => setSelectedVC(null)} className="text-white/60 hover:text-white p-2">✕</button>
             </div>
             
             <div className="p-6 overflow-y-auto flex-grow bg-[#f2f6fa]">
               {isDrafting ? (
                  <div className="flex flex-col items-center justify-center py-20 text-[#1e4a62]">
                     <div className="w-8 h-8 border-4 border-[#022f42] border-t-transparent rounded-full animate-spin mb-4"></div>
                     <div className="text-xs font-black uppercase tracking-widest text-[#022f42] mb-1">Synthesizing Metrics...</div>
                     <div className="text-[10px] font-bold text-[#1e4a62] opacity-70">Cross-referencing startup Data Room with {selectedVC.firmName} Thesis</div>
                  </div>
               ) : (
                  <div className="bg-white border border-[#1e4a62]/10 shadow-sm rounded-sm overflow-hidden h-full flex flex-col">
                     <div className="p-4 border-b border-[#1e4a62]/10 bg-[#f2f6fa]/50 text-xs font-medium text-[#1e4a62] flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Target: <span className="font-bold text-[#022f42] ml-1">{selectedVC.firmName} (Internal Secure Link)</span>
                     </div>
                     <div className="p-6 relative flex-grow text-sm text-[#022f42] whitespace-pre-wrap leading-relaxed min-h-[300px]">
                        {emailDraft}
                     </div>
                  </div>
               )}
             </div>

             {!isDrafting && (
               <div className="p-5 bg-white border-t border-[#1e4a62]/10 flex gap-4 shrink-0">
                  <button onClick={copyToClipboard} className={`flex-1 p-4 font-black tracking-widest uppercase text-[10px] flex items-center justify-center transition-all border-2 rounded-sm ${copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-[#022f42] border-[#022f42] hover:bg-[#f2f6fa]'}`}>
                    {copied ? <><CheckCircle2 className="w-4 h-4 mr-2"/> Copied to Clipboard</> : <><Copy className="w-4 h-4 mr-2"/> Copy Payload</>}
                  </button>
                  <button className="flex-1 p-4 bg-[#022f42] text-white font-black tracking-widest uppercase text-[10px] flex items-center justify-center hover:bg-[#ffd800] hover:text-[#022f42] transition-colors rounded-sm shadow-md">
                    Initiate Internal Chat <Send className="w-3 h-3 ml-2" />
                  </button>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
