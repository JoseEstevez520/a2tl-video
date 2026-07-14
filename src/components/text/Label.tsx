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

type LabelPosition = "center" | "upper-left" | "upper-right" | "bottom-center";

interface LabelProps {
  theme: Theme;
  timing: { start: number; end?: number };
  text: string;
  position?: LabelPosition;
}

const positionStyles: Record<LabelPosition, React.CSSProperties> = {
  center: {
    left: 0,
    right: 0,
    top: 520,
    textAlign: "center",
  },
  "upper-left": {
    left: 80,
    top: 100,
  },
  "upper-right": {
    right: 80,
    top: 100,
  },
  "bottom-center": {
    left: 0,
    right: 0,
    bottom: 120,
    textAlign: "center",
  },
};

export const Label: React.FC<LabelProps> = ({
  theme,
  timing,
  text,
  position = "center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;

  const opacity = interpolate(localFrame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(localFrame, [0, 14], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles[position],
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: theme.fonts.body,
        fontSize: 16,
        fontWeight: 600,
        color: theme.colors.inkSoft,
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        willChange: "transform, opacity",
      }}
    >
      {text}
    </div>
  );
};
