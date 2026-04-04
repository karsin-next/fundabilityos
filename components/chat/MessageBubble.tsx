interface Props {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function MessageBubble({ role, content, isStreaming = false }: Props) {
  const isAI = role === "assistant";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isAI ? "row" : "row-reverse",
        gap: "0.75rem",
        alignItems: "flex-start",
        padding: "0 0.5rem",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: isAI ? "2px" : "50%",
          flexShrink: 0,
          backgroundColor: isAI ? "var(--yellow)" : "rgba(255,255,255,0.1)",
          border: isAI ? "none" : "1px solid var(--yellow-20)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.7rem",
          fontWeight: 900,
          color: isAI ? "var(--navy)" : "rgba(255,255,255,0.6)",
          letterSpacing: "0.05em",
          marginTop: "2px",
          fontFamily: "var(--font-sans)",
        }}
      >
        {isAI ? "AI" : "U"}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "78%",
          padding: "0.875rem 1.125rem",
          borderRadius: isAI ? "0 8px 8px 8px" : "8px 0 8px 8px",
          backgroundColor: isAI
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,216,0,0.12)",
          border: isAI
            ? "1px solid var(--yellow-20)"
            : "1px solid rgba(255,216,0,0.25)",
          fontSize: "0.9rem",
          lineHeight: 1.7,
          color: isAI ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.78)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          position: "relative",
        }}
      >
        {content}
        {isStreaming && (
          <span
            style={{
              display: "inline-block",
              width: "2px",
              height: "1em",
              backgroundColor: "var(--yellow)",
              marginLeft: "2px",
              verticalAlign: "text-bottom",
              animation: "blink 1s step-end infinite",
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
