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

interface Step {
  label: string;
  description: string;
}

interface StepSequenceProps {
  theme: Theme;
  timing: { start: number; end?: number };
  steps: Step[];
}

export const StepSequence: React.FC<StepSequenceProps> = ({
  theme,
  timing,
  steps,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const startFrame = timing.start * fps;
  const endFrame = timing.end != null ? timing.end * fps : durationInFrames;
  const totalDuration = endFrame - startFrame;

  const localFrame = frame - startFrame;
  const framesPerStep = totalDuration / steps.length;

  const activeIndex = Math.min(
    Math.floor(Math.max(localFrame, 0) / framesPerStep),
    steps.length - 1
  );

  // Frame offset within the current step
  const stepLocalFrame = localFrame - activeIndex * framesPerStep;

  const labelOpacity = interpolate(stepLocalFrame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelY = spring({
    frame: stepLocalFrame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });

  const labelTranslateY = interpolate(labelY, [0, 1], [30, 0]);

  const descOpacity = interpolate(stepLocalFrame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const descTranslateY = interpolate(stepLocalFrame, [8, 22], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const activeStep = steps[activeIndex];

  // Step counter dots
  const dotsOpacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        flexDirection: "column",
        gap: 24,
        pointerEvents: "none",
      }}
    >
      {/* Step indicator dots */}
      <div
        style={{
          display: "flex",
          gap: 10,
          opacity: dotsOpacity,
          marginBottom: 12,
        }}
      >
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor:
                i === activeIndex ? theme.colors.ink : theme.colors.inkFaint,
              transition: undefined,
            }}
          />
        ))}
      </div>

      {/* Active step label */}
      <div
        style={{
          opacity: labelOpacity,
          transform: `translateY(${labelTranslateY}px)`,
          willChange: "transform, opacity",
          fontFamily: theme.fonts.mono,
          fontSize: 56,
          fontWeight: 600,
          color: theme.colors.ink,
          textAlign: "center",
          letterSpacing: "0.02em",
          lineHeight: 1.15,
          padding: "0 80px",
        }}
      >
        {activeStep?.label}
      </div>

      {/* Active step description */}
      <div
        style={{
          opacity: descOpacity,
          transform: `translateY(${descTranslateY}px)`,
          willChange: "transform, opacity",
          fontFamily: theme.fonts.body,
          fontSize: 26,
          color: theme.colors.inkSoft,
          textAlign: "center",
          lineHeight: 1.5,
          padding: "0 120px",
          maxWidth: 860,
        }}
      >
        {activeStep?.description}
      </div>
    </div>
  );
};
