"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, ChevronRight } from "lucide-react";
import ProgressTracker from "@/components/chat/ProgressTracker";
import ScoreGaugeMock from "@/components/score/ScoreGaugeMock";
import type { ScoringResult } from "@/lib/scoring";
import { useUser } from "@/lib/hooks/useUser";
import { createClient } from "@/lib/supabase/client";

type InterviewState = "idle" | "loading_question" | "answering" | "collecting_email" | "scoring" | "done" | "error";

interface HistoryItem {
  question: string;
  answer: string;
}

interface ActiveQuestion {
  title: string;
  description: string;
  options: string[];
  dimension?: string;
}

interface Props {
  onComplete?: (result: ScoringResult) => void;
  isEmbedded?: boolean;
}

export default function QuickAssess({ onComplete, isEmbedded = false }: Props) {
  const MAX_QUESTIONS = 20;
  const [state, setState] = useState<InterviewState>("idle");
  const padding = isEmbedded ? "0" : "2.5rem"; // Use variable to satisfy ESLint
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestion | null>(null);
  const [coveredDimensions, setCoveredDimensions] = useState<string[]>([]);
  const { user } = useUser();
  
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null);
  const initRendered = useRef(false);

  const fetchNextNode = useCallback(async (currentHistory: HistoryItem[]) => {
    setState("loading_question");
    setActiveQuestion(null);
    setShowCustomInput(false);
    setCustomInput("");

    // Load Pitch Deck Context if available
    const deckContextRaw = localStorage.getItem("PITCH_DECK_CONTEXT");
    const deckContext = deckContextRaw ? JSON.parse(deckContextRaw) : null;

    try {
      const res = await fetch("/api/interview/tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          history: currentHistory,
          deckContext: deckContext 
        }),
      });
      
      if (!res.ok) throw new Error("Failed to load next question");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream failed to initialize");

      const decoder = new TextDecoder();
      let buffer = "";
      let jsonString = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const rawData = line.slice(6).trim();
            if (!rawData) continue;
            let parsed;
            try {
              parsed = JSON.parse(rawData);
            } catch (e) { continue; }

            if (parsed.delta) jsonString += parsed.delta;
            if (parsed.error) throw new Error("AI Error: " + parsed.error);
          }
        }
      }

      if (!jsonString) throw new Error("AI returned empty response");
      
      const data = JSON.parse(jsonString.replace(/```json/g, "").replace(/```/g, "").trim());

      if (data.type === "complete") {
        const storedEmail = typeof window !== "undefined" ? localStorage.getItem("guest_email") : null;
        if (!user && !storedEmail) {
          setExtractedData(data.extracted_data);
          setState("collecting_email");
        } else {
          runScoring(data.extracted_data, storedEmail || undefined);
        }
      } else if (data.type === "question") {
        setActiveQuestion({
          title: data.title,
          description: data.description || "Select the best option tailored to your startup.",
          options: data.options || [],
          dimension: data.dimension
        });
        if (data.dimension && !coveredDimensions.includes(data.dimension)) {
          setCoveredDimensions(prev => [...prev, data.dimension]);
        }
        setState("answering");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Connection failed");
      setState("error");
    }
  }, [coveredDimensions]);

  useEffect(() => {
    if (!initRendered.current) {
      initRendered.current = true;
      
      // Data Leakage Fix: If we didn't just come from the upload deck flow, clear any stale pitch deck logic.
      if (typeof window !== "undefined") {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get("source") !== "deck") {
          localStorage.removeItem("PITCH_DECK_CONTEXT");
        }
      }

      fetchNextNode([]);
    }
  }, [fetchNextNode]);

  const runScoring = async (structuredData: Record<string, unknown>, emailOverride?: string) => {
    setState("scoring");
    try {
      // Auto-trigger magic link if we have an email but no user
      if (!user && emailOverride) {
        const supabase = createClient();
        supabase.auth.signInWithOtp({ 
          email: emailOverride,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard"
          }
        }).catch(err => console.error("Magic link trigger error:", err));
      }

      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          answers: structuredData,
          userId: user?.id,
          userEmail: emailOverride || user?.email
        }),
      });
      if (!res.ok) throw new Error("Analysis failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Scoring stream failed to initialize");

      const decoder = new TextDecoder();
      let buffer = "";
      let jsonString = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const rawData = line.slice(6).trim();
            if (!rawData) continue;
            try {
              const parsed = JSON.parse(rawData);
              if (parsed.delta) jsonString += parsed.delta;
              if (parsed.error) throw new Error("Scoring Error: " + parsed.error);
            } catch (e) { continue; }
          }
        }
      }

      const result: ScoringResult = JSON.parse(jsonString.replace(/```json/g, "").replace(/```/g, "").trim());
      setScoringResult(result);
      setState("done");
      localStorage.removeItem("PITCH_DECK_CONTEXT"); // Clear context to prevent data leakage to next assessment
      if (onComplete) onComplete(result);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Analysis failed");
      setState("error");
    }
  };

  const handleSelectOption = (value: string) => {
    const newHistory = [...history, { question: activeQuestion!.title, answer: value }];
    setHistory(newHistory);
    if (newHistory.length >= MAX_QUESTIONS) {
      runScoring(Object.fromEntries(newHistory.map(h => [h.question, h.answer])));
    } else {
      fetchNextNode(newHistory);
    }
  };

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;
    const newHistory = [...history, { question: activeQuestion!.title, answer: customInput.trim() }];
    setHistory(newHistory);
    if (newHistory.length >= MAX_QUESTIONS) {
      runScoring(Object.fromEntries(newHistory.map(h => [h.question, h.answer])));
    } else {
      fetchNextNode(newHistory);
    }
  };

  const handleReset = () => {
    localStorage.removeItem("PITCH_DECK_CONTEXT"); // Ensure clean slate
    setHistory([]);
    setActiveQuestion(null);
    setCoveredDimensions([]);
    setScoringResult(null);
    setErrorMsg("");
    fetchNextNode([]);
  };

  if (state === "error") {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "var(--red)", marginBottom: "1rem" }}>{errorMsg}</p>
        <button onClick={handleReset} className="btn btn-primary btn-sm"><RotateCcw size={14} /> Restart</button>
      </div>
    );
  }

  if (state === "scoring") {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid var(--yellow-20)", borderTopColor: "var(--yellow)", animation: "spin 1s linear infinite", marginInline: "auto", marginBottom: "1.5rem" }} />
        <h3 className="heading-card" style={{ color: "var(--white)", marginBottom: "0.5rem" }}>Generating Report…</h3>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Calculating score across 8 investor dimensions.</p>
        <style dangerouslySetInnerHTML={{ __html: "@keyframes spin { to { transform: rotate(360deg); } }" }} />
      </div>
    );
  }

  if (state === "done" && scoringResult) {
    return (
      <div style={{ padding: "2.5rem", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--yellow-20)", textAlign: "center" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "10px", fontWeight: 900, color: "var(--yellow)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "0.5rem" }}>Assessment Complete</div>
          <div style={{ fontSize: "4rem", fontWeight: 900, color: "var(--white)", lineHeight: 1 }}>{scoringResult.score}</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--yellow)", marginTop: "0.5rem", textTransform: "uppercase" }}>Band: {scoringResult.band}</div>
        </div>
        
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "2rem", textAlign: "left" }}>
          {scoringResult.summary_paragraph}
        </p>

        <div className="bg-[#ffd800]/5 border border-[#ffd800]/10 p-5 rounded-sm mb-8 text-left">
           <h4 className="text-[11px] font-black uppercase tracking-widest text-[#ffd800] mb-2 flex items-center gap-2">
             <Zap size={14} /> Next Step: Secure Your Narrative
           </h4>
           <p className="text-[12px] text-white/60 font-medium leading-relaxed">
             We&apos;ve unlocked your basic score. Your full 10-module dashboard and Investor-Ready Report are now waiting for you. 
           </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/dashboard" className="btn btn-primary w-full py-4 text-[11px] font-black uppercase tracking-widest">
            Enter My Dashboard & Fix Gaps <ArrowRight size={16} />
          </Link>
          <button onClick={handleReset} className="text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white transition-colors">Retake Diagnostic</button>
        </div>

        {!user && (
          <p className="text-[10px] text-white/30 mt-6 font-medium leading-relaxed">
            Check your inbox for a magic link to access your persistent dashboard.
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: "600px", padding: padding, animation: "assessFadeIn 0.5s ease" }}>
      <div style={{ marginBottom: "2rem" }}>
        <ProgressTracker currentDimension={activeQuestion?.dimension} coveredDimensions={coveredDimensions} />
      </div>

      {state === "collecting_email" ? (
        <div style={{ animation: "questionFadeIn 0.4s easeOut" }}>
          <h3 style={{ color: "var(--white)", fontSize: "1.25rem", marginBottom: "0.5rem", fontWeight: 700 }}>Where should we send your report?</h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Enter your email to receive your full fundability analysis. <strong>This will also create your account</strong> so you can access your private dashboard via magic link.
          </p>
          <input 
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="founder@company.com"
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--yellow-20)", borderRadius: "4px", padding: "0.875rem", color: "white", fontSize: "0.9rem", marginBottom: "1.5rem" }}
          />
          <button 
            disabled={!guestEmail.includes("@")}
            onClick={() => {
              const storedEmail = guestEmail || (typeof window !== "undefined" ? localStorage.getItem("guest_email") : null);
              if (storedEmail) {
                const supabase = createClient();
                supabase.auth.signInWithOtp({ 
                  email: storedEmail,
                  options: {
                    emailRedirectTo: window.location.origin + "/dashboard"
                  }
                }).catch(err => console.error("Magic link error:", err));
              }
              runScoring(extractedData!, guestEmail);
            }}
            className="btn btn-primary w-full"
          >
            Generate My Report & Save Results <ArrowRight size={14} />
          </button>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", marginTop: "1rem", textAlign: "center" }}>
            No password needed. Check your inbox for a secure login link.
          </p>
        </div>
      ) : !activeQuestion ? (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid var(--yellow-20)", borderTopColor: "var(--yellow)", animation: "spin 1s linear infinite", marginInline: "auto", marginBottom: "1rem" }} />
          <p style={{ color: "var(--yellow)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>AI is thinking...</p>
        </div>
      ) : (
        <div key={activeQuestion.title} style={{ animation: "questionFadeIn 0.4s easeOut" }}>
          <h3 style={{ color: "var(--white)", fontSize: "1.25rem", marginBottom: "0.5rem", fontWeight: 700 }}>{activeQuestion.title}</h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>{activeQuestion.description}</p>
          
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {activeQuestion.options.map((opt, i) => (
              <button key={i} onClick={() => handleSelectOption(opt)} className="assess-option">
                {opt}
              </button>
            ))}
            
            {!showCustomInput ? (
               <button onClick={() => setShowCustomInput(true)} className="assess-option" style={{ borderStyle: "dashed", opacity: 0.6 }}>Other / Type your own...</button>
            ) : (
              <div style={{ marginTop: "0.5rem" }}>
                 <textarea 
                  autoFocus
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Tell the AI more..."
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--yellow-20)", borderRadius: "4px", padding: "0.875rem", color: "white", fontSize: "0.9rem", marginBottom: "0.75rem" }}
                 />
                 <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button onClick={() => setShowCustomInput(false)} className="btn btn-ghost btn-sm">Cancel</button>
                    <button onClick={handleCustomSubmit} disabled={!customInput.trim()} className="btn btn-primary btn-sm">Submit <ChevronRight size={14} /></button>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes assessFadeIn { from { opacity: 0; transform: translateY(10px); } }
        @keyframes questionFadeIn { from { opacity: 0; transform: translateX(5px); } }
        .assess-option { width: 100%; text-align: left; padding: 1rem 1.25rem; background: rgba(255,255,255,0.03); border: 1px solid var(--yellow-20); border-radius: 6px; color: rgba(255,255,255,0.85); font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
        .assess-option:hover { background: rgba(255,255,255,0.07); border-color: var(--yellow-40); }
      `}} />
    </div>
  );
}
