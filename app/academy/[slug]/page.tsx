/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Users, Zap, ExternalLink } from "lucide-react";
import { useUser } from "@clerk/nextjs";

/**
 * Article Data Store
 * In a real app, this would be fetched from a DB or CMS.
 */
const ACADEMY_DB: Record<string, any> = {
  "saas-valuation-benchmarks-2026": {
    title: "SaaS Valuation Benchmarks: What Institutional Investors Want in 2026",
    category: "Valuation",
    time: "4 min read",
    author: "The FundabilityOS team",
    date: "April 1, 2026",
    content: `
      <p>The landscape of venture capital for mid-to-late stage SaaS startups has shifted dramatically in the last 18 months. As we move into 2026, the focus has entirely abandoned "growth at all costs" in favor of <strong>Capital Velocity</strong> and <strong>Net Retention</strong>.</p>
      
      <h2>The Core Benchmarks</h2>
      <p>Institutional investors are currently screening Series A and B cohorts using the following strictly quantitative filters:</p>
      
      <ul>
        <li><strong>LTV:CAC Ratio:</strong> > 4.5x for Enterprise SaaS.</li>
        <li><strong>Rule of 40:</strong> Combined growth and margin must now exceed 45% for a "Hot Round" valuation.</li>
        <li><strong>Net Revenue Retention (NRR):</strong> > 115% for mid-market and > 125% for Enterprise.</li>
      </ul>

      <h2>The Benchmark Signal: "Raise Velocity"</h2>
      <p>A key metric identified through autonomous benchmarking is <strong>Raise Velocity</strong>. This is the speed at which a secondary data room is cleared during due diligence. Startups that have their financials pre-audited are clearing this phase <strong>48% faster</strong> than the benchmark mean.</p>

      <blockquote>
        "The winning startups of 2026 aren't just the ones with the best code; they're the ones with the best narratives backed by a perfectly clean financial data room."
      </blockquote>

      <h2>Actionable Next Steps</h2>
      <ol>
        <li>Verify your Rule of 40 placement.</li>
        <li>Run a Gap Analysis on your CAC payback period.</li>
        <li>Ensure your Investor Deck matches the institutional benchmark data in your FundabilityOS snapshot.</li>
      </ol>
    `
  },
  "cac-payback-gap-mitigation": {
    title: "The CAC Payback Gap: How to Fix Your Unit Economics Before Your Next Raise",
    category: "Unit Economics",
    time: "6 min read",
    author: "The FundabilityOS team",
    date: "March 28, 2026",
    content: `
      <p>One of the most common friction points we see in startup audits is the <strong>Payback Gap</strong>. This occurs when the cost to acquire a customer (CAC) far exceeds the revenue they generate in the first 12 months, leading to a dangerous cash-flow bottleneck.</p>

      <h2>Identifying Growth Friction</h2>
      <p>Inside a standard financial audit, we call this the "Conversion Gap". It's often found in startups that are spending heavily on customer acquisition without a clear attribution loop to high-LTV customers.</p>

      <ul>
        <li><strong>The Symptom:</strong> CAC payback periods > 18 months.</li>
        <li><strong>The Fix:</strong> Dynamic pricing adjustments based on willingness-to-pay (WTP) signals.</li>
      </ul>

      <h2>How A.I. Benchmarking Mitigates This</h2>
      <p>Our autonomous engine doesn't just surface the problem; it identifies the pricing misalignment. By shifting your landing page pricing by even small margins in high-value cohorts, you can often close the payback gap by 15-20% within a single quarter.</p>
    `
  },
  "investor-matching-algorithms": {
    title: "Beyond the Warm Intro: Using Matching Algorithms to Scale Your Capital Hunt",
    category: "Fundraising",
    time: "5 min read",
    author: "The FundabilityOS team",
    date: "March 24, 2026",
    content: `
      <p>Warm intros are a bottleneck. If you're building a billion-dollar company, you cannot rely solely on your network's network. You need a <strong>Data-Driven Capital Hunt</strong>.</p>

      <h2>The Algorithm vs. The Rolodex</h2>
      <p>FundabilityOS uses a proprietary matching engine that analyzes over 2,000 active institutional investors. We don't just look at their "focus industry"; we look at their <strong>Investment DNA</strong>:</p>

      <ul>
        <li>Typical check size for your current MRR.</li>
        <li>Historical follow-on behavior.</li>
        <li>Regional syndicate preference.</li>
      </ul>

      <p>By identifying your top 3 matches using the fundability audit, you increase your first-meeting-to-term-sheet conversion rate by <strong>3.4x</strong>.</p>
    `
  }
};

import { use } from "react";

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { user } = useUser();
  const resolvedParams = use(params);
  const article = ACADEMY_DB[resolvedParams.slug];

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-screen font-black text-gray-300">
        404 | INSIGHT NOT FOUND
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Article Navigation - Hide when logged in */}
      {!user && (
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/academy" className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#022f42] transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to insights
          </Link>
          <div className="flex items-center gap-2 group">
            <div className="w-6 h-6 bg-[#022f42] rounded-sm flex items-center justify-center">
              <Zap className="w-3 h-3 text-[#ffd800]" />
            </div>
            <span className="font-black text-xs text-[#022f42] uppercase tracking-tighter">Fundability<span className="text-[#ffd800]">OS</span></span>
          </div>
        </div>
      </nav>
      )}

      <article className="max-w-3xl mx-auto px-6 py-20">
        {/* Meta Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <span className="px-2 py-0.5 bg-[#90cdf4] text-white text-[9px] font-black uppercase tracking-widest rounded-sm">
              {article.category}
            </span>
            <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              <Calendar className="w-3 h-3" /> {article.date} • <Clock className="w-3 h-3 ml-2" /> {article.time}
            </div>
          </div>
          <h1 className="text-5xl font-black text-[#022f42] tracking-tighter leading-[0.95] mb-8">
            {article.title}
          </h1>
          <div className="flex items-center gap-3 border-y border-gray-50 py-4">
             <div className="w-10 h-10 bg-gray-50 rounded-sm flex items-center justify-center border border-gray-100">
                <Users className="w-5 h-5 text-gray-300" />
             </div>
             <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">{article.author}</div>
                <div className="text-[9px] font-bold text-gray-400 uppercase">Institutional Research Division</div>
             </div>
          </div>
        </header>

        {/* Article Content */}
        <div 
          className="prose prose-slate prose-lg max-w-none 
            prose-headings:font-black prose-headings:text-[#022f42] prose-headings:tracking-tighter 
            prose-p:text-gray-600 prose-p:font-medium prose-p:leading-relaxed
            prose-li:text-gray-600 prose-li:font-medium
            prose-blockquote:border-[#ffd800] prose-blockquote:bg-gray-50 prose-blockquote:p-6 prose-blockquote:font-bold prose-blockquote:italic
            prose-strong:text-[#022f42]"
          dangerouslySetInnerHTML={{ __html: article.content }} 
        />

        {/* Lead Magnet CTA - Hide when logged in */}
        {!user && (
        <div className="mt-20 p-10 bg-[#022f42] rounded-sm text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#ffd800]/5 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-[#ffd800] text-[#022f42] text-[9px] font-black uppercase tracking-widest rounded-sm mb-4">
                Recommended Action
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">Get your own <br />Fundability Score</h3>
              <p className="text-[#90cdf4] text-sm font-medium leading-relaxed">
                Benchmark your real-time company data against the institutional metrics in this article.
              </p>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
              <Link 
                href="/dashboard" 
                className="block bg-[#ffd800] text-[#022f42] px-8 py-5 text-sm font-black uppercase tracking-[0.2em] rounded-sm shadow-xl shadow-[#ffd800]/20 hover:scale-105 transition-transform"
              >
                Launch Live Audit
              </Link>
            </div>
          </div>
        </div>
        )}

        {/* Modern Link to Home CTA - Hide when logged in */}
        {!user && (
        <div className="mt-12 text-center border-t border-gray-50 pt-12">
           <Link href="/academy" className="text-sm font-bold text-gray-400 hover:text-[#022f42] transition-colors flex items-center justify-center gap-2">
             Explore more Alpha Insights <ExternalLink className="w-4 h-4" />
           </Link>
        </div>
        )}
      </article>
    </div>
  );
}
