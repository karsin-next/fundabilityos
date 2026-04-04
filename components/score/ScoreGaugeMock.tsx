"use client";

import { useEffect, useState } from "react";

interface Props {
  score: number;
  band: string;
  compact?: boolean;
}

const BAND_COLOURS: Record<string, string> = {
  "Pre-Ready":      "#EF4444",
  "Early-Stage":    "#F59E0B",
  "Investor-Ready": "#10B981",
  "Top 10%":        "#FFD800",
};

// SVG arc parameters
const RADIUS = 54;
const CIRCUMFERENCE = Math.PI * RADIUS; // half-circle arc length

export default function ScoreGaugeMock({ score, band, compact = false }: Props) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const colour = BAND_COLOURS[band] ?? "#FFD800";
  const fillLength = animated ? (score / 100) * CIRCUMFERENCE : 0;
  const dashOffset = CIRCUMFERENCE - fillLength;

  const svgSize = compact ? 160 : 200;
  const cx = svgSize / 2;
  const cy = compact ? 90 : 110;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
      <svg
        width={svgSize}
        height={compact ? 95 : 120}
        viewBox={`0 0 ${svgSize} ${compact ? 95 : 120}`}
        style={{ overflow: "visible" }}
      >
        {/* Track */}
        <path
          d={`M ${cx - RADIUS} ${cy} A ${RADIUS} ${RADIUS} 0 0 1 ${cx + RADIUS} ${cy}`}
          fill="none"
          stroke="rgba(255,216,0,0.12)"
          strokeWidth={compact ? 6 : 8}
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - RADIUS} ${cy} A ${RADIUS} ${RADIUS} 0 0 1 ${cx + RADIUS} ${cy}`}
          fill="none"
          stroke={colour}
          strokeWidth={compact ? 6 : 8}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Score number */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill={colour}
          fontSize={compact ? "28" : "36"}
          fontWeight="900"
          fontFamily="Montserrat, sans-serif"
        >
          {animated ? score : 0}
        </text>
        <text
          x={cx}
          y={cy + (compact ? 12 : 16)}
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize={compact ? "9" : "10"}
          fontWeight="700"
          fontFamily="Montserrat, sans-serif"
          letterSpacing="2"
        >
          OUT OF 100
        </text>
      </svg>

      {/* Band badge */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          backgroundColor: colour,
          color: band === "Top 10%" ? "#022F42" : "#fff",
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          padding: "0.3rem 0.75rem",
          borderRadius: "2px",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "currentColor",
            opacity: 0.7,
          }}
        />
        {band}
      </span>
    </div>
  );
}
