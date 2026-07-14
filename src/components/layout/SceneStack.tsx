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

interface Scene {
  id: string;
  duration: number;
  children: React.ReactNode;
  entrance?: "fade" | "slide-up" | "slide-left" | "scale" | "none";
  exit?: "fade" | "slide-down" | "slide-right" | "scale" | "none";
}

interface SceneStackProps {
  theme: Theme;
  timing: { start: number; end?: number };
  scenes: Scene[];
  transition?: "cut" | "fade" | "slide-left" | "slide-right" | "zoom";
}

const TRANSITION_OVERLAP = 0.5;
const ENTRANCE_DURATION = 0.3;
const EXIT_DURATION = 0.3;

export const SceneStack: React.FC<SceneStackProps> = ({
  theme,
  timing,
  scenes,
  transition = "fade",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;
  const T = transition === "cut" ? 0 : Math.round(TRANSITION_OVERLAP * fps);
  const entranceFrames = Math.round(ENTRANCE_DURATION * fps);
  const exitFrames = Math.round(EXIT_DURATION * fps);

  let cum = 0;
  const starts: number[] = scenes.map((s) => {
    const start = cum;
    cum += s.duration * fps;
    return start;
  });

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        backgroundColor: theme.colors.bg,
      }}
    >
      {scenes.map((scene, i) => {
        const start = starts[i];
        const end = start + scene.duration * fps;
        const renderFrom = Math.max(0, start - (i > 0 ? T : 0));
        if (localFrame < renderFrom || localFrame >= end) return null;

        const local = localFrame - start;
        const incoming = i > 0 && transition !== "cut" && localFrame < start;
        const outgoing =
          i < scenes.length - 1 && transition !== "cut" && localFrame >= end - T;

        // ── Container layer: transition (global scene change) ──

        let containerOpacity = 1;
        let containerTransform = "";

        if (incoming) {
          const progress = interpolate(
            localFrame,
            [start - T, start],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          switch (transition) {
            case "fade":
              containerOpacity = progress;
              break;
            case "slide-left":
              containerTransform = `translateX(${interpolate(progress, [0, 1], [width, 0])}px)`;
              break;
            case "slide-right":
              containerTransform = `translateX(${interpolate(progress, [0, 1], [-width, 0])}px)`;
              break;
            case "zoom":
              containerOpacity = progress;
              containerTransform = `scale(${interpolate(progress, [0, 1], [1.5, 1])})`;
              break;
          }
        }

        if (outgoing) {
          const progress = interpolate(
            localFrame,
            [end - T, end],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          switch (transition) {
            case "fade":
              containerOpacity = 1 - progress;
              break;
            case "slide-left":
              containerTransform = `translateX(${interpolate(progress, [0, 1], [0, -width])}px)`;
              break;
            case "slide-right":
              containerTransform = `translateX(${interpolate(progress, [0, 1], [0, width])}px)`;
              break;
            case "zoom":
              containerOpacity = 1 - progress;
              containerTransform = `scale(${interpolate(progress, [0, 1], [1, 0.3])})`;
              break;
          }
        }

        // ── Content layer: entrance / exit (scene-local element animation) ──

        let contentOpacity = 1;
        let contentTransform = "";

        if (local >= 0 && local < entranceFrames && scene.entrance && scene.entrance !== "none") {
          const p = interpolate(local, [0, entranceFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          switch (scene.entrance) {
            case "fade":
              contentOpacity = p;
              break;
            case "slide-up":
              contentOpacity = p;
              contentTransform = `translateY(${interpolate(p, [0, 1], [50, 0])}px)`;
              break;
            case "slide-left":
              contentTransform = `translateX(${interpolate(p, [0, 1], [50, 0])}px)`;
              break;
            case "scale":
              contentOpacity = p;
              contentTransform = `scale(${interpolate(p, [0, 1], [0.8, 1])})`;
              break;
          }
        }

        if (scene.exit && scene.exit !== "none") {
          const exitStart = scene.duration * fps - exitFrames;
          if (local >= exitStart) {
            const p = interpolate(local, [exitStart, exitStart + exitFrames], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            switch (scene.exit) {
              case "fade":
                contentOpacity = 1 - p;
                break;
              case "slide-down":
                contentOpacity = 1 - p;
                contentTransform = `translateY(${interpolate(p, [0, 1], [0, 50])}px)`;
                break;
              case "slide-right":
                contentTransform = `translateX(${interpolate(p, [0, 1], [0, 50])}px)`;
                break;
              case "scale":
                contentOpacity = 1 - p;
                contentTransform = `scale(${interpolate(p, [0, 1], [1, 0.8])})`;
                break;
            }
          }
        }

        return (
          <div
            key={scene.id}
            style={{
              position: "absolute",
              inset: 0,
              opacity: containerOpacity,
              transform: containerTransform || undefined,
              willChange: "transform, opacity",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                opacity: contentOpacity,
                transform: contentTransform || undefined,
                willChange: "transform, opacity",
              }}
            >
              {scene.children}
            </div>
          </div>
        );
      })}
    </div>
  );
};
