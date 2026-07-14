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

interface WordRevealProps {
  theme: Theme;
  timing: { start: number; end?: number };
  text: string;
  delay?: number;
  stagger?: number;
  font?: "display" | "body" | "mono";
  color?: string;
  fontSize?: number;
  align?: "left" | "center" | "right";
}

export const WordReveal: React.FC<WordRevealProps> = ({
  theme,
  timing,
  text,
  delay = 0,
  stagger = 4,
  font = "display",
  color,
  fontSize = 48,
  align = "center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps - delay;
  const words = text.split(" ");
  const fontFamily = theme.fonts[font] ?? theme.fonts.display;
  const textColor = color ?? theme.colors.ink;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: `${fontSize * 0.28}px`,
        justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        alignItems: "baseline",
        fontFamily,
        fontSize,
        lineHeight: 1.25,
        padding: `${fontSize * 0.1}px 0`,
      }}
    >
      {words.map((word, i) => {
        const wordFrame = localFrame - i * stagger;

        const opacity = interpolate(wordFrame, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const translateY = interpolate(wordFrame, [0, 14], [fontSize * 0.4, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const blur = interpolate(wordFrame, [0, 12], [4, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              color: textColor,
              opacity,
              transform: `translateY(${translateY}px)`,
              filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
              willChange: "transform, opacity",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
