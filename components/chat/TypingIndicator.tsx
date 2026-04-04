export default function TypingIndicator() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0 0.5rem",
      }}
    >
      {/* AI avatar */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "2px",
          backgroundColor: "var(--yellow)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.7rem",
          fontWeight: 900,
          color: "var(--navy)",
          letterSpacing: "0.05em",
          flexShrink: 0,
          fontFamily: "var(--font-sans)",
        }}
      >
        AI
      </div>

      {/* Dot animation */}
      <div
        style={{
          padding: "0.875rem 1.125rem",
          borderRadius: "0 8px 8px 8px",
          backgroundColor: "rgba(255,255,255,0.05)",
          border: "1px solid var(--yellow-20)",
          display: "flex",
          gap: "5px",
          alignItems: "center",
          height: "44px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: "block",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "var(--yellow)",
              opacity: 0.7,
              animation: `typing-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
