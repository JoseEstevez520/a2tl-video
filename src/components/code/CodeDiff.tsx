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

interface CodeDiffProps {
  theme: Theme;
  timing: { start: number; end?: number };
  oldCode: string;
  newCode: string;
  language?: string;
  layout?: "side-by-side" | "unified";
  showGutter?: boolean;
}

type DiffType = "unchanged" | "added" | "deleted";

interface DiffLine {
  type: DiffType;
  oldLineNum: number;
  newLineNum: number;
  text: string;
}

function computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        oldLines[i - 1] === newLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const result: DiffLine[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({ type: "unchanged", oldLineNum: i, newLineNum: j, text: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "added", oldLineNum: -1, newLineNum: j, text: newLines[j - 1] });
      j--;
    } else {
      result.push({ type: "deleted", oldLineNum: i, newLineNum: -1, text: oldLines[i - 1] });
      i--;
    }
  }
  return result.reverse();
}

const TITLE_H = 42;
const LINE_H = 28;
const FS = 13;
const PAD_H = 20;
const PAD_V = 14;
const BR = 12;

export const CodeDiff: React.FC<CodeDiffProps> = ({
  theme,
  timing,
  oldCode,
  newCode,
  layout = "unified",
  showGutter = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const localFrame = frame - timing.start * fps;

  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const diff = computeDiff(oldLines, newLines);
  const numRows = diff.length;

  const GUTTER_W = showGutter ? 36 : 0;
  const SYM_W = layout === "unified" ? 16 : 0;
  const GAP = layout === "side-by-side" ? 32 : 0;
  const DIV = layout === "side-by-side" ? 2 : 0;

  const contentH = numRows * LINE_H;
  const blockH = TITLE_H + PAD_V * 2 + contentH;
  const blockY = (height - blockH) / 2;

  const availW = Math.min(width * 0.88, 1300);
  const panelW = layout === "side-by-side"
    ? (availW - PAD_H * 2 - GAP - DIV) / 2
    : availW - PAD_H * 2;

  const boxX = (width - availW) / 2;

  // Animations
  const blockOpacity = interpolate(localFrame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blockScale = interpolate(localFrame, [0, 15], [0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  function rowAnim(type: DiffType, lf: number) {
    switch (type) {
      case "deleted":
        return {
          opacity: interpolate(lf, [6, 28], [1, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          slideX: 0,
        };
      case "added":
        return {
          opacity: interpolate(lf, [10, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          slideX: interpolate(lf, [10, 34], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        };
      default:
        return {
          opacity: interpolate(lf, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          slideX: 0,
        };
    }
  }

  function renderRow(line: DiffLine, i: number, mode: "unified" | "left" | "right"): React.ReactNode {
    const y = i * LINE_H;

    // Unified: shows everything. Left: skip adds. Right: skip deletes.
    const skip = mode === "left" ? line.type === "added" : mode === "right" ? line.type === "deleted" : false;

    const effectiveType =
      mode === "unified" ? line.type :
      mode === "left" ? (line.type === "unchanged" ? "unchanged" : "deleted") :
      line.type === "unchanged" ? "unchanged" : "added";

    const isDeleted = effectiveType === "deleted";
    const isAdded = effectiveType === "added";

    const { opacity: rowOp, slideX } = rowAnim(skip ? "unchanged" : effectiveType, localFrame);

    if (!skip && rowOp <= 0.005) return null;

    const textColor = isDeleted ? theme.colors.red : isAdded ? theme.colors.green : theme.colors.ink;
    const bgFill = isDeleted ? `${theme.colors.red}14` : isAdded ? `${theme.colors.green}14` : "transparent";
    const symChar = isDeleted ? "−" : isAdded ? "+" : "";
    const symCol = isDeleted ? theme.colors.red : isAdded ? theme.colors.green : "transparent";

    const lineNum = mode === "unified" || mode === "left"
      ? (line.oldLineNum > 0 ? line.oldLineNum : line.newLineNum)
      : (line.newLineNum > 0 ? line.newLineNum : line.oldLineNum);

    const gWidth = mode === "unified" ? panelW + SYM_W + GUTTER_W : panelW;

    // For skipped lines (added on left, deleted on right), render an empty spacer
    if (skip) {
      return <g key={i}><rect x={-GUTTER_W - 4} y={y} width={gWidth + 8} height={LINE_H} fill="transparent" /></g>;
    }

    return (
      <g key={i} opacity={rowOp} transform={`translate(${slideX}, 0)`}>
        {bgFill !== "transparent" && (
          <rect x={mode === "unified" ? -SYM_W - GUTTER_W - 4 : -GUTTER_W - 4} y={y - 2} width={gWidth + 8} height={LINE_H} fill={bgFill} rx={3} />
        )}

        {mode === "unified" && (
          <text x={-SYM_W - GUTTER_W} y={y + LINE_H / 2 + FS / 2 - 1} fill={symCol} fontSize={FS} fontFamily={theme.fonts.mono} textAnchor="middle" fontWeight="bold">
            {symChar}
          </text>
        )}

        {showGutter && (
          <text
            x={mode === "unified" ? -GUTTER_W / 2 : -GUTTER_W / 2}
            y={y + LINE_H / 2 + FS / 2 - 1}
            fill={theme.colors.inkFaint}
            fontSize={11}
            fontFamily={theme.fonts.mono}
            textAnchor="middle"
            opacity={0.45}
          >
            {lineNum > 0 ? lineNum : ""}
          </text>
        )}

        <text
          x={0}
          y={y + LINE_H / 2 + FS / 2 - 1}
          fill={textColor}
          fontSize={FS}
          fontFamily={theme.fonts.mono}
        >
          {line.text || " "}
        </text>

        {isDeleted && (
          <line
            x1={0}
            y1={y + LINE_H / 2}
            x2={panelW - GUTTER_W}
            y2={y + LINE_H / 2}
            stroke={theme.colors.red}
            strokeWidth={1}
            opacity={0.55}
          />
        )}

        {isAdded && (
          <rect
            x={0}
            y={y + LINE_H - 3}
            width={Math.min(line.text.length * 7.8, panelW - GUTTER_W)}
            height={2}
            fill={theme.colors.green}
            opacity={0.3}
            rx={1}
          />
        )}
      </g>
    );
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", top: 0, left: 0 }}>
      <defs>
        <filter id="diff-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="18" floodColor={theme.colors.bg} floodOpacity="0.55" />
        </filter>
        <clipPath id="diff-clip">
          <rect x={boxX} y={blockY + TITLE_H} width={availW} height={blockH - TITLE_H} rx={0} />
        </clipPath>
      </defs>

      <g opacity={blockOpacity} transform={`scale(${blockScale}) translate(${width * (1 - blockScale) / 2}, ${height * (1 - blockScale) / 2})`}>
        {/* Background */}
        <rect x={boxX} y={blockY} width={availW} height={blockH} rx={BR} fill={theme.colors.bg2} stroke={theme.colors.grid} strokeWidth="1" filter="url(#diff-shadow)" />

        {/* Title bar */}
        <rect x={boxX} y={blockY} width={availW} height={TITLE_H} rx={BR} fill={`${theme.colors.bg}88`} />
        <rect x={boxX} y={blockY + TITLE_H - 1} width={availW} height={1} fill={theme.colors.grid} />

        {["#FF5F56", "#FFBD2E", "#27C93F"].map((c, i) => (
          <circle key={i} cx={boxX + 16 + i * 16} cy={blockY + TITLE_H / 2} r={5} fill={c} opacity={0.85} />
        ))}

        <text x={boxX + availW / 2} y={blockY + TITLE_H / 2 + 4} textAnchor="middle" fill={theme.colors.inkSoft} fontSize={12} fontFamily={theme.fonts.mono} letterSpacing="0.04em">
          {layout === "side-by-side" ? "BEFORE  ⟶  AFTER" : "CODE DIFF"}
        </text>

        {/* Code body */}
        <g clipPath="url(#diff-clip)">
          {layout === "side-by-side" ? (
            <>
              {/* Left panel */}
              <g transform={`translate(${boxX + PAD_H}, ${blockY + TITLE_H + PAD_V})`}>
                {diff.map((line, i) => renderRow(line, i, "left"))}
              </g>

              {/* Vertical divider */}
              <line
                x1={boxX + PAD_H + panelW + GAP / 2}
                y1={blockY + TITLE_H + 8}
                x2={boxX + PAD_H + panelW + GAP / 2}
                y2={blockY + blockH - 8}
                stroke={theme.colors.inkFaint}
                strokeWidth={1}
                opacity={0.25}
              />

              {/* Right panel */}
              <g transform={`translate(${boxX + PAD_H + panelW + GAP + DIV}, ${blockY + TITLE_H + PAD_V})`}>
                {diff.map((line, i) => renderRow(line, i, "right"))}
              </g>
            </>
          ) : (
            <g transform={`translate(${boxX + PAD_H}, ${blockY + TITLE_H + PAD_V})`}>
              {diff.map((line, i) => renderRow(line, i, "unified"))}
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};
