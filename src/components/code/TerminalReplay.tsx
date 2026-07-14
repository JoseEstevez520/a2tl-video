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

interface TerminalLine {
  command: string;
  output?: string[];
  delay?: number;
  error?: boolean;
}

interface TerminalReplayProps {
  theme: Theme;
  timing: { start: number; end?: number };
  lines: TerminalLine[];
  prompt?: string;
  scrollOnOverflow?: boolean;
}

let uidCounter = 0;

export const TerminalReplay: React.FC<TerminalReplayProps> = ({
  theme,
  timing,
  lines,
  prompt = "$",
  scrollOnOverflow = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - timing.start * fps;

  if (timing.end && frame > timing.end * fps) return null;

  const CPS = 15;
  const CPF = CPS / fps;
  const LINE_H = 24;
  const PAD_H = 20;
  const PAD_V = 16;
  const TITLE_H = 36;
  const FONT_SZ = 14;
  const W = 880;
  const OS = 3;
  const DOT_L = 24;
  const DOT_GAP = 40;

  const ids = React.useMemo(() => {
    const id = uidCounter++;
    return { shadow: `trs${id}`, clip: `trc${id}` };
  }, []);

  const lineStarts: number[] = [];
  const lineTFs: number[] = [];
  let totalFrames = 0;
  for (const ln of lines) {
    lineStarts.push(totalFrames);
    const tf = Math.ceil(ln.command.length / CPF);
    const df = (ln.delay ?? 0) * fps;
    const of = (ln.output?.length ?? 0) * OS;
    lineTFs.push(tf);
    totalFrames += tf + df + of;
  }

  const totalLinesN = lines.reduce((s, ln) => s + 1 + (ln.output?.length ?? 0), 0);
  const totalContentH = totalLinesN * LINE_H;
  const visibleLinesN = Math.min(15, Math.max(5, totalLinesN));
  const H = TITLE_H + PAD_V * 2 + visibleLinesN * LINE_H + 30;
  const contentAreaH = H - TITLE_H - PAD_V * 2;
  const maxScroll = Math.max(0, totalContentH - contentAreaH);

  const progress = totalFrames > 0 ? Math.min(1, Math.max(0, localFrame / totalFrames)) : 0;
  const scrollOffset = scrollOnOverflow && maxScroll > 0
    ? interpolate(progress, [0, 1], [0, maxScroll], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  const blockOpacity = interpolate(localFrame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const nodes: React.ReactNode[] = [];
  let y = PAD_V;

  for (let li = 0; li < lines.length; li++) {
    const ln = lines[li];
    const ls = lineStarts[li];
    const lfRel = localFrame - ls;
    const tf = lineTFs[li];
    const df = (ln.delay ?? 0) * fps;

    const charsVisible = lfRel <= 0 ? 0 : Math.min(ln.command.length, Math.floor(lfRel * CPF));
    const cmdOpacity = lfRel < 0
      ? interpolate(lfRel, [-5, 0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 1;
    const cmdComplete = lfRel >= tf;
    const cmdText = ln.command.slice(0, charsVisible);

    const cursorBlock = charsVisible < ln.command.length;
    const cursorWait = cmdComplete && lfRel < tf + df;
    const cursorFrame = cursorWait ? lfRel - tf : 0;
    const cursorOpacity = cursorBlock
      ? 1
      : cursorWait
        ? interpolate(cursorFrame % 26, [0, 3, 13, 16, 26], [1, 1, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : 0;

    if (cmdOpacity > 0.01) {
      nodes.push(
        <text
          key={`c${li}`}
          x={PAD_H}
          y={y + LINE_H * 0.7}
          fontFamily={theme.fonts.mono}
          fontSize={FONT_SZ}
          opacity={cmdOpacity}
        >
          <tspan fill={theme.colors.green}>{prompt} </tspan>
          <tspan fill={theme.colors.ink}>{cmdText}</tspan>
          {cursorOpacity > 0.01 && (
            <tspan fill={theme.colors.ink} opacity={cursorOpacity}>▌</tspan>
          )}
        </text>
      );
    }

    y += LINE_H;

    const output = ln.output ?? [];
    const outStartF = tf + df;
    const outColor = ln.error ? theme.colors.red : theme.colors.inkSoft;

    for (let oi = 0; oi < output.length; oi++) {
      const outLocal = lfRel - (outStartF + oi * OS);
      const outOpacity = interpolate(outLocal, [0, 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

      if (outOpacity > 0.01) {
        nodes.push(
          <text
            key={`o${li}_${oi}`}
            x={PAD_H}
            y={y + LINE_H * 0.7}
            fill={outColor}
            fontFamily={theme.fonts.mono}
            fontSize={FONT_SZ}
            opacity={outOpacity}
          >
            {output[oi]}
          </text>
        );
      }
      y += LINE_H;
    }
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ opacity: blockOpacity }}>
      <defs>
        <filter id={ids.shadow} x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy={6} stdDeviation="12" floodColor={theme.colors.bg} floodOpacity="0.5" />
        </filter>
        <clipPath id={ids.clip}>
          <rect x="0" y={TITLE_H} width={W} height={H - TITLE_H} rx="0" />
        </clipPath>
      </defs>

      <rect x="0" y="0" width={W} height={H} rx={12} fill={theme.colors.bg2} filter={`url(#${ids.shadow})`} />

      <path
        d={`M0,12 Q0,0 12,0 L${W - 12},0 Q${W},0 ${W},12 L${W},${TITLE_H} L0,${TITLE_H} Z`}
        fill={`${theme.colors.bg}88`}
      />

      <line x1="0" y1={TITLE_H} x2={W} y2={TITLE_H} stroke={theme.colors.grid} strokeOpacity="0.3" strokeWidth="1" />

      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx={12} fill="none" stroke={theme.colors.grid} strokeOpacity="0.25" strokeWidth="1" />

      <circle cx={DOT_L} cy={TITLE_H / 2} r="5" fill="#FF5F56" opacity="0.85" />
      <circle cx={DOT_L + DOT_GAP} cy={TITLE_H / 2} r="5" fill="#FFBD2E" opacity="0.85" />
      <circle cx={DOT_L + DOT_GAP * 2} cy={TITLE_H / 2} r="5" fill="#27C93F" opacity="0.85" />

      <g clipPath={`url(#${ids.clip})`}>
        <g transform={`translate(0, ${-scrollOffset})`}>
          {nodes}
        </g>
      </g>
    </svg>
  );
};
