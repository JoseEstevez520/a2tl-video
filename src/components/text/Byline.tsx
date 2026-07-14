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

type BylinePosition = "bottom-right" | "bottom-center";

interface BylineProps {
  theme: Theme;
  timing: { start: number; end?: number };
  text: string;
  position?: BylinePosition;
}

export const Byline: React.FC<BylineProps> = ({
  theme,
  timing,
  text,
  position = "bottom-right",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;

  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const positionStyle: React.CSSProperties =
    position === "bottom-center"
      ? {
          left: 0,
          right: 0,
          bottom: 80,
          textAlign: "center",
        }
      : {
          right: 80,
          bottom: 80,
        };

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyle,
        opacity,
        fontFamily: theme.fonts.body,
        fontSize: 14,
        color: theme.colors.inkFaint,
        lineHeight: 1.5,
        willChange: "opacity",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
};
