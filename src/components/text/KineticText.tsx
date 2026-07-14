import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface Theme {
  name: string;
  colors: { bg: string; bg2: string; ink: string; inkSoft: string; inkFaint: string; grid: string; green: string; red: string; amber: string; purple: string; };
  fonts: { display: string; body: string; mono: string; };
  grid: boolean;
}

interface KineticTextProps {
  theme: Theme;
  timing: { start: number; end?: number };
  text: string;
  animation?: "fade" | "slide-up" | "scale" | "blur" | "color-pop";
  unit?: "word" | "character";
  staggerMs?: number;
  fontSize?: number;
  align?: "left" | "center";
}

function getBlurFilterDefs(anim: string) {
  if (anim !== "blur") return null;
  return (
    <filter id="kinetic-blur">
      <feGaussianBlur in="SourceGraphic" result="blur" />
    </filter>
  );
}

const FONT_WEIGHT = 600;

export const KineticText: React.FC<KineticTextProps> = ({
  theme,
  timing,
  text,
  animation = "slide-up",
  unit = "word",
  staggerMs = 60,
  fontSize = 48,
  align = "left",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const startFrame = Math.round(timing.start * fps);
  const localFrame = frame - startFrame;

  const staggerFrames = Math.round((staggerMs / 1000) * fps);

  const parts = unit === "character" ? text.split("") : text.split(" ");
  const gap = unit === "character" ? fontSize * 0.05 : fontSize * 0.35;
  const textAnchor = align === "center" ? "middle" : "start";
  const xPos = align === "center" ? width / 2 : 80;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <defs>
        {getBlurFilterDefs(animation)}
      </defs>
      <text
        x={xPos}
        y={height / 2}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontFamily={theme.fonts.display}
        fontSize={fontSize}
        fontWeight={FONT_WEIGHT}
        fill={theme.colors.ink}
      >
        {parts.map((part, i) => {
          const partFrame = localFrame - i * staggerFrames;

          let opacity = 1;
          let transform = "";
          let fill = theme.colors.ink;
          let blurVal = 0;

          switch (animation) {
            case "fade":
              opacity = interpolate(partFrame, [0, 12], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              });
              break;
            case "slide-up":
              opacity = interpolate(partFrame, [0, 14], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              });
              transform = `translateY(${interpolate(partFrame, [0, 14], [20, 0], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              })}px)`;
              break;
            case "scale": {
              const s = spring({
                frame: Math.max(0, partFrame),
                fps,
                config: { damping: 14, stiffness: 100, mass: 0.5 },
              });
              opacity = interpolate(partFrame, [0, 4], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              });
              transform = `scale(${s})`;
              break;
            }
            case "blur":
              opacity = interpolate(partFrame, [0, 18], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              });
              blurVal = interpolate(partFrame, [0, 18], [6, 0], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              });
              break;
            case "color-pop":
              opacity = interpolate(partFrame, [0, 16], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              });
              fill = interpolate(partFrame, [0, 16], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              }) > 0.5 ? theme.colors.ink : theme.colors.inkFaint;
              break;
          }

          const isSpace = part === " ";

          return (
            <tspan
              key={i}
              dx={i === 0 ? 0 : gap}
              dy={unit === "character" && part === " " ? 0 : 0}
              fill={isSpace ? "transparent" : fill}
              opacity={isSpace ? 0 : opacity}
              style={{
                transition: "none",
                transform,
                transformOrigin: `${xPos}px ${height / 2}px`,
                filter: animation === "blur" && blurVal > 0.3
                  ? `url(#kinetic-blur)`
                  : undefined,
              }}
            >
              {part === " " ? "\u00A0" : part}
            </tspan>
          );
        })}
      </text>
    </svg>
  );
};
