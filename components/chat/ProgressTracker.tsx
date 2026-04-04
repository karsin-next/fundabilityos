import { INTERVIEW_QUESTIONS } from "@/lib/prompts";

interface Props {
  currentQuestion: number; // 1-based, 0 = not started
  totalQuestions?: number;
}

const DIMENSION_LABELS: Record<string, string> = {
  "Problem / Solution":  "Problem",
  "Market Size":         "Market",
  "Revenue":             "Revenue",
  "Product Stage":       "Product",
  "Team":                "Team",
  "Financials / Runway": "Runway",
  "Previous Funding":    "Funding",
  "Customer Acquisition":"Growth",
  "Competition":         "Moat",
  "Milestones":          "Milestones",
  "IP / Moat":           "IP",
  "Self-Awareness":      "Clarity",
};

export default function ProgressTracker({ currentQuestion, totalQuestions = 12 }: Props) {
  const progress = Math.min((currentQuestion / totalQuestions) * 100, 100);

  return (
    <div style={{ width: "100%" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
        <span className="label-mono" style={{ color: "var(--yellow)", fontSize: "0.6rem" }}>
          FUNDABILITY INTERVIEW
        </span>
        <span className="label-metric" style={{ opacity: 0.5, fontSize: "0.65rem" }}>
          {currentQuestion} / {totalQuestions} questions
        </span>
      </div>

      {/* Main progress bar */}
      <div
        style={{
          height: "4px",
          backgroundColor: "rgba(255,216,0,0.12)",
          borderRadius: "2px",
          overflow: "hidden",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            backgroundColor: "var(--yellow)",
            borderRadius: "2px",
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* Dimension pills */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        {INTERVIEW_QUESTIONS.map((q, i) => {
          const isDone = i < currentQuestion;
          const isCurrent = i === currentQuestion - 1;
          const label = DIMENSION_LABELS[q.dimension] ?? q.dimension;

          return (
            <span
              key={q.index}
              style={{
                fontSize: "0.55rem",
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                padding: "3px 7px",
                borderRadius: "2px",
                fontFamily: "var(--font-sans)",
                transition: "all 0.3s ease",
                backgroundColor: isDone
                  ? "rgba(255,216,0,0.15)"
                  : isCurrent
                  ? "var(--yellow)"
                  : "rgba(255,255,255,0.04)",
                color: isDone
                  ? "var(--yellow)"
                  : isCurrent
                  ? "var(--navy)"
                  : "rgba(255,255,255,0.25)",
                border: isDone || isCurrent
                  ? "1px solid var(--yellow-20)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {isDone ? "✓ " : ""}{label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
