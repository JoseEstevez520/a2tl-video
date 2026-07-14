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

interface TimelineEvent {
  label: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface TimelineProps {
  theme: Theme;
  timing: { start: number; end?: number };
  events: TimelineEvent[];
  direction?: "horizontal" | "vertical";
  style?: "dots" | "cards";
  width?: number;
  height?: number;
}

const AUTO_COLORS = [
  "green",
  "purple",
  "amber",
  "red",
  "ink",
] as const;

export const Timeline: React.FC<TimelineProps> = ({
  theme,
  timing,
  events,
  direction = "horizontal",
  style = "dots",
  width = 960,
  height = 320,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;

  const isHorizontal = direction === "horizontal";
  const isCards = style === "cards";

  // Layout constants
  const NODE_R = 8;
  const CARD_W = 160;
  const CARD_H = 90;
  const CARD_GAP = 12;

  // How many frames the full animation spans (use 120 as default "duration")
  const totalFrames = timing.end != null
    ? (timing.end - timing.start) * fps
    : 120;

  // Line draws over the first 40% of total duration
  const lineDrawFrames = totalFrames * 0.4;

  // Stagger between events
  const eventStagger = events.length > 1 ? lineDrawFrames / (events.length - 1) : 0;

  // Labels fade in 5 frames after their node
  const LABEL_DELAY = 5;

  const scopeId = `tl-${timing.start}`.replace(".", "_");

  // ── HORIZONTAL layout ──────────────────────────────────────────────────────
  if (isHorizontal) {
    const PAD_X = 48;
    const lineY = isCards ? height * 0.42 : height / 2;
    const lineX1 = PAD_X;
    const lineX2 = width - PAD_X;
    const lineLen = lineX2 - lineX1;

    // Evenly space nodes along the line
    const nodePositions = events.map((_, i) =>
      events.length === 1
        ? lineX1 + lineLen / 2
        : lineX1 + (lineLen / (events.length - 1)) * i
    );

    // How far the line has drawn
    const lineProgress = interpolate(localFrame, [0, lineDrawFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const lineDrawX = lineX1 + lineLen * lineProgress;

    // Total SVG height for dots-only vs cards
    const svgH = isCards ? height : height;

    return (
      <svg
        width={width}
        height={svgH}
        viewBox={`0 0 ${width} ${svgH}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          {events.map((ev, i) => {
            const key = AUTO_COLORS[i % AUTO_COLORS.length];
            const color = ev.color ?? theme.colors[key];
            return (
              <radialGradient key={i} id={`${scopeId}-glow-${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            );
          })}
        </defs>

        {/* Central line track */}
        <line
          x1={lineX1}
          y1={lineY}
          x2={lineX2}
          y2={lineY}
          stroke={theme.colors.inkFaint}
          strokeWidth={2}
          opacity={0.4}
        />

        {/* Line draw-on */}
        {lineProgress > 0 && (
          <line
            x1={lineX1}
            y1={lineY}
            x2={lineDrawX}
            y2={lineY}
            stroke={theme.colors.inkSoft}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.85}
          />
        )}

        {events.map((ev, i) => {
          const colorKey = AUTO_COLORS[i % AUTO_COLORS.length];
          const color = ev.color ?? theme.colors[colorKey];
          const nx = nodePositions[i];

          // Node springs in when the line reaches it
          const nodeFrame = localFrame - i * eventStagger;
          const nodeScale = spring({
            frame: nodeFrame,
            fps,
            config: { damping: 18, stiffness: 260 },
          });

          // Only show if line has reached this node
          const lineReachedNode = lineDrawX >= nx - NODE_R;
          const nodeOpacity = lineReachedNode
            ? interpolate(nodeFrame, [0, 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 0;

          const labelFrame = nodeFrame - LABEL_DELAY;
          const labelOpacity = interpolate(labelFrame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          // Alternate labels above / below
          const isAbove = i % 2 === 0;

          return (
            <g key={i}>
              {/* Node glow */}
              {nodeOpacity > 0.01 && (
                <circle
                  cx={nx}
                  cy={lineY}
                  r={NODE_R * 3.5 * nodeScale}
                  fill={`url(#${scopeId}-glow-${i})`}
                  opacity={nodeOpacity * 0.8}
                />
              )}

              {/* Node circle */}
              {nodeOpacity > 0.01 && (
                <circle
                  cx={nx}
                  cy={lineY}
                  r={NODE_R * nodeScale}
                  fill={color}
                  opacity={nodeOpacity}
                />
              )}

              {/* Node icon / inner dot */}
              {nodeOpacity > 0.01 && !ev.icon && (
                <circle
                  cx={nx}
                  cy={lineY}
                  r={NODE_R * 0.4 * nodeScale}
                  fill={theme.colors.bg}
                  opacity={nodeOpacity}
                />
              )}
              {nodeOpacity > 0.01 && ev.icon && (
                <text
                  x={nx}
                  y={lineY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={NODE_R * 1.1 * nodeScale}
                  opacity={nodeOpacity}
                >
                  {ev.icon}
                </text>
              )}

              {/* Card style */}
              {isCards && labelOpacity > 0.01 && (
                <g
                  transform={`translate(${nx - CARD_W / 2}, ${
                    isAbove ? lineY - NODE_R - CARD_GAP - CARD_H : lineY + NODE_R + CARD_GAP
                  })`}
                  opacity={labelOpacity}
                >
                  <rect
                    width={CARD_W}
                    height={CARD_H}
                    rx={10}
                    fill={theme.colors.bg2}
                    stroke={color}
                    strokeWidth={1}
                    strokeOpacity={0.4}
                  />
                  {/* Color accent bar top */}
                  <rect
                    x={0}
                    y={isAbove ? CARD_H - 3 : 0}
                    width={CARD_W}
                    height={3}
                    rx={2}
                    fill={color}
                    opacity={0.55}
                  />
                  <text
                    x={CARD_W / 2}
                    y={30}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={theme.colors.ink}
                    fontSize={13}
                    fontWeight={700}
                    fontFamily={theme.fonts.body}
                  >
                    {ev.label}
                  </text>
                  {ev.description && (
                    <foreignObject x={10} y={46} width={CARD_W - 20} height={CARD_H - 52}>
                      <div
                        // @ts-ignore
                        xmlns="http://www.w3.org/1999/xhtml"
                        style={{
                          fontSize: 10,
                          color: theme.colors.inkSoft,
                          fontFamily: theme.fonts.body,
                          lineHeight: 1.45,
                          textAlign: "center",
                        }}
                      >
                        {ev.description}
                      </div>
                    </foreignObject>
                  )}
                </g>
              )}

              {/* Dots style label */}
              {!isCards && labelOpacity > 0.01 && (
                <g opacity={labelOpacity}>
                  {/* Tick line */}
                  <line
                    x1={nx}
                    y1={isAbove ? lineY - NODE_R - 2 : lineY + NODE_R + 2}
                    x2={nx}
                    y2={isAbove ? lineY - NODE_R - 16 : lineY + NODE_R + 16}
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.4}
                  />
                  <text
                    x={nx}
                    y={isAbove ? lineY - NODE_R - 22 : lineY + NODE_R + 26}
                    textAnchor="middle"
                    dominantBaseline={isAbove ? "auto" : "hanging"}
                    fill={theme.colors.ink}
                    fontSize={12}
                    fontWeight={600}
                    fontFamily={theme.fonts.body}
                  >
                    {ev.label}
                  </text>
                  {ev.description && (
                    <text
                      x={nx}
                      y={isAbove ? lineY - NODE_R - 36 : lineY + NODE_R + 40}
                      textAnchor="middle"
                      dominantBaseline={isAbove ? "auto" : "hanging"}
                      fill={theme.colors.inkSoft}
                      fontSize={10}
                      fontFamily={theme.fonts.body}
                    >
                      {ev.description}
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // ── VERTICAL layout ────────────────────────────────────────────────────────
  const PAD_Y = 40;
  const lineX = isCards ? width * 0.35 : width / 2;
  const lineY1 = PAD_Y;
  const lineY2 = height - PAD_Y;
  const lineLen = lineY2 - lineY1;

  const nodePositions = events.map((_, i) =>
    events.length === 1
      ? lineY1 + lineLen / 2
      : lineY1 + (lineLen / (events.length - 1)) * i
  );

  const lineProgress = interpolate(localFrame, [0, lineDrawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineDrawY = lineY1 + lineLen * lineProgress;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        {events.map((ev, i) => {
          const key = AUTO_COLORS[i % AUTO_COLORS.length];
          const color = ev.color ?? theme.colors[key];
          return (
            <radialGradient key={i} id={`${scopeId}-glow-${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          );
        })}
      </defs>

      {/* Track line */}
      <line
        x1={lineX}
        y1={lineY1}
        x2={lineX}
        y2={lineY2}
        stroke={theme.colors.inkFaint}
        strokeWidth={2}
        opacity={0.4}
      />

      {/* Draw-on line */}
      {lineProgress > 0 && (
        <line
          x1={lineX}
          y1={lineY1}
          x2={lineX}
          y2={lineDrawY}
          stroke={theme.colors.inkSoft}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.85}
        />
      )}

      {events.map((ev, i) => {
        const colorKey = AUTO_COLORS[i % AUTO_COLORS.length];
        const color = ev.color ?? theme.colors[colorKey];
        const ny = nodePositions[i];

        const nodeFrame = localFrame - i * eventStagger;
        const nodeScale = spring({
          frame: nodeFrame,
          fps,
          config: { damping: 18, stiffness: 260 },
        });

        const lineReachedNode = lineDrawY >= ny - NODE_R;
        const nodeOpacity = lineReachedNode
          ? interpolate(nodeFrame, [0, 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        const labelFrame = nodeFrame - LABEL_DELAY;
        const labelOpacity = interpolate(labelFrame, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Alternate left / right
        const isLeft = i % 2 === 0;
        const LABEL_OFFSET_X = 20;

        return (
          <g key={i}>
            {/* Glow */}
            {nodeOpacity > 0.01 && (
              <circle
                cx={lineX}
                cy={ny}
                r={NODE_R * 3.5 * nodeScale}
                fill={`url(#${scopeId}-glow-${i})`}
                opacity={nodeOpacity * 0.8}
              />
            )}

            {/* Node */}
            {nodeOpacity > 0.01 && (
              <circle
                cx={lineX}
                cy={ny}
                r={NODE_R * nodeScale}
                fill={color}
                opacity={nodeOpacity}
              />
            )}

            {nodeOpacity > 0.01 && !ev.icon && (
              <circle
                cx={lineX}
                cy={ny}
                r={NODE_R * 0.4 * nodeScale}
                fill={theme.colors.bg}
                opacity={nodeOpacity}
              />
            )}
            {nodeOpacity > 0.01 && ev.icon && (
              <text
                x={lineX}
                y={ny}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={NODE_R * 1.1 * nodeScale}
                opacity={nodeOpacity}
              >
                {ev.icon}
              </text>
            )}

            {/* Card */}
            {isCards && labelOpacity > 0.01 && (
              <g
                transform={`translate(${
                  isLeft ? lineX - NODE_R - LABEL_OFFSET_X - CARD_W : lineX + NODE_R + LABEL_OFFSET_X
                }, ${ny - CARD_H / 2})`}
                opacity={labelOpacity}
              >
                <rect
                  width={CARD_W}
                  height={CARD_H}
                  rx={10}
                  fill={theme.colors.bg2}
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.4}
                />
                <rect
                  x={isLeft ? CARD_W - 3 : 0}
                  y={0}
                  width={3}
                  height={CARD_H}
                  rx={2}
                  fill={color}
                  opacity={0.55}
                />
                <text
                  x={CARD_W / 2}
                  y={28}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={theme.colors.ink}
                  fontSize={13}
                  fontWeight={700}
                  fontFamily={theme.fonts.body}
                >
                  {ev.label}
                </text>
                {ev.description && (
                  <foreignObject x={10} y={44} width={CARD_W - 20} height={CARD_H - 50}>
                    <div
                      // @ts-ignore
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        fontSize: 10,
                        color: theme.colors.inkSoft,
                        fontFamily: theme.fonts.body,
                        lineHeight: 1.45,
                        textAlign: "center",
                      }}
                    >
                      {ev.description}
                    </div>
                  </foreignObject>
                )}
              </g>
            )}

            {/* Dots label */}
            {!isCards && labelOpacity > 0.01 && (
              <g opacity={labelOpacity}>
                <line
                  x1={isLeft ? lineX - NODE_R - 2 : lineX + NODE_R + 2}
                  y1={ny}
                  x2={isLeft ? lineX - NODE_R - 16 : lineX + NODE_R + 16}
                  y2={ny}
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.4}
                />
                <text
                  x={isLeft ? lineX - NODE_R - 22 : lineX + NODE_R + 22}
                  y={ny - 6}
                  textAnchor={isLeft ? "end" : "start"}
                  dominantBaseline="auto"
                  fill={theme.colors.ink}
                  fontSize={12}
                  fontWeight={600}
                  fontFamily={theme.fonts.body}
                >
                  {ev.label}
                </text>
                {ev.description && (
                  <text
                    x={isLeft ? lineX - NODE_R - 22 : lineX + NODE_R + 22}
                    y={ny + 10}
                    textAnchor={isLeft ? "end" : "start"}
                    dominantBaseline="hanging"
                    fill={theme.colors.inkSoft}
                    fontSize={10}
                    fontFamily={theme.fonts.body}
                  >
                    {ev.description}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
