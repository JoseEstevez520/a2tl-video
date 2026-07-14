import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

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

interface SplitScreenProps {
  theme: Theme;
  timing: { start: number; end?: number };
  left: { title: string; content: string; color?: string };
  right: { title: string; content: string; color?: string };
  divider?: "line" | "vs" | "arrow" | "none";
  animation?: "slide-in" | "wipe" | "fade";
}

export const SplitScreen: React.FC<SplitScreenProps> = ({
  theme,
  timing,
  left,
  right,
  divider = "line",
  animation = "slide-in",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;

  // --- slide-in animation values ---
  const slideSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 20, stiffness: 100, mass: 0.9 },
    durationInFrames: 40,
  });
  const leftX = interpolate(slideSpring, [0, 1], [-200, 0]);
  const rightX = interpolate(slideSpring, [0, 1], [200, 0]);

  // --- fade animation values ---
  const fadeOpacity = interpolate(localFrame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeScale = interpolate(localFrame, [0, 18], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- wipe animation: two-phase bar sweep ---
  // Phase 1 (frames 0-20): left bar sweeps from 0→50% of frame width, revealing left half
  // Phase 2 (frames 16-36): right bar sweeps from 50%→100%, revealing right half
  const leftWipeProgress = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightWipeProgress = interpolate(localFrame, [16, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Divider fade-in (slightly delayed)
  const dividerOpacity = interpolate(localFrame, [12, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const PANEL_W = 940;
  const GAP = 40;
  const PANEL_H = height - 160; // vertical padding

  const leftColor = left.color ?? theme.colors.green;
  const rightColor = right.color ?? theme.colors.purple;

  // Compute per-animation panel styles
  const getPanelStyle = (side: "left" | "right"): React.CSSProperties => {
    if (animation === "slide-in") {
      return {
        transform: `translateX(${side === "left" ? leftX : rightX}px)`,
        opacity: 1,
      };
    }
    if (animation === "fade") {
      return {
        transform: `scale(${fadeScale})`,
        opacity: fadeOpacity,
      };
    }
    // wipe: panels are always present; clipping handled by overlay
    return { opacity: 1 };
  };

  const renderDivider = () => {
    if (divider === "none") return null;

    const centerX = width / 2;

    if (divider === "line") {
      return (
        <div
          style={{
            position: "absolute",
            left: centerX - 1,
            top: 80,
            width: 2,
            height: PANEL_H,
            backgroundColor: theme.colors.inkFaint,
            opacity: dividerOpacity,
          }}
        />
      );
    }

    if (divider === "vs") {
      return (
        <div
          style={{
            position: "absolute",
            left: centerX,
            top: "50%",
            transform: "translate(-50%, -50%)",
            opacity: dividerOpacity,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          {/* Circle backdrop */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: theme.colors.bg,
              border: `2px solid ${theme.colors.inkFaint}`,
              position: "absolute",
            }}
          />
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 18,
              fontWeight: 700,
              color: theme.colors.inkSoft,
              letterSpacing: "0.06em",
              position: "relative",
              zIndex: 1,
            }}
          >
            VS
          </span>
        </div>
      );
    }

    if (divider === "arrow") {
      return (
        <div
          style={{
            position: "absolute",
            left: centerX,
            top: "50%",
            transform: "translate(-50%, -50%)",
            opacity: dividerOpacity,
            zIndex: 10,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M6 18 H30 M20 8 L30 18 L20 28"
              stroke={theme.colors.inkSoft}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          position: "absolute",
          left: width / 2 - GAP / 2 - PANEL_W,
          top: 80,
          width: PANEL_W,
          height: PANEL_H,
          ...getPanelStyle("left"),
          willChange: "transform, opacity",
          // wipe clip
          ...(animation === "wipe"
            ? {
                clipPath: `inset(0 ${(1 - leftWipeProgress) * 100}% 0 0)`,
              }
            : {}),
        }}
      >
        <PanelCard
          title={left.title}
          content={left.content}
          accentColor={leftColor}
          theme={theme}
          width={PANEL_W}
          height={PANEL_H}
        />
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          position: "absolute",
          left: width / 2 + GAP / 2,
          top: 80,
          width: PANEL_W,
          height: PANEL_H,
          ...getPanelStyle("right"),
          willChange: "transform, opacity",
          // wipe clip
          ...(animation === "wipe"
            ? {
                clipPath: `inset(0 0 0 ${(1 - rightWipeProgress) * 100}%)`,
              }
            : {}),
        }}
      >
        <PanelCard
          title={right.title}
          content={right.content}
          accentColor={rightColor}
          theme={theme}
          width={PANEL_W}
          height={PANEL_H}
        />
      </div>

      {/* DIVIDER */}
      {renderDivider()}
    </div>
  );
};

// ─── Internal panel card ────────────────────────────────────────────────────

interface PanelCardProps {
  title: string;
  content: string;
  accentColor: string;
  theme: Theme;
  width: number;
  height: number;
}

const PanelCard: React.FC<PanelCardProps> = ({
  title,
  content,
  accentColor,
  theme,
  width,
  height,
}) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: theme.colors.bg2,
        borderRadius: 12,
        borderTop: `4px solid ${accentColor}`,
        padding: "40px 48px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: theme.fonts.display,
          fontSize: 28,
          fontWeight: 700,
          color: theme.colors.ink,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </div>

      {/* Separator */}
      <div
        style={{
          height: 1,
          backgroundColor: theme.colors.inkFaint,
          opacity: 0.5,
        }}
      />

      {/* Content */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 20,
          color: theme.colors.inkSoft,
          lineHeight: 1.65,
          flex: 1,
        }}
      >
        {content}
      </div>
    </div>
  );
};
