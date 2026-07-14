import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface Theme {
  name: string;
  colors: {
    bg: string;
    bg2: string;
    ink: string;
    inkSoft: string;
    inkFaint: string;
    grid: string;
    green: string;
    red: string;
    amber: string;
    purple: string;
  };
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
  grid: boolean;
}

interface GlowOrbProps {
  theme: Theme;
  timing: { start: number; end?: number };
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  opacity?: number;
  pulse?: boolean;
}

export const GlowOrb: React.FC<GlowOrbProps> = ({
  theme,
  timing,
  x = 50,
  y = 40,
  size = 300,
  color,
  opacity = 0.08,
  pulse = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;

  // Fade in over 20 frames
  const fadeIn = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const orbColor = color ?? theme.colors.ink;

  // Subtle scale pulsing: 4-second period (4 * fps frames)
  // sine wave: 0.95 → 1.05
  const pulsePeriod = 4 * fps;
  const pulseScale = pulse
    ? 0.95 + 0.05 * (1 + Math.sin((localFrame / pulsePeriod) * 2 * Math.PI)) * 0.5
    : 1;
  // Simplifies to: 0.95 + 0.05 * (0.5 + 0.5 * sin(...)) = 0.975 + 0.025 * sin(...)
  // Range: 0.95 at sin=-1, 1.00 at sin=0, 1.05 at sin=1 → correct

  const cx = (x / 100) * width;
  const cy = (y / 100) * height;
  const r = size * pulseScale;

  // Unique gradient id to avoid collisions across multiple orbs
  const gradId = `go-grad-${timing.start}-${x}-${y}`;

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: fadeIn * opacity,
      }}
    >
      <defs>
        <radialGradient
          id={gradId}
          cx={cx}
          cy={cy}
          r={r}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={orbColor} stopOpacity="1" />
          <stop offset="60%" stopColor={orbColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={orbColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse
        cx={cx}
        cy={cy}
        rx={r}
        ry={r * 0.85}
        fill={`url(#${gradId})`}
      />
    </svg>
  );
};
