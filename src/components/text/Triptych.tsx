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

interface TriptychProps {
  theme: Theme;
  timing: { start: number; end?: number };
  items: string[];
  reveal?: "stagger" | "simultaneous";
}

const STAGGER_SECONDS = 0.3;

export const Triptych: React.FC<TriptychProps> = ({
  theme,
  timing,
  items,
  reveal = "stagger",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;
  const staggerFrames = STAGGER_SECONDS * fps;

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
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 100,
        }}
      >
        {items.slice(0, 3).map((item, i) => {
          const itemDelay = reveal === "stagger" ? i * staggerFrames : 0;
          const itemFrame = localFrame - itemDelay;

          const opacity = interpolate(itemFrame, [0, 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const translateY = interpolate(itemFrame, [0, 16], [24, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          // Underline draws on: width goes from 0% to 100%
          const underlineProgress = interpolate(itemFrame, [10, 26], [0, 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity,
                transform: `translateY(${translateY}px)`,
                willChange: "transform, opacity",
              }}
            >
              <span
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: 34,
                  color: theme.colors.ink,
                  letterSpacing: "0.06em",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {item}
              </span>
              {/* Underline that draws on */}
              <div
                style={{
                  marginTop: 10,
                  height: 3,
                  width: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${underlineProgress}%`,
                    backgroundColor: theme.colors.ink,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
