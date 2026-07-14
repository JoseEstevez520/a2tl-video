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

interface AnimatedChartProps {
  theme: Theme;
  timing: { start: number; end?: number };
  type: "bar" | "line" | "horizontal-bar";
  title?: string;
  data: { label: string; value: number; color?: string }[];
  showValues?: boolean;
  showGrid?: boolean;
  animate?: "grow" | "stagger" | "count-up";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_W = 1400;
const CHART_H = 600;

const AUTO_PALETTE = [
  // resolved at render time from theme
  "ink",
  "purple",
  "green",
  "amber",
  "red",
] as const;

// Timing offsets in frames
const T_TITLE_START = 0; // title fades in
const T_GRID_START = 9; // 0.3s @ 30fps
const T_GRID_END = 21;
const T_BARS_START = 15; // 0.5s @ 30fps
const BAR_GROW_FRAMES = 20;
const BAR_STAGGER = 6;
const SPRING_CFG = { damping: 15, stiffness: 120 } as const;

// Layout for bar chart
const PAD_LEFT = 60;
const PAD_RIGHT = 40;
const PAD_TOP = 80; // below title
const PAD_BOTTOM = 60; // below x-axis labels
const GRID_LINES = 5;
const BAR_RADIUS = 8;
const BAR_FILL_RATIO = 0.8; // bars take 80% of slot width

// Layout for horizontal bar chart
const HBAR_LABEL_W = 160;
const HBAR_VALUE_W = 80;
const HBAR_H = 48;
const HBAR_GAP = 16;
const HBAR_PAD_V = 40;

// ─── Helper: resolve auto color ───────────────────────────────────────────────

function resolveColor(
  dataColor: string | undefined,
  index: number,
  theme: Theme
): string {
  if (dataColor) return dataColor;
  const key = AUTO_PALETTE[index % AUTO_PALETTE.length];
  return theme.colors[key];
}

// ─── Helper: rounded-top rectangle path ───────────────────────────────────────

function roundedTopRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): string {
  const safeR = Math.min(r, w / 2, h / 2);
  if (h <= 0) return "";
  return [
    `M ${x + safeR} ${y}`,
    `H ${x + w - safeR}`,
    `Q ${x + w} ${y} ${x + w} ${y + safeR}`,
    `V ${y + h}`,
    `H ${x}`,
    `V ${y + safeR}`,
    `Q ${x} ${y} ${x + safeR} ${y}`,
    "Z",
  ].join(" ");
}

// ─── Helper: smooth bezier path through points ────────────────────────────────

function smoothPath(
  pts: { x: number; y: number }[]
): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cp1x = prev.x + (curr.x - prev.x) / 3;
    const cp1y = prev.y;
    const cp2x = curr.x - (curr.x - prev.x) / 3;
    const cp2y = curr.y;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`;
  }
  return d;
}

// ─── Sub-component: Bar chart ─────────────────────────────────────────────────

const BarChart: React.FC<{
  theme: Theme;
  data: AnimatedChartProps["data"];
  localFrame: number;
  fps: number;
  showValues: boolean;
  showGrid: boolean;
  animate: "grow" | "stagger" | "count-up";
}> = ({ theme, data, localFrame, fps, showValues, showGrid, animate }) => {
  const plotW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // Grid line animation
  const gridProgress = interpolate(
    localFrame,
    [T_GRID_START, T_GRID_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Bar slot sizing
  const slotW = plotW / data.length;
  const barW = slotW * BAR_FILL_RATIO;
  const barGap = (slotW - barW) / 2;

  // Grid line values
  const gridValues = Array.from({ length: GRID_LINES }, (_, i) =>
    Math.round((maxValue * (i + 1)) / GRID_LINES)
  );

  // Per-bar spring progress
  const barProgresses = data.map((_, i) => {
    const barStart =
      T_BARS_START + (animate === "stagger" || animate === "grow" ? i * BAR_STAGGER : 0);
    return spring({
      frame: localFrame - barStart,
      fps,
      config: SPRING_CFG,
    });
  });

  return (
    <svg
      width={CHART_W}
      height={CHART_H}
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        {data.map((d, i) => {
          const color = resolveColor(d.color, i, theme);
          return (
            <linearGradient
              key={`bar-grad-${i}`}
              id={`bar-grad-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.7} />
            </linearGradient>
          );
        })}
      </defs>

      {/* ── Grid lines ── */}
      {showGrid &&
        gridValues.map((val, gi) => {
          const gy = PAD_TOP + plotH - (val / maxValue) * plotH;
          const lineOpacity = gridProgress * 0.3;
          return (
            <g key={gi}>
              <line
                x1={PAD_LEFT}
                y1={gy}
                x2={PAD_LEFT + plotW * gridProgress}
                y2={gy}
                stroke={theme.colors.inkFaint}
                strokeWidth={1}
                opacity={lineOpacity}
              />
              <text
                x={PAD_LEFT - 10}
                y={gy + 4}
                fill={theme.colors.inkFaint}
                fontSize={11}
                textAnchor="end"
                fontFamily={theme.fonts.body}
                opacity={gridProgress * 0.6}
              >
                {val}
              </text>
            </g>
          );
        })}

      {/* ── X-axis baseline ── */}
      <line
        x1={PAD_LEFT}
        y1={PAD_TOP + plotH}
        x2={PAD_LEFT + plotW}
        y2={PAD_TOP + plotH}
        stroke={theme.colors.inkFaint}
        strokeWidth={1}
        opacity={0.4}
      />

      {/* ── Bars ── */}
      {data.map((d, i) => {
        const progress = barProgresses[i];
        const color = resolveColor(d.color, i, theme);
        const barH = (d.value / maxValue) * plotH * progress;
        const x = PAD_LEFT + i * slotW + barGap;
        const y = PAD_TOP + plotH - barH;
        const barPath = roundedTopRect(x, y, barW, barH, BAR_RADIUS);

        // For count-up: interpolate displayed value
        const displayValue =
          animate === "count-up"
            ? Math.round(d.value * progress)
            : d.value;

        // Value label appears once bar is nearly done
        const valueLabelOpacity = interpolate(progress, [0.85, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <g key={i}>
            {/* Bar */}
            {barH > 0 && (
              <path
                d={barPath}
                fill={`url(#bar-grad-${i})`}
              />
            )}

            {/* Value label above bar */}
            {showValues && barH > 0 && (
              <text
                x={x + barW / 2}
                y={y - 8}
                fill={color}
                fontSize={13}
                fontWeight={700}
                textAnchor="middle"
                fontFamily={theme.fonts.mono}
                opacity={valueLabelOpacity}
              >
                {displayValue}
              </text>
            )}

            {/* X-axis label */}
            <text
              x={x + barW / 2}
              y={PAD_TOP + plotH + 22}
              fill={theme.colors.inkSoft}
              fontSize={13}
              textAnchor="middle"
              fontFamily={theme.fonts.body}
              opacity={gridProgress}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Sub-component: Line chart ────────────────────────────────────────────────

const LineChart: React.FC<{
  theme: Theme;
  data: AnimatedChartProps["data"];
  localFrame: number;
  fps: number;
  showValues: boolean;
  showGrid: boolean;
}> = ({ theme, data, localFrame, fps, showValues, showGrid }) => {
  const plotW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const lineColor = resolveColor(data[0]?.color, 0, theme);

  // Grid
  const gridProgress = interpolate(
    localFrame,
    [T_GRID_START, T_GRID_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Overall line draw progress
  const lineProgress = interpolate(
    localFrame,
    [T_BARS_START, T_BARS_START + BAR_GROW_FRAMES + data.length * BAR_STAGGER],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const gridValues = Array.from({ length: GRID_LINES }, (_, i) =>
    Math.round((maxValue * (i + 1)) / GRID_LINES)
  );

  // Compute point coordinates
  const pts = data.map((d, i) => ({
    x: PAD_LEFT + (i / (data.length - 1)) * plotW,
    y: PAD_TOP + plotH - (d.value / maxValue) * plotH,
  }));

  const pathD = smoothPath(pts);

  // Total path length estimate for dasharray trick
  // We compute it via a rough length estimate: sum of segment lengths
  const pathLength = pts.reduce((acc, pt, i) => {
    if (i === 0) return 0;
    const prev = pts[i - 1];
    const dx = pt.x - prev.x;
    const dy = pt.y - prev.y;
    return acc + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  // Area path (close below)
  const areaPath =
    pathD +
    ` L ${pts[pts.length - 1].x} ${PAD_TOP + plotH}` +
    ` L ${pts[0].x} ${PAD_TOP + plotH} Z`;

  return (
    <svg
      width={CHART_W}
      height={CHART_H}
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
        <clipPath id="line-clip">
          <rect
            x={PAD_LEFT - 4}
            y={PAD_TOP - 20}
            width={(plotW + 8) * lineProgress}
            height={plotH + 80}
          />
        </clipPath>
      </defs>

      {/* ── Grid lines ── */}
      {showGrid &&
        gridValues.map((val, gi) => {
          const gy = PAD_TOP + plotH - (val / maxValue) * plotH;
          return (
            <g key={gi}>
              <line
                x1={PAD_LEFT}
                y1={gy}
                x2={PAD_LEFT + plotW * gridProgress}
                y2={gy}
                stroke={theme.colors.inkFaint}
                strokeWidth={1}
                opacity={gridProgress * 0.3}
              />
              <text
                x={PAD_LEFT - 10}
                y={gy + 4}
                fill={theme.colors.inkFaint}
                fontSize={11}
                textAnchor="end"
                fontFamily={theme.fonts.body}
                opacity={gridProgress * 0.6}
              >
                {val}
              </text>
            </g>
          );
        })}

      {/* ── X-axis baseline ── */}
      <line
        x1={PAD_LEFT}
        y1={PAD_TOP + plotH}
        x2={PAD_LEFT + plotW}
        y2={PAD_TOP + plotH}
        stroke={theme.colors.inkFaint}
        strokeWidth={1}
        opacity={0.4}
      />

      {/* ── Area fill (clipped to lineProgress) ── */}
      <path
        d={areaPath}
        fill="url(#area-grad)"
        clipPath="url(#line-clip)"
      />

      {/* ── Line stroke (dash trick) ── */}
      <path
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength * (1 - lineProgress)}
      />

      {/* ── Data point circles ── */}
      {pts.map((pt, i) => {
        // Point appears when line has reached its x position
        const pointProgress = (i / (data.length - 1));
        const circleOpacity = interpolate(
          lineProgress,
          [pointProgress - 0.05, pointProgress + 0.05],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const circleScale = interpolate(
          lineProgress,
          [pointProgress - 0.05, pointProgress + 0.1],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const pointColor = resolveColor(data[i]?.color, i, theme);

        return (
          <g key={i}>
            {/* Outer ring */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={8 * circleScale}
              fill={theme.colors.bg}
              stroke={pointColor}
              strokeWidth={2.5}
              opacity={circleOpacity}
            />
            {/* Inner dot */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={3.5 * circleScale}
              fill={pointColor}
              opacity={circleOpacity}
            />

            {/* Value label */}
            {showValues && (
              <text
                x={pt.x}
                y={pt.y - 16}
                fill={pointColor}
                fontSize={12}
                fontWeight={700}
                textAnchor="middle"
                fontFamily={theme.fonts.mono}
                opacity={circleOpacity}
              >
                {data[i].value}
              </text>
            )}

            {/* X-axis label */}
            <text
              x={pt.x}
              y={PAD_TOP + plotH + 22}
              fill={theme.colors.inkSoft}
              fontSize={13}
              textAnchor="middle"
              fontFamily={theme.fonts.body}
              opacity={gridProgress}
            >
              {data[i].label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Sub-component: Horizontal bar chart ──────────────────────────────────────

const HorizontalBarChart: React.FC<{
  theme: Theme;
  data: AnimatedChartProps["data"];
  localFrame: number;
  fps: number;
  showValues: boolean;
  showGrid: boolean;
  animate: "grow" | "stagger" | "count-up";
}> = ({ theme, data, localFrame, fps, showValues, showGrid, animate }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const totalH =
    HBAR_PAD_V * 2 +
    data.length * HBAR_H +
    (data.length - 1) * HBAR_GAP;
  const svgH = Math.max(totalH, CHART_H);

  const plotW = CHART_W - HBAR_LABEL_W - HBAR_VALUE_W - PAD_LEFT - PAD_RIGHT;

  // Grid vertical lines
  const gridProgress = interpolate(
    localFrame,
    [T_GRID_START, T_GRID_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const gridValues = Array.from({ length: GRID_LINES }, (_, i) =>
    Math.round((maxValue * (i + 1)) / GRID_LINES)
  );

  // Per-bar progress
  const barProgresses = data.map((_, i) => {
    const barStart =
      T_BARS_START + (animate === "stagger" || animate === "grow" ? i * BAR_STAGGER : 0);
    return spring({
      frame: localFrame - barStart,
      fps,
      config: SPRING_CFG,
    });
  });

  return (
    <svg
      width={CHART_W}
      height={svgH}
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        {data.map((d, i) => {
          const color = resolveColor(d.color, i, theme);
          return (
            <linearGradient
              key={`hbar-grad-${i}`}
              id={`hbar-grad-${i}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.7} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
          );
        })}
      </defs>

      {/* ── Vertical grid lines ── */}
      {showGrid &&
        gridValues.map((val, gi) => {
          const gx = HBAR_LABEL_W + (val / maxValue) * plotW;
          return (
            <g key={gi}>
              <line
                x1={gx}
                y1={HBAR_PAD_V * gridProgress}
                x2={gx}
                y2={svgH - HBAR_PAD_V}
                stroke={theme.colors.inkFaint}
                strokeWidth={1}
                opacity={gridProgress * 0.25}
              />
              <text
                x={gx}
                y={svgH - HBAR_PAD_V + 16}
                fill={theme.colors.inkFaint}
                fontSize={11}
                textAnchor="middle"
                fontFamily={theme.fonts.body}
                opacity={gridProgress * 0.6}
              >
                {val}
              </text>
            </g>
          );
        })}

      {/* ── Bars ── */}
      {data.map((d, i) => {
        const progress = barProgresses[i];
        const color = resolveColor(d.color, i, theme);
        const barW = (d.value / maxValue) * plotW * progress;
        const y = HBAR_PAD_V + i * (HBAR_H + HBAR_GAP);
        const x = HBAR_LABEL_W;

        const displayValue =
          animate === "count-up"
            ? Math.round(d.value * progress)
            : d.value;

        const labelOpacity = interpolate(
          localFrame,
          [T_GRID_START, T_GRID_END],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const valueLabelOpacity = interpolate(progress, [0.85, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <g key={i}>
            {/* Label on left */}
            <text
              x={x - 12}
              y={y + HBAR_H / 2 + 5}
              fill={theme.colors.inkSoft}
              fontSize={14}
              textAnchor="end"
              fontFamily={theme.fonts.body}
              opacity={labelOpacity}
            >
              {d.label}
            </text>

            {/* Track (background) */}
            <rect
              x={x}
              y={y + 8}
              width={plotW}
              height={HBAR_H - 16}
              rx={4}
              fill={theme.colors.inkFaint}
              opacity={0.08}
            />

            {/* Filled bar */}
            {barW > 0 && (
              <rect
                x={x}
                y={y + 8}
                width={barW}
                height={HBAR_H - 16}
                rx={4}
                fill={`url(#hbar-grad-${i})`}
              />
            )}

            {/* Value on right */}
            {showValues && (
              <text
                x={x + barW + 10}
                y={y + HBAR_H / 2 + 5}
                fill={color}
                fontSize={13}
                fontWeight={700}
                textAnchor="start"
                fontFamily={theme.fonts.mono}
                opacity={valueLabelOpacity}
              >
                {displayValue}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const AnimatedChart: React.FC<AnimatedChartProps> = ({
  theme,
  timing,
  type,
  title,
  data,
  showValues = true,
  showGrid = true,
  animate = "stagger",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;

  // ── Title fade ──
  const titleOpacity = interpolate(localFrame, [T_TITLE_START, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(localFrame, [T_TITLE_START, 14], [-12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Chart frame fade ──
  const frameOpacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chart selection
  const isHBar = type === "horizontal-bar";
  const svgH = isHBar
    ? Math.max(
        CHART_H,
        HBAR_PAD_V * 2 +
          data.length * HBAR_H +
          (data.length - 1) * HBAR_GAP
      )
    : CHART_H;

  return (
    <div
      style={{
        width: CHART_W,
        position: "relative",
        opacity: frameOpacity,
      }}
    >
      {/* ── Title ── */}
      {title && (
        <div
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 28,
            fontWeight: 700,
            color: theme.colors.ink,
            letterSpacing: "-0.02em",
            marginBottom: 12,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
          }}
        >
          {title}
        </div>
      )}

      {/* ── Chart SVG ── */}
      <div style={{ position: "relative", width: CHART_W, height: svgH }}>
        {type === "bar" && (
          <BarChart
            theme={theme}
            data={data}
            localFrame={localFrame}
            fps={fps}
            showValues={showValues}
            showGrid={showGrid}
            animate={animate}
          />
        )}
        {type === "line" && (
          <LineChart
            theme={theme}
            data={data}
            localFrame={localFrame}
            fps={fps}
            showValues={showValues}
            showGrid={showGrid}
          />
        )}
        {type === "horizontal-bar" && (
          <HorizontalBarChart
            theme={theme}
            data={data}
            localFrame={localFrame}
            fps={fps}
            showValues={showValues}
            showGrid={showGrid}
            animate={animate}
          />
        )}
      </div>
    </div>
  );
};
