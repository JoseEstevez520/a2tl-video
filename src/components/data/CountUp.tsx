import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface Theme {
  name: string;
  colors: { bg: string; bg2: string; ink: string; inkSoft: string; inkFaint: string; grid: string; green: string; red: string; amber: string; purple: string; };
  fonts: { display: string; body: string; mono: string; };
  grid: boolean;
}

interface CountUpProps {
  theme: Theme;
  timing: { start: number; end?: number };
  value: number;
  prefix?: string;        // "$", "#", etc.
  suffix?: string;        // "%", "K", "M", etc.
  label?: string;         // description below the number
  decimals?: number;      // decimal places (default 0)
  color?: string;         // override number color
  size?: "small" | "medium" | "large" | "hero";
}

/**
 * CountUp — animated number counter with visual emphasis.
 * The number grows from 0 to target with a ring progress indicator.
 * Great for: metrics, statistics, KPIs, achievements.
 */
export const CountUp: React.FC<CountUpProps> = ({
  theme,
  timing,
  value,
  prefix = "",
  suffix = "",
  label,
  decimals = 0,
  color,
  size = "large",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(timing.start * fps);
  const localFrame = frame - startFrame;

  const sizeMap = { small: 48, medium: 72, large: 120, hero: 180 };
  const ringMap = { small: 60, medium: 90, large: 140, hero: 200 };
  const fontSize = sizeMap[size];
  const ringRadius = ringMap[size];

  // Count animation (spring-based for satisfying deceleration)
  const progress = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: { damping: 30, stiffness: 60 },
  });

  const currentValue = progress * value;
  const displayValue = currentValue.toFixed(decimals);

  // Ring progress
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference * (1 - progress);

  // Entrance
  const containerOpacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const containerScale = interpolate(localFrame, [0, 15], [0.9, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Label
  const labelOpacity = interpolate(localFrame, [20, 30], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const numberColor = color || theme.colors.ink;
  const ringColor = color || theme.colors.ink;

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: 0, height: 900,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity: containerOpacity,
      transform: `scale(${containerScale})`,
    }}>
      {/* Ring */}
      <div style={{ position: "relative", width: ringRadius * 2 + 40, height: ringRadius * 2 + 40 }}>
        <svg
          width={ringRadius * 2 + 40}
          height={ringRadius * 2 + 40}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Background ring */}
          <circle
            cx={ringRadius + 20}
            cy={ringRadius + 20}
            r={ringRadius}
            fill="none"
            stroke={theme.colors.inkFaint}
            strokeWidth={3}
          />
          {/* Progress ring */}
          <circle
            cx={ringRadius + 20}
            cy={ringRadius + 20}
            r={ringRadius}
            fill="none"
            stroke={ringColor}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90, ${ringRadius + 20}, ${ringRadius + 20})`}
            opacity={0.6}
          />
        </svg>

        {/* Number */}
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontFamily: theme.fonts.display,
            fontSize,
            fontWeight: 400,
            color: numberColor,
            letterSpacing: "-0.02em",
          }}>
            {prefix}{displayValue}{suffix}
          </span>
        </div>
      </div>

      {/* Label */}
      {label && (
        <div style={{
          marginTop: 24,
          fontFamily: theme.fonts.body,
          fontSize: 22,
          color: theme.colors.inkSoft,
          opacity: labelOpacity,
          letterSpacing: "0.05em",
        }}>
          {label}
        </div>
      )}
    </div>
  );
};
