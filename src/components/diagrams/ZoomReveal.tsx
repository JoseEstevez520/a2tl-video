import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface Theme {
  name: string;
  colors: { bg: string; bg2: string; ink: string; inkSoft: string; inkFaint: string; grid: string; green: string; red: string; amber: string; purple: string; };
  fonts: { display: string; body: string; mono: string; };
  grid: boolean;
}

interface ZoomRevealProps {
  theme: Theme;
  timing: { start: number; end?: number };
  items: { text: string; detail?: string }[];
  style?: "zoom-in" | "zoom-out" | "zoom-through";
}

/**
 * ZoomReveal — items revealed by zooming in/out, creating depth.
 * Each item zooms from large/blurry to focused, then gives way to the next.
 * Great for: drilling down into concepts, progressive detail, layer reveals.
 */
export const ZoomReveal: React.FC<ZoomRevealProps> = ({
  theme,
  timing,
  items,
  style = "zoom-through",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(timing.start * fps);
  const endFrame = timing.end ? Math.round(timing.end * fps) : startFrame + items.length * 60;
  const totalDur = endFrame - startFrame;
  const localFrame = frame - startFrame;

  const itemDur = totalDur / items.length;

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: 0, height: 900,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {items.map((item, i) => {
        const itemStart = i * itemDur;
        const itemEnd = (i + 1) * itemDur;

        if (localFrame < itemStart - 5 || localFrame > itemEnd + 5) return null;

        const progress = (localFrame - itemStart) / itemDur; // 0→1

        // Zoom through: starts far away (small), zooms in, then zooms past (large)
        let scale: number, opacity: number, blur: number;

        if (style === "zoom-through") {
          scale = interpolate(progress, [0, 0.3, 0.7, 1], [0.5, 1, 1, 2], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          opacity = interpolate(progress, [0, 0.15, 0.7, 1], [0, 1, 1, 0], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          blur = interpolate(progress, [0, 0.2, 0.65, 1], [8, 0, 0, 8], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
        } else if (style === "zoom-in") {
          scale = interpolate(progress, [0, 0.4, 1], [2, 1, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          opacity = interpolate(progress, [0, 0.3, 0.8, 1], [0, 1, 1, 0], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          blur = interpolate(progress, [0, 0.3, 1], [6, 0, 0], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
        } else {
          // zoom-out
          scale = interpolate(progress, [0, 0.4, 1], [0.3, 1, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          opacity = interpolate(progress, [0, 0.25, 0.75, 1], [0, 1, 1, 0], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          blur = interpolate(progress, [0, 0.25, 1], [4, 0, 0], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
        }

        return (
          <div key={i} style={{
            position: "absolute",
            textAlign: "center",
            opacity,
            transform: `scale(${scale})`,
            filter: `blur(${blur}px)`,
          }}>
            <div style={{
              fontFamily: theme.fonts.display,
              fontSize: 64,
              color: theme.colors.ink,
            }}>
              {item.text}
            </div>
            {item.detail && (
              <div style={{
                fontFamily: theme.fonts.body,
                fontSize: 24,
                color: theme.colors.inkSoft,
                marginTop: 16,
                opacity: interpolate(progress, [0.2, 0.4], [0, 1], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                }),
              }}>
                {item.detail}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
