"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, ChevronRight } from "lucide-react";
import ProgressTracker from "@/components/chat/ProgressTracker";
import ScoreGaugeMock from "@/components/score/ScoreGaugeMock";
import type { ScoringResult } from "@/lib/scoring";

type InterviewState = "idle" | "loading_question" | "answering" | "scoring" | "done" | "error";

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
  
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
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
        runScoring(data.extracted_data);
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
      fetchNextNode([]);
    }
  }, [fetchNextNode]);

  const runScoring = async (structuredData: Record<string, unknown>) => {
    setState("scoring");
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: structuredData }),
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
      <div style={{ padding: "2rem", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--yellow-20)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ color: "var(--white)", fontWeight: 700 }}>Analysis Complete</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--yellow)" }}>Band: {scoringResult.band}</p>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--yellow)" }}>{scoringResult.score}</div>
        </div>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          {scoringResult.summary_paragraph}
        </p>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link href={`/report/${scoringResult.score}`} className="btn btn-primary btn-sm">View Full Report <ArrowRight size={14} /></Link>
          <button onClick={handleReset} className="btn btn-ghost btn-sm">Retake</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: "600px", padding: padding, animation: "assessFadeIn 0.5s ease" }}>
      <div style={{ marginBottom: "2rem" }}>
        <ProgressTracker currentDimension={activeQuestion?.dimension} coveredDimensions={coveredDimensions} />
      </div>

      {!activeQuestion ? (
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
