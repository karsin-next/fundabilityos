const CORE_DIMENSIONS = [
  "Problem",
  "Market",
  "Revenue",
  "Stage",
  "Team",
  "Runway",
  "Funding",
  "Moat"
] as const;

export type DimensionType = typeof CORE_DIMENSIONS[number];

interface Props {
  currentDimension?: string;
  coveredDimensions?: string[];
}

export default function ProgressTracker({ currentDimension, coveredDimensions = [] }: Props) {
  // Normalize dimension names for comparison
  const normalize = (d: string) => d.split(" ")[0].trim();
  const currentNorm = currentDimension ? normalize(currentDimension) : "";
  const coveredNorms = coveredDimensions.map(normalize);

  return (
    <div className="w-full">
      {/* Header row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <span className="label-mono text-[#ffd800] text-[0.6rem] md:text-[0.65rem]">
          FundabilityOS QuickAssess
        </span>
        <span className="label-metric opacity-60 text-[0.6rem] md:text-[0.65rem] uppercase tracking-wider">
          Dynamic Profiling Active
        </span>
      </div>

      {/* Dimension grid */}
      <div className="flex gap-1.5 flex-wrap">
        {CORE_DIMENSIONS.map((dim) => {
          const isDone = coveredNorms.includes(normalize(dim));
          const isCurrent = normalize(dim) === currentNorm;

          return (
            <div
              key={dim}
              style={{
                fontSize: "0.55rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "4px 9px",
                borderRadius: "3px",
                fontFamily: "var(--font-sans)",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                backgroundColor: isCurrent 
                  ? "var(--yellow)" 
                  : isDone 
                  ? "rgba(255,216,0,0.12)" 
                  : "rgba(255,255,255,0.03)",
                color: isCurrent 
                  ? "var(--navy)" 
                  : isDone 
                  ? "var(--yellow)" 
                  : "rgba(255,255,255,0.2)",
                border: isCurrent
                  ? "1px solid var(--yellow)"
                  : "1px solid rgba(255,255,255,0.06)",
                boxShadow: isCurrent ? "0 0 15px rgba(255,216,0,0.3)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              {isDone && <span style={{ fontSize: "0.65rem" }}>✓</span>}
              {dim}
              {isCurrent && (
                <span style={{ 
                  width: "4px", 
                  height: "4px", 
                  borderRadius: "50%", 
                  backgroundColor: "var(--navy)",
                  animation: "pulse 1s infinite"
                }} />
              )}
            </div>
          );
        })}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
      `}} />
    </div>
  );
}
