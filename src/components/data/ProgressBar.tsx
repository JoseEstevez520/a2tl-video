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

interface BarItem {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
}

interface ProgressBarProps {
  theme: Theme;
  timing: { start: number; end?: number };
  bars: BarItem[];
  showValues?: boolean;
  style?: "rounded" | "sharp" | "gradient";
  layout?: "vertical-stack" | "horizontal";
  width?: number;
}

// Frames before the fill starts after the track appears
const TRACK_DELAY = 12; // ~0.2s at 60fps
// Each bar starts this many frames after the previous
const BAR_STAGGER = 8;

const AUTO_COLORS = ["green", "purple", "amber", "red"] as const;

export const ProgressBar: React.FC<ProgressBarProps> = ({
  theme,
  timing,
  bars,
  showValues = true,
  style = "rounded",
  layout = "vertical-stack",
  width = 720,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;

  const scopeId = `pb-${timing.start}`.replace(".", "_");

  const isStack = layout === "vertical-stack";
  const isRounded = style === "rounded";
  const isGradient = style === "gradient";

  const borderRadius = isRounded ? 8 : 0;

  const LABEL_W = 140;
  const VALUE_W = showValues ? 60 : 0;
  const BAR_AREA_W = width - LABEL_W - VALUE_W - 32; // 32px for gaps
  const BAR_H = 22;
  const ROW_GAP = 18;

  const getBarColor = (bar: BarItem, i: number) => {
    if (bar.color) return bar.color;
    const key = AUTO_COLORS[i % AUTO_COLORS.length];
    return theme.colors[key];
  };

  if (isStack) {
    return (
      <div
        style={{
          width,
          fontFamily: theme.fonts.body,
          display: "flex",
          flexDirection: "column",
          gap: ROW_GAP,
          position: "relative",
        }}
      >
        {bars.map((bar, i) => {
          const max = bar.maxValue ?? 100;
          const ratio = Math.min(1, Math.max(0, bar.value / max));

          const barFrame = localFrame - i * BAR_STAGGER;

          // Row fade + slide in from top
          const rowOpacity = interpolate(barFrame, [0, 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const rowSlideY = interpolate(barFrame, [0, 14], [-12, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          if (rowOpacity <= 0.01) return null;

          // Track appears first, then fill starts TRACK_DELAY frames later
          const trackOpacity = interpolate(barFrame, [0, 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const fillFrame = barFrame - TRACK_DELAY;
          const fillProgress = spring({
            frame: fillFrame,
            fps,
            config: { damping: 20, stiffness: 100 },
          });
          const fillW = BAR_AREA_W * ratio * Math.min(1, fillProgress);

          // Count-up value
          const displayValue = Math.round(bar.value * Math.min(1, fillProgress));

          const color = getBarColor(bar, i);

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: rowOpacity,
                transform: `translateY(${rowSlideY}px)`,
              }}
            >
              {/* Label */}
              <div
                style={{
                  width: LABEL_W,
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.colors.inkSoft,
                  textAlign: "right",
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {bar.label}
              </div>

              {/* Bar track + fill */}
              <div
                style={{
                  flex: 1,
                  height: BAR_H,
                  background: theme.colors.inkFaint,
                  borderRadius,
                  position: "relative",
                  overflow: "hidden",
                  opacity: trackOpacity,
                }}
              >
                {/* Fill */}
                {fillW > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: fillW,
                      borderRadius,
                      background: isGradient
                        ? `linear-gradient(90deg, ${theme.colors.ink} 0%, ${theme.colors.purple} 100%)`
                        : color,
                      boxShadow: `0 0 12px ${color}55`,
                    }}
                  />
                )}
              </div>

              {/* Value */}
              {showValues && (
                <div
                  style={{
                    width: VALUE_W,
                    flexShrink: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: isGradient ? theme.colors.purple : color,
                    fontFamily: theme.fonts.mono,
                    textAlign: "left",
                  }}
                >
                  {displayValue}
                  {bar.maxValue == null ? "%" : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── HORIZONTAL layout (bars side-by-side as columns) ───────────────────────
  const COL_W = Math.floor((width - (bars.length - 1) * 16) / bars.length);
  const MAX_BAR_H = 200;

  return (
    <div
      style={{
        width,
        fontFamily: theme.fonts.body,
        display: "flex",
        alignItems: "flex-end",
        gap: 16,
        position: "relative",
      }}
    >
      {bars.map((bar, i) => {
        const max = bar.maxValue ?? 100;
        const ratio = Math.min(1, Math.max(0, bar.value / max));

        const barFrame = localFrame - i * BAR_STAGGER;

        const colOpacity = interpolate(barFrame, [0, 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const colSlideY = interpolate(barFrame, [0, 14], [12, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        if (colOpacity <= 0.01) return null;

        const trackOpacity = interpolate(barFrame, [0, 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const fillFrame = barFrame - TRACK_DELAY;
        const fillProgress = spring({
          frame: fillFrame,
          fps,
          config: { damping: 20, stiffness: 100 },
        });
        const fillH = MAX_BAR_H * ratio * Math.min(1, fillProgress);

        const displayValue = Math.round(bar.value * Math.min(1, fillProgress));

        const color = getBarColor(bar, i);

        return (
          <div
            key={i}
            style={{
              width: COL_W,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              opacity: colOpacity,
              transform: `translateY(${colSlideY}px)`,
            }}
          >
            {/* Value above bar */}
            {showValues && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isGradient ? theme.colors.purple : color,
                  fontFamily: theme.fonts.mono,
                }}
              >
                {displayValue}
                {bar.maxValue == null ? "%" : ""}
              </div>
            )}

            {/* Column track */}
            <div
              style={{
                width: "100%",
                height: MAX_BAR_H,
                background: theme.colors.inkFaint,
                borderRadius,
                position: "relative",
                overflow: "hidden",
                opacity: trackOpacity,
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              {fillH > 0 && (
                <div
                  style={{
                    width: "100%",
                    height: fillH,
                    borderRadius,
                    background: isGradient
                      ? `linear-gradient(180deg, ${theme.colors.purple} 0%, ${theme.colors.ink} 100%)`
                      : color,
                    boxShadow: `0 0 12px ${color}55`,
                  }}
                />
              )}
            </div>

            {/* Label below */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: theme.colors.inkSoft,
                textAlign: "center",
                letterSpacing: "0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
              }}
            >
              {bar.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
