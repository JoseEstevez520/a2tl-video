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

interface ParticleFieldProps {
  theme: Theme;
  timing: { start: number; end?: number };
  count?: number;
  speed?: number;
  opacity?: number;
  color?: string;
  size?: "small" | "medium" | "mixed";
  pattern?: "drift" | "rise" | "orbit";
}

// Golden ratio for deterministic placement
const PHI = 1.6180339887;

function getParticleRadius(
  index: number,
  size: "small" | "medium" | "mixed"
): number {
  if (size === "small") return 2 + (index % 3) * 0.67; // 2–4px
  if (size === "medium") return 4 + (index % 5) * 0.8; // 4–8px
  // mixed: 2–8px based on index
  return 2 + (index % 7) * 0.86;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
  theme,
  timing,
  count = 40,
  speed = 1,
  opacity = 0.3,
  color,
  size = "mixed",
  pattern = "drift",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;

  // Fade in over first 30 frames
  const fadeIn = interpolate(localFrame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const particleColor = color ?? theme.colors.ink;

  // Unique filter IDs scoped to this timing.start to avoid SVG id collisions
  const glowFilterId = `pf-glow-${timing.start}`;

  const particles = Array.from({ length: count }, (_, i) => {
    // Golden ratio spiral for initial placement — fully deterministic
    const angle = i * PHI * 2 * Math.PI;
    const frac = (i + 0.5) / count; // normalized radius fraction

    // Base positions as fractions [0,1]
    let baseX: number;
    let baseY: number;

    if (pattern === "orbit") {
      // Spread around center at varying distances
      const dist = 0.08 + frac * 0.42;
      baseX = 0.5 + Math.cos(angle) * dist;
      baseY = 0.5 + Math.sin(angle) * dist * 0.6; // slight ellipse
    } else {
      // Golden ratio spiral mapped onto canvas
      baseX = (i * PHI) % 1;
      baseY = (i * PHI * PHI) % 1;
    }

    const radius = getParticleRadius(i, size);

    // Per-particle frequency offsets — deterministic, no Math.random
    const freqX = 0.008 + (i % 7) * 0.0015;
    const freqY = 0.005 + (i % 5) * 0.0012;
    const phaseX = i * 1.2;
    const phaseY = i * 0.9;

    let dx = 0;
    let dy = 0;

    if (pattern === "drift") {
      dx = Math.sin(localFrame * freqX * speed + phaseX) * 0.04 * width;
      dy = Math.sin(localFrame * freqY * speed + phaseY) * 0.025 * height;
    } else if (pattern === "rise") {
      // Move upward, wrap around
      const rise = ((localFrame * speed * (0.2 + frac * 0.3) + i * 23) %
        (height + radius * 2)) -
        radius;
      dx = Math.sin(localFrame * freqX * speed + phaseX) * 0.025 * width;
      dy = -(rise - baseY * height);
    } else if (pattern === "orbit") {
      // Orbit around center at varying angular speed
      const angularSpeed = (0.003 + (i % 5) * 0.0006) * speed;
      const dist = (0.08 + frac * 0.42) * Math.min(width, height) * 0.5;
      const currentAngle = angle + localFrame * angularSpeed;
      const orbitX = width * 0.5 + Math.cos(currentAngle) * dist;
      const orbitY = height * 0.5 + Math.sin(currentAngle) * dist * 0.6;
      dx = orbitX - baseX * width;
      dy = orbitY - baseY * height;
    }

    const cx = baseX * width + dx;
    const cy = baseY * height + dy;

    // Per-particle opacity: some at full, some dimmer
    const particleOpacity = opacity * (0.4 + (i % 5) * 0.12);

    // Every 4th particle gets a subtle glow filter
    const hasGlow = i % 4 === 0;

    return { cx, cy, radius, particleOpacity, hasGlow };
  });

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: fadeIn,
      }}
    >
      <defs>
        <filter id={glowFilterId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {particles.map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={p.radius}
          fill={particleColor}
          opacity={p.particleOpacity}
          filter={p.hasGlow ? `url(#${glowFilterId})` : undefined}
        />
      ))}
    </svg>
  );
};
