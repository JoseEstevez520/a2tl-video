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

interface FadeTextProps {
  theme: Theme;
  timing: { start: number; end?: number };
  text: string;
  font?: "display" | "body" | "mono";
  fontSize?: number;
  align?: string;
}

export const FadeText: React.FC<FadeTextProps> = ({
  theme,
  timing,
  text,
  font = "display",
  fontSize = 56,
  align = "center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;

  const opacity = interpolate(localFrame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(localFrame, [0, 18], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fontFamily = theme.fonts[font] ?? theme.fonts.display;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          fontFamily,
          fontSize,
          color: theme.colors.ink,
          textAlign: align as React.CSSProperties["textAlign"],
          lineHeight: 1.3,
          willChange: "transform, opacity",
          padding: "0 80px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {text}
      </div>
    </div>
  );
};
