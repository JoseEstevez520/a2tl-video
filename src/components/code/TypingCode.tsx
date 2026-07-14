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

interface Token {
  text: string;
  type: "keyword" | "string" | "number" | "comment" | "plain";
}

interface TypingCodeProps {
  theme: Theme;
  timing: { start: number; end?: number };
  code: string;
  language?: string;
  speed?: number;
  highlightLines?: number[];
  showLineNumbers?: boolean;
  cursorColor?: string;
}

// ── Tokeniser ──────────────────────────────────────────────────────────────

const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "import", "export",
  "if", "else", "for", "while", "do", "switch", "case", "break",
  "continue", "class", "extends", "new", "typeof", "instanceof",
  "void", "delete", "in", "of", "async", "await", "try", "catch",
  "finally", "throw", "yield", "default", "from", "as", "type",
  "interface", "enum", "implements", "abstract", "public", "private",
  "protected", "static", "readonly", "null", "undefined", "true", "false",
]);

function tokeniseLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    if (line[i] === "/" && line[i + 1] === "/") {
      tokens.push({ text: line.slice(i), type: "comment" });
      break;
    }

    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && !(line[j] === '"' && line[j - 1] !== "\\")) j++;
      tokens.push({ text: line.slice(i, j + 1), type: "string" });
      i = j + 1;
      continue;
    }

    if (line[i] === "'") {
      let j = i + 1;
      while (j < line.length && !(line[j] === "'" && line[j - 1] !== "\\")) j++;
      tokens.push({ text: line.slice(i, j + 1), type: "string" });
      i = j + 1;
      continue;
    }

    if (line[i] === "`") {
      let j = i + 1;
      while (j < line.length && !(line[j] === "`" && line[j - 1] !== "\\")) j++;
      tokens.push({ text: line.slice(i, j + 1), type: "string" });
      i = j + 1;
      continue;
    }

    if (/[0-9]/.test(line[i]) || (line[i] === "-" && /[0-9]/.test(line[i + 1] ?? ""))) {
      let j = i;
      if (line[j] === "-") j++;
      while (j < line.length && /[0-9._xXa-fA-F]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: "number" });
      i = j;
      continue;
    }

    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      tokens.push({ text: word, type: KEYWORDS.has(word) ? "keyword" : "plain" });
      i = j;
      continue;
    }

    const last = tokens[tokens.length - 1];
    if (last && last.type === "plain") {
      last.text += line[i];
    } else {
      tokens.push({ text: line[i], type: "plain" });
    }
    i++;
  }

  return tokens;
}

function tokenColor(tok: Token, theme: Theme): string {
  switch (tok.type) {
    case "keyword":
      return theme.colors.purple;
    case "string":
      return theme.colors.green;
    case "number":
      return theme.colors.amber;
    case "comment":
      return theme.colors.inkSoft;
    default:
      return theme.colors.ink;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export const TypingCode: React.FC<TypingCodeProps> = ({
  theme,
  timing,
  code,
  speed = 30,
  highlightLines = [],
  showLineNumbers = true,
  cursorColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const localFrame = Math.max(0, frame - timing.start * fps);

  const lines = code.split("\n");
  const numLines = lines.length;

  // Layout constants
  const CHAR_W = 8.5;
  const LINE_H = 26;
  const FONT_SIZE = 14;
  const TITLE_H = 36;
  const PAD_H = 20;
  const PAD_V = 16;
  const LINE_NUM_W = showLineNumbers ? 44 : 0;
  const RADIUS = 10;

  const svgW = width;
  const svgH = TITLE_H + PAD_V + numLines * LINE_H + PAD_V;
  const codeLeft = PAD_H + LINE_NUM_W;
  const baseY = TITLE_H + PAD_V;

  // Typing progress
  const totalChars = lines.join("\n").length;
  const charsPerFrame = speed / fps;
  const rawCharsVisible = speed > 0 ? Math.floor(localFrame * charsPerFrame) : totalChars;
  const charsVisible = Math.min(rawCharsVisible, totalChars);
  const typingFinished = rawCharsVisible >= totalChars;

  // Block entry animation
  const blockScale = interpolate(localFrame, [0, 12], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const blockOpacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out at end
  const endFrame = timing.end !== undefined ? timing.end * fps : Infinity;
  const fadeOut =
    endFrame < Infinity
      ? interpolate(frame, [endFrame - 10, endFrame], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  // Compute cursor position from charsVisible
  let cursorLine = 0;
  let cursorCharInLine = 0;
  let remaining = Math.min(charsVisible + 1, totalChars);
  for (let i = 0; i < lines.length; i++) {
    const lineLen = lines[i].length;
    if (remaining <= lineLen + 1) {
      cursorLine = i;
      cursorCharInLine = Math.min(remaining, lineLen);
      break;
    }
    remaining -= lineLen + 1;
  }

  // Cursor blink: 12-frame half-cycle (on 12, off 12)
  const cursorOpacity = interpolate(
    (typingFinished ? frame : localFrame) % 24,
    [0, 10, 12, 24],
    [1, 1, 0, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const cursorCol = cursorColor || theme.colors.ink;

  // Stable IDs for SVG filters (per-instance to avoid conflicts)
  const uid = React.useMemo(
    () => `tc-${String(timing.start).replace(/\D/g, "")}`,
    [timing.start]
  );

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{
        opacity: blockOpacity * fadeOut,
        transform: `scale(${blockScale})`,
        transformOrigin: "center center",
      }}
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <rect x={0} y={0} width={svgW} height={svgH} rx={RADIUS} />
        </clipPath>
        <filter id={`${uid}-shadow`}>
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="16"
            floodColor={theme.colors.bg}
            floodOpacity={0.5}
          />
        </filter>
        <filter id={`${uid}-cursor-glow`}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shadow beneath the block */}
      <rect
        x={0}
        y={0}
        width={svgW}
        height={svgH}
        rx={RADIUS}
        fill={theme.colors.bg2}
        filter={`url(#${uid}-shadow)`}
      />

      <g clipPath={`url(#${uid}-clip)`}>
        {/* Background */}
        <rect
          x={0}
          y={0}
          width={svgW}
          height={svgH}
          fill={theme.colors.bg2}
        />

        {/* Title bar */}
        <rect x={0} y={0} width={svgW} height={TITLE_H} fill={`${theme.colors.bg}cc`} />
        <line
          x1={0}
          y1={TITLE_H}
          x2={svgW}
          y2={TITLE_H}
          stroke={theme.colors.grid}
          strokeWidth={1}
        />

        {/* Traffic-light dots */}
        <circle cx={PAD_H} cy={TITLE_H / 2} r={5} fill="#FF5F56" opacity={0.9} />
        <circle cx={PAD_H + 22} cy={TITLE_H / 2} r={5} fill="#FFBD2E" opacity={0.9} />
        <circle cx={PAD_H + 44} cy={TITLE_H / 2} r={5} fill="#27C93F" opacity={0.9} />

        {/* Editor dot highlight (subtle glint on the green dot) */}
        <circle cx={PAD_H + 44} cy={TITLE_H / 2} r={2} fill="#fff" opacity={0.25} />

        {/* Code lines */}
        {lines.map((rawLine, li) => {
          const isHighlighted = highlightLines.includes(li + 1);
          const lineY = baseY + li * LINE_H;

          // Per-line fade-in / slide-in
          const lineLocalFrame = localFrame - 4 - li * 3;
          const lineOpacity = interpolate(lineLocalFrame, [0, 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const lineSlideX = interpolate(lineLocalFrame, [0, 6], [-12, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          if (lineOpacity <= 0.005) return null;

          // ── Character-level visibility ────────────────────────────────
          let lineAcc = 0;
          for (let i = 0; i < li; i++) {
            lineAcc += lines[i].length + 1;
          }
          const lineStart = lineAcc;
          const lineEnd = lineStart + rawLine.length;

          let visibleTokens: Token[] = [];
          if (charsVisible > lineStart) {
            const tokens = tokeniseLine(rawLine);
            if (charsVisible >= lineEnd) {
              visibleTokens = tokens;
            } else {
              const numChars = charsVisible - lineStart;
              let seen = 0;
              for (const tok of tokens) {
                if (seen >= numChars) break;
                if (seen + tok.text.length <= numChars) {
                  visibleTokens.push(tok);
                  seen += tok.text.length;
                } else {
                  visibleTokens.push({
                    ...tok,
                    text: tok.text.slice(0, numChars - seen),
                  });
                  seen = numChars;
                }
              }
            }
          }

          // ── Highlight glow pulse ──────────────────────────────────────
          const hlFrame = localFrame - 10 - li * 3;
          const glowOpacity = isHighlighted
            ? interpolate(hlFrame, [0, 6, 14, 20], [0, 0.25, 0.12, 0.08], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 0;

          const cursorX = codeLeft + cursorCharInLine * CHAR_W;
          const cursorY = lineY + (LINE_H - LINE_H * 0.65) / 2;
          const cursorH = LINE_H * 0.65;

          return (
            <g
              key={li}
              opacity={lineOpacity}
              transform={`translate(${lineSlideX}, 0)`}
            >
              {/* Highlight background bar */}
              {isHighlighted && (
                <rect
                  x={0}
                  y={lineY}
                  width={svgW}
                  height={LINE_H}
                  fill={theme.colors.ink}
                  opacity={glowOpacity}
                />
              )}

              {/* Highlight left accent border */}
              {isHighlighted && (
                <rect
                  x={0}
                  y={lineY}
                  width={3}
                  height={LINE_H}
                  fill={theme.colors.ink}
                  opacity={0.4}
                />
              )}

              {/* Line number */}
              {showLineNumbers && (
                <text
                  x={codeLeft - 6}
                  y={lineY + LINE_H / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill={theme.colors.inkFaint}
                  opacity={0.5}
                  fontFamily={theme.fonts.mono}
                  fontSize={12}
                >
                  {li + 1}
                </text>
              )}

              {/* Code tokens */}
              {visibleTokens.length > 0 && (
                <text
                  x={codeLeft}
                  y={lineY + LINE_H / 2}
                  dominantBaseline="central"
                  fontFamily={theme.fonts.mono}
                  fontSize={FONT_SIZE}
                  fill={theme.colors.ink}
                >
                  {visibleTokens.map((tok, ti) => (
                    <tspan
                      key={ti}
                      fill={tokenColor(tok, theme)}
                      opacity={tok.type === "comment" ? 0.5 : 1}
                    >
                      {tok.text}
                    </tspan>
                  ))}
                </text>
              )}

              {/* Cursor */}
              {li === cursorLine && (
                <g opacity={cursorOpacity} filter={`url(#${uid}-cursor-glow)`}>
                  <rect
                    x={cursorX}
                    y={cursorY}
                    width={2.5}
                    height={cursorH}
                    fill={cursorCol}
                    rx={1}
                  />
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};
