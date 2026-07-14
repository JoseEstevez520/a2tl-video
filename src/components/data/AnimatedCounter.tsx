import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface Theme {
  name: string;
  colors: { bg: string; bg2: string; ink: string; inkSoft: string; inkFaint: string; grid: string; green: string; red: string; amber: string; purple: string; };
  fonts: { display: string; body: string; mono: string; };
  grid: boolean;
}

interface AnimatedCounterProps {
  theme: Theme;
  timing: { start: number; end?: number };
  from: number;
  to: number;
  format?: "integer" | "decimal" | "currency" | "percent";
  prefix?: string;
  suffix?: string;
  fontSize?: number;
  color?: string;
}

function formatNumber(value: number, fmt: AnimatedCounterProps["format"]): string {
  switch (fmt) {
    case "currency":
      return "$" + Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case "percent":
      return value.toFixed(1) + "%";
    case "decimal":
      return value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    case "integer":
    default:
      return Math.round(value).toLocaleString("en-US");
  }
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  theme,
  timing,
  from,
  to,
  format = "integer",
  prefix = "",
  suffix = "",
  fontSize = 96,
  color,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const startFrame = Math.round(timing.start * fps);
  const localFrame = frame - startFrame;

  const progress = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.6 },
  });

  const currentValue = interpolate(progress, [0, 1], [from, to]);
  const displayValue = prefix + formatNumber(currentValue, format) + suffix;

  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const scale = interpolate(localFrame, [0, 15], [0.8, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const textColor = color || theme.colors.ink;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <defs>
        <filter id="counter-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={theme.fonts.display}
        fontSize={fontSize}
        fontWeight={700}
        fill={textColor}
        opacity={opacity}
        transform={`scale(${scale})`}
        style={{ transformOrigin: `${width / 2}px ${height / 2}px` }}
        filter="url(#counter-glow)"
      >
        {displayValue}
      </text>
    </svg>
  );
};
