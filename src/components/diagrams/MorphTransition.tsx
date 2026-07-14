import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface Theme {
  name: string;
  colors: { bg: string; bg2: string; ink: string; inkSoft: string; inkFaint: string; grid: string; green: string; red: string; amber: string; purple: string; };
  fonts: { display: string; body: string; mono: string; };
  grid: boolean;
}

interface MorphTransitionProps {
  theme: Theme;
  timing: { start: number; end?: number };
  from: { text: string; subtitle?: string };
  to: { text: string; subtitle?: string };
  style?: "scale-swap" | "morph-blur" | "flip-3d";
}

/**
 * MorphTransition — a smooth transformation between two states.
 * Shows "from" state, morphs into "to" state with a visual transformation.
 * Great for: before/after, problem→solution, concept evolution.
 */
export const MorphTransition: React.FC<MorphTransitionProps> = ({
  theme,
  timing,
  from,
  to,
  style = "scale-swap",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(timing.start * fps);
  const endFrame = timing.end ? Math.round(timing.end * fps) : startFrame + 150;
  const totalDur = endFrame - startFrame;
  const localFrame = frame - startFrame;

  const midpoint = totalDur * 0.45; // "from" stays slightly longer

  // Phase: 0→midpoint = "from", midpoint→end = "to"
  const fromOpacity = interpolate(localFrame, [0, 15, midpoint - 10, midpoint], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const toOpacity = interpolate(localFrame, [midpoint, midpoint + 15, totalDur], [0, 1, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Scale swap
  const fromScale = interpolate(localFrame, [midpoint - 15, midpoint], [1, 0.85], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const toScale = interpolate(localFrame, [midpoint, midpoint + 20], [1.15, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Blur morph
  const fromBlur = interpolate(localFrame, [midpoint - 10, midpoint], [0, 12], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const toBlur = interpolate(localFrame, [midpoint, midpoint + 12], [12, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // 3D flip
  const flipAngle = interpolate(localFrame, [midpoint - 15, midpoint + 15], [0, 180], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Accent line progress
  const lineWidth = interpolate(localFrame, [midpoint - 5, midpoint + 25], [0, 400], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: 0, right: 0, top: 0, height: 900,
    display: "flex", alignItems: "center", justifyContent: "center",
    perspective: 800,
  };

  const textBase: React.CSSProperties = {
    position: "absolute",
    textAlign: "center",
    maxWidth: 1400,
  };

  const getTransform = (phase: "from" | "to") => {
    if (style === "scale-swap") {
      return `scale(${phase === "from" ? fromScale : toScale})`;
    }
    if (style === "morph-blur") {
      return `scale(${phase === "from" ? fromScale : toScale})`;
    }
    if (style === "flip-3d") {
      const angle = phase === "from" ? flipAngle : flipAngle - 180;
      return `rotateY(${angle}deg)`;
    }
    return "";
  };

  const getFilter = (phase: "from" | "to") => {
    if (style === "morph-blur") {
      return `blur(${phase === "from" ? fromBlur : toBlur}px)`;
    }
    return "";
  };

  return (
    <div style={containerStyle}>
      {/* FROM state */}
      <div style={{
        ...textBase,
        opacity: fromOpacity,
        transform: getTransform("from"),
        filter: getFilter("from"),
        backfaceVisibility: "hidden",
      }}>
        <div style={{
          fontFamily: theme.fonts.display, fontSize: 72, color: theme.colors.ink,
        }}>{from.text}</div>
        {from.subtitle && (
          <div style={{
            fontFamily: theme.fonts.body, fontSize: 24, color: theme.colors.inkSoft,
            marginTop: 16,
          }}>{from.subtitle}</div>
        )}
      </div>

      {/* TO state */}
      <div style={{
        ...textBase,
        opacity: toOpacity,
        transform: getTransform("to"),
        filter: getFilter("to"),
        backfaceVisibility: "hidden",
      }}>
        <div style={{
          fontFamily: theme.fonts.display, fontSize: 72, color: theme.colors.ink,
        }}>{to.text}</div>
        {to.subtitle && (
          <div style={{
            fontFamily: theme.fonts.body, fontSize: 24, color: theme.colors.inkSoft,
            marginTop: 16,
          }}>{to.subtitle}</div>
        )}
      </div>

      {/* Accent line during morph */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "58%",
        width: lineWidth,
        height: 3,
        background: theme.colors.ink,
        transform: "translateX(-50%)",
        opacity: interpolate(localFrame,
          [midpoint - 5, midpoint, midpoint + 25, midpoint + 35],
          [0, 0.6, 0.6, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        ),
      }} />
    </div>
  );
};
