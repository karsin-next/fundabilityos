"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Send, ArrowRight, RotateCcw } from "lucide-react";
import MessageBubble from "@/components/chat/MessageBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ProgressTracker from "@/components/chat/ProgressTracker";
import ScoreGaugeMock from "@/components/score/ScoreGaugeMock";
import type { ScoringResult } from "@/lib/scoring";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const OPENING_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi! I'm your FundabilityOS advisor. I'll ask you 12 focused questions to assess your investor readiness — same criteria VCs use in a first call.\n\nThis takes about 10 minutes. Be as specific as you can; vague answers lower your score.\n\nLet's start: What does your startup do, and what specific problem does it solve for your customers?",
};

type InterviewState = "idle" | "chatting" | "scoring" | "done" | "error";

export default function InterviewPage() {
  const [messages, setMessages] = useState<Message[]>([OPENING_MESSAGE]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<InterviewState>("chatting");
  const [isAITyping, setIsAITyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAITyping, streamingContent]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ============================================================
  // Extract interview answers from JSON message
  // ============================================================
  function extractAnswers(jsonText: string): Record<string, unknown> | null {
    try {
      // Strip markdown code fences that Claude sometimes wraps JSON in
      const cleaned = jsonText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      
      const match = cleaned.match(/\{[\s\S]*"interview_complete"[\s\S]*\}/);
      if (!match) return null;
      const parsed = JSON.parse(match[0]);
      return parsed.interview_complete === true ? parsed.answers : null;
    } catch {
      return null;
    }
  }

  // ============================================================
  // Run scoring API
  // ============================================================
  const runScoring = useCallback(async (answers: Record<string, unknown>) => {
    setState("scoring");
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Scoring failed");
      const result: ScoringResult = await res.json();
      setScoringResult(result);
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Scoring failed");
      setState("error");
    }
  }, []);

  // ============================================================
  // Send message + stream response
  // ============================================================
  const sendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || state !== "chatting" || isAITyping) return;

    const userMsg: Message = { role: "user", content: userInput.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsAITyping(true);
    setStreamingContent("");

    // Abort previous request if any
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.error) throw new Error(json.error);
            if (json.done) break;
            if (json.delta) {
              full += json.delta;
              setStreamingContent(full);
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      // Commit the streamed message
      const aiMsg: Message = { role: "assistant", content: full };
      setMessages((prev) => [...prev, aiMsg]);
      setStreamingContent("");
      setIsAITyping(false);

      // Only trigger scoring if we have answered all 12 questions AND valid JSON is returned
      // This prevents Claude from accidentally outputting JSON early
      const userTurnCount = updatedMessages.filter((m) => m.role === "user").length;
      const answers = extractAnswers(full);
      if (answers && userTurnCount >= 12) {
        await runScoring(answers);
      } else {
        // Increment question counter (user just answered one)
        setCurrentQuestion((prev) => Math.min(prev + 1, 12));
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setIsAITyping(false);
      setStreamingContent("");
      setErrorMsg(err instanceof Error ? err.message : "Connection error");
      setState("error");
    }
  }, [messages, state, isAITyping, runScoring]);

  // Handle keyboard submit
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleReset() {
    abortRef.current?.abort();
    setMessages([OPENING_MESSAGE]);
    setInput("");
    setState("chatting");
    setIsAITyping(false);
    setStreamingContent("");
    setCurrentQuestion(1);
    setScoringResult(null);
    setErrorMsg("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // ============================================================
  // SCORING PANEL
  // ============================================================
  if (state === "scoring") {
    return (
      <div style={fullPageStyle}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ position: "relative", width: "64px", height: "64px", marginInline: "auto", marginBottom: "1.5rem" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", border: "3px solid var(--yellow-20)", borderTopColor: "var(--yellow)", animation: "spin 1s linear infinite" }} />
          </div>
          <h2 className="heading-section" style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            Calculating your score…
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", lineHeight: 1.7 }}>
            Our AI is analyzing your answers across 8 investor dimensions. This usually takes under 30 seconds.
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============================================================
  // RESULTS PANEL
  // ============================================================
  if (state === "done" && scoringResult) {
    const { score, band, component_scores, top_3_gaps, investor_loves, investor_concerns, action_items, summary_paragraph } = scoringResult;
    const COMPONENT_META = [
      { key: "problem_clarity", label: "Problem Clarity", max: 15 },
      { key: "revenue", label: "Revenue", max: 20 },
      { key: "runway", label: "Runway", max: 15 },
      { key: "team_size", label: "Team", max: 10 },
      { key: "product_stage", label: "Product Stage", max: 10 },
      { key: "previous_funding", label: "Prev. Funding", max: 10 },
      { key: "market_size", label: "Market Size", max: 10 },
      { key: "ai_confidence", label: "AI Confidence", max: 10 },
    ];

    return (
      <div style={{ paddingTop: "68px", backgroundColor: "var(--navy)", minHeight: "100vh" }}>
        {/* Score header */}
        <section style={{ borderBottom: "3px solid var(--yellow)", padding: "3rem 0 2rem" }}>
          <div className="container result-header-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}>
            <div>
              <span className="tag-badge" style={{ marginBottom: "1rem" }}>Assessment Complete</span>
              <h1 className="heading-section" style={{ marginBottom: "1rem" }}>
                Your Fundability Score
              </h1>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", lineHeight: 1.75, maxWidth: "28rem" }}>
                {summary_paragraph}
              </p>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.75rem", flexWrap: "wrap" }}>
                {score < 60 ? (
                  <Link href="/interview" onClick={handleReset} className="btn btn-primary btn-lg">
                    Retake with Better Answers
                  </Link>
                ) : (
                  <Link href="/report" className="btn btn-primary btn-lg">
                    Unlock Full Report — $29
                    <ArrowRight size={16} />
                  </Link>
                )}
                <button onClick={handleReset} className="btn btn-ghost">
                  <RotateCcw size={14} /> Start Over
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
              <ScoreGaugeMock score={score} band={band} />
              {/* Component bars */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {COMPONENT_META.map(({ key, label, max }) => {
                  const val = component_scores[key as keyof typeof component_scores] ?? 0;
                  const pct = (val / max) * 100;
                  const colour = pct >= 70 ? "var(--green)" : pct >= 40 ? "var(--amber)" : "var(--red)";
                  return (
                    <div key={key}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)" }}>{label}</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: colour }}>{val}/{max}</span>
                      </div>
                      <div className="dimension-bar-track">
                        <div className="dimension-bar-fill" style={{ width: `${pct}%`, backgroundColor: colour }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <style>{`@media(max-width:768px){.result-header-grid{grid-template-columns:1fr!important;}}`}</style>
        </section>

        {/* Gaps + Action Plan */}
        <section style={{ padding: "3rem 0" }}>
          <div className="container">
            <div className="result-body-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              {/* Top 3 gaps */}
              <div>
                <p className="label-mono" style={{ color: "var(--yellow)", marginBottom: "1.25rem" }}>Top 3 Gaps to Fix</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {top_3_gaps.map((gap) => (
                    <div key={gap.dimension} style={{ padding: "1.125rem", borderLeft: `3px solid ${gap.priority === "high" ? "var(--red)" : gap.priority === "medium" ? "var(--amber)" : "var(--green)"}`, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "0 4px 4px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: gap.priority === "high" ? "var(--red)" : gap.priority === "medium" ? "var(--amber)" : "var(--green)" }}>{gap.dimension}</span>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{gap.score}/{gap.max} pts</span>
                      </div>
                      <p style={{ fontSize: "0.825rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginBottom: "0.5rem" }}>{gap.explanation}</p>
                      <p style={{ fontSize: "0.775rem", color: "var(--yellow)", lineHeight: 1.6 }}>→ {gap.fix}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 30-day action plan */}
              <div>
                <p className="label-mono" style={{ color: "var(--yellow)", marginBottom: "1.25rem" }}>30-Day Action Plan</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {action_items.map((item) => (
                    <div key={item.week} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      <span style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--yellow)", color: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 900, flexShrink: 0, fontFamily: "var(--font-sans)" }}>W{item.week}</span>
                      <div>
                        <p style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--white)", marginBottom: "0.2rem" }}>{item.action}</p>
                        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>{item.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Investor loves / concerns */}
                <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <p className="label-mono" style={{ color: "var(--green)", marginBottom: "0.625rem", fontSize: "0.6rem" }}>Investors Will Love</p>
                    {investor_loves.map((l, i) => <p key={i} style={{ fontSize: "0.775rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: "0.375rem" }}>✓ {l}</p>)}
                  </div>
                  <div>
                    <p className="label-mono" style={{ color: "var(--red)", marginBottom: "0.625rem", fontSize: "0.6rem" }}>Expect Pushback On</p>
                    {investor_concerns.map((c, i) => <p key={i} style={{ fontSize: "0.775rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: "0.375rem" }}>⚠ {c}</p>)}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA bar */}
            <div style={{ marginTop: "3rem", padding: "2rem", border: "1px solid var(--yellow-20)", borderRadius: "4px", backgroundColor: "rgba(255,216,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
              <div>
                <p className="label-mono" style={{ color: "var(--yellow)", marginBottom: "0.25rem", fontSize: "0.6rem" }}>Want the full 8-page report?</p>
                <p style={{ fontSize: "0.9rem", color: "var(--white)", fontWeight: 700 }}>Unlock your Investor-Ready Report — $29 one-time</p>
                <p style={{ fontSize: "0.775rem", color: "rgba(255,255,255,0.45)", marginTop: "0.25rem" }}>Includes PDF, shareable URL, and full gap analysis in investor language.</p>
              </div>
              <Link href="/report" className="btn btn-primary btn-lg">
                Get Full Report — $29 <ArrowRight size={15} />
              </Link>
            </div>
          </div>
          <style>{`@media(max-width:768px){.result-body-grid{grid-template-columns:1fr!important;}}`}</style>
        </section>
      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================
  if (state === "error") {
    return (
      <div style={fullPageStyle}>
        <div style={{ textAlign: "center", maxWidth: "380px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
          <h2 className="heading-section" style={{ fontSize: "1.35rem", marginBottom: "0.75rem", color: "var(--red)" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            {errorMsg || "An unexpected error occurred. Your progress is saved."}
          </p>
          <button onClick={handleReset} className="btn btn-primary">
            <RotateCcw size={14} /> Start Again
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN CHAT UI
  // ============================================================
  const userTurns = messages.filter((m) => m.role === "user").length;
  const displayQuestion = Math.min(userTurns + 1, 12);

  return (
    <div style={{ paddingTop: "68px", height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--navy)" }}>
      {/* Fixed header */}
      <div style={{ borderBottom: "1px solid var(--yellow-20)", padding: "1rem", backgroundColor: "rgba(2,47,66,0.97)", backdropFilter: "blur(8px)", flexShrink: 0 }}>
        <div className="container" style={{ maxWidth: "760px" }}>
          <ProgressTracker currentQuestion={displayQuestion} />
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1rem" }}>
        <div style={{ maxWidth: "760px", marginInline: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))}

          {/* Streaming message */}
          {isAITyping && streamingContent && (
            <MessageBubble role="assistant" content={streamingContent} isStreaming />
          )}

          {/* Typing indicator (before first chunk arrives) */}
          {isAITyping && !streamingContent && <TypingIndicator />}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div style={{ borderTop: "1px solid var(--yellow-20)", padding: "1rem", flexShrink: 0, backgroundColor: "rgba(2,47,66,0.97)", backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: "760px", marginInline: "auto" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAITyping ? "Waiting for AI…" : "Type your answer and press Enter"}
              disabled={isAITyping}
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid var(--yellow-20)",
                borderRadius: "4px",
                padding: "0.75rem 1rem",
                fontSize: "0.9rem",
                color: "var(--white)",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.5,
                maxHeight: "160px",
                overflowY: "auto",
                transition: "border-color 0.2s ease",
                outline: "none",
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--yellow)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--yellow-20)"; }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isAITyping}
              className="btn btn-primary"
              style={{ flexShrink: 0, height: "44px", width: "44px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: !input.trim() || isAITyping ? 0.4 : 1 }}
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </div>
          <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", marginTop: "0.5rem", textAlign: "center", letterSpacing: "0.05em" }}>
            Enter to send · Shift+Enter for new line · Your answers are private
          </p>
        </div>
      </div>
    </div>
  );
}

const fullPageStyle: React.CSSProperties = {
  minHeight: "100vh",
  paddingTop: "68px",
  backgroundColor: "var(--navy)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "68px 1.25rem 3rem",
};
