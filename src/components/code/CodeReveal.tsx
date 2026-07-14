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

interface CodeRevealProps {
  theme: Theme;
  timing: { start: number; end?: number };
  code: string;
  language?: string;
  highlightLines?: number[];
  title?: string;
  lineByLine?: boolean;
}

// ---------------------------------------------------------------------------
// Syntax tokeniser — regex-based, no external deps
// ---------------------------------------------------------------------------

interface Token {
  text: string;
  type: "keyword" | "string" | "number" | "comment" | "plain";
}

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
    // Single-line comment
    if (line[i] === "/" && line[i + 1] === "/") {
      tokens.push({ text: line.slice(i), type: "comment" });
      break;
    }

    // Double-quoted string
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && !(line[j] === '"' && line[j - 1] !== "\\")) j++;
      tokens.push({ text: line.slice(i, j + 1), type: "string" });
      i = j + 1;
      continue;
    }

    // Single-quoted string
    if (line[i] === "'") {
      let j = i + 1;
      while (j < line.length && !(line[j] === "'" && line[j - 1] !== "\\")) j++;
      tokens.push({ text: line.slice(i, j + 1), type: "string" });
      i = j + 1;
      continue;
    }

    // Template literal
    if (line[i] === "`") {
      let j = i + 1;
      while (j < line.length && !(line[j] === "`" && line[j - 1] !== "\\")) j++;
      tokens.push({ text: line.slice(i, j + 1), type: "string" });
      i = j + 1;
      continue;
    }

    // Number (decimal or hex)
    if (/[0-9]/.test(line[i]) || (line[i] === "-" && /[0-9]/.test(line[i + 1] ?? ""))) {
      let j = i;
      if (line[j] === "-") j++;
      while (j < line.length && /[0-9._xXa-fA-F]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: "number" });
      i = j;
      continue;
    }

    // Word (keyword or identifier)
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      tokens.push({ text: word, type: KEYWORDS.has(word) ? "keyword" : "plain" });
      i = j;
      continue;
    }

    // Punctuation / operator — attach to previous plain token if one exists, else create new
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

// ---------------------------------------------------------------------------
// Token colour resolver
// ---------------------------------------------------------------------------

function tokenColor(token: Token, theme: Theme): string {
  switch (token.type) {
    case "keyword":
      return theme.colors.purple;
    case "string":
      return theme.colors.green;
    case "number":
      return theme.colors.amber;
    case "comment":
      return theme.colors.inkSoft;
    default:
      return "#E2E8F0"; // near-white for plain code
  }
}

function tokenOpacity(token: Token): number {
  return token.type === "comment" ? 0.5 : 1;
}

// ---------------------------------------------------------------------------
// CodeReveal component
// ---------------------------------------------------------------------------

export const CodeReveal: React.FC<CodeRevealProps> = ({
  theme,
  timing,
  code,
  highlightLines = [],
  title,
  lineByLine = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;

  // Split preserving blank lines
  const lines = code.split("\n");
  const numLines = lines.length;

  // ── Block scale-in (first 15 frames) ──────────────────────────────────────
  const blockScale = interpolate(localFrame, [0, 15], [0.95, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const blockOpacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Typing cursor (lineByLine = false) ────────────────────────────────────
  const CHARS_PER_FRAME = 1.5;
  const totalChars = lines.join("\n").length;
  const charsVisible = lineByLine
    ? totalChars
    : Math.floor(Math.max(0, localFrame - 8) * CHARS_PER_FRAME);

  // Map charsVisible → how much of each line is visible (cursor mode)
  function lineVisibility(lineIndex: number): number {
    if (lineByLine) return 1;
    let acc = 0;
    for (let li = 0; li < lineIndex; li++) acc += lines[li].length + 1; // +1 for \n
    const lineStart = acc;
    const lineEnd = lineStart + lines[lineIndex].length;
    if (charsVisible <= lineStart) return 0;
    if (charsVisible >= lineEnd) return 1;
    return (charsVisible - lineStart) / Math.max(1, lines[lineIndex].length);
  }

  // ── Layout constants ───────────────────────────────────────────────────────
  const LINE_HEIGHT = 28;
  const LINE_NUM_W = 42;
  const PAD_H = 20;
  const PAD_V = 16;
  const TITLE_BAR_H = 40;
  const LINE_STAGGER = 4;  // frames between each line appearing
  const LINE_ANIM_FRAMES = 8;

  const codeBlockH =
    TITLE_BAR_H + PAD_V + numLines * LINE_HEIGHT + PAD_V;

  // ── Cursor blink (only in cursor mode, after typing ends) ─────────────────
  const typingDone = charsVisible >= totalChars;
  const cursorBlinkFrame = typingDone ? localFrame - Math.ceil(totalChars / CHARS_PER_FRAME) - 8 : localFrame;
  const cursorOpacity = lineByLine
    ? 0
    : interpolate(cursorBlinkFrame % 28, [0, 3, 13, 16, 28], [1, 1, 0, 0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  // Which line the cursor is on (cursor mode)
  let cursorLine = 0;
  if (!lineByLine) {
    let acc = 0;
    for (let li = 0; li < lines.length; li++) {
      acc += lines[li].length + 1;
      if (charsVisible < acc) {
        cursorLine = li;
        break;
      }
      cursorLine = li;
    }
  }

  return (
    <div
      style={{
        opacity: blockOpacity,
        transform: `scale(${blockScale})`,
        transformOrigin: "center center",
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          background: theme.colors.bg2,
          border: `1px solid ${theme.colors.grid}`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: `0 8px 40px ${theme.colors.bg}99, 0 0 0 1px ${theme.colors.grid}44`,
          fontFamily: theme.fonts.mono,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* ── Title bar ──────────────────────────────────────────────────── */}
        <div
          style={{
            height: TITLE_BAR_H,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            borderBottom: `1px solid ${theme.colors.grid}`,
            background: `${theme.colors.bg}88`,
            gap: 8,
            boxSizing: "border-box",
          }}
        >
          {/* Traffic-light dots */}
          {(["#FF5F56", "#FFBD2E", "#27C93F"] as const).map((c, i) => (
            <div
              key={i}
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: c,
                opacity: 0.85,
                flexShrink: 0,
              }}
            />
          ))}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Filename/title centred */}
          {title && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                textAlign: "center",
                fontSize: 12,
                color: theme.colors.inkSoft,
                letterSpacing: "0.04em",
                pointerEvents: "none",
                fontFamily: theme.fonts.mono,
              }}
            >
              {title}
            </div>
          )}
        </div>

        {/* ── Code body ──────────────────────────────────────────────────── */}
        <div
          style={{
            padding: `${PAD_V}px 0`,
            minHeight: codeBlockH - TITLE_BAR_H,
            position: "relative",
            boxSizing: "border-box",
          }}
        >
          {lines.map((rawLine, li) => {
            const isHighlighted = highlightLines.includes(li + 1);

            // ── Per-line animation (lineByLine mode) ─────────────────────
            const lineLocalFrame = localFrame - 8 - li * LINE_STAGGER;
            const lineOpacity = lineByLine
              ? interpolate(lineLocalFrame, [0, LINE_ANIM_FRAMES], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : Math.min(1, lineVisibility(li) > 0 ? 1 : 0);

            const lineSlideX = lineByLine
              ? interpolate(lineLocalFrame, [0, LINE_ANIM_FRAMES], [-20, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 0;

            // Skip rendering invisible lines (performance)
            if (lineOpacity <= 0.005 && lineSlideX <= -19.9) return null;

            // ── Highlight glow pulse ──────────────────────────────────────
            // Pulse happens 4 frames after the line has finished revealing
            const pulseStart = 8 + li * LINE_STAGGER + LINE_ANIM_FRAMES + 4;
            const pulseFrame = localFrame - pulseStart;
            const glowOpacity =
              isHighlighted
                ? interpolate(pulseFrame, [0, 6, 14, 20], [0, 0.3, 0.15, 0.12], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })
                : 0;

            // ── Tokenise ─────────────────────────────────────────────────
            const tokens = tokeniseLine(rawLine);

            // In cursor mode, slice tokens to charsVisible
            let visibleTokens = tokens;
            if (!lineByLine) {
              const frac = lineVisibility(li);
              if (frac <= 0) {
                visibleTokens = [];
              } else if (frac < 1) {
                const maxChars = Math.floor(frac * rawLine.length);
                let seen = 0;
                const sliced: Token[] = [];
                for (const tok of tokens) {
                  if (seen >= maxChars) break;
                  if (seen + tok.text.length <= maxChars) {
                    sliced.push(tok);
                    seen += tok.text.length;
                  } else {
                    sliced.push({ ...tok, text: tok.text.slice(0, maxChars - seen) });
                    seen = maxChars;
                  }
                }
                visibleTokens = sliced;
              }
            }

            return (
              <div
                key={li}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: LINE_HEIGHT,
                  opacity: lineOpacity,
                  transform: `translateX(${lineSlideX}px)`,
                  willChange: "transform, opacity",
                  borderLeft: isHighlighted
                    ? `4px solid ${theme.colors.ink}`
                    : "4px solid transparent",
                  background: isHighlighted
                    ? `${theme.colors.ink}${Math.round(glowOpacity * 255).toString(16).padStart(2, "0")}`
                    : "transparent",
                  boxSizing: "border-box",
                  position: "relative",
                }}
              >
                {/* Line number */}
                <div
                  style={{
                    width: LINE_NUM_W,
                    textAlign: "right",
                    paddingRight: 16,
                    fontSize: 12,
                    color: theme.colors.inkFaint,
                    opacity: 0.45,
                    flexShrink: 0,
                    userSelect: "none",
                    fontFamily: theme.fonts.mono,
                    lineHeight: `${LINE_HEIGHT}px`,
                    boxSizing: "border-box",
                  }}
                >
                  {li + 1}
                </div>

                {/* Syntax tokens */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    paddingRight: PAD_H,
                    flex: 1,
                    overflow: "hidden",
                    fontFamily: theme.fonts.mono,
                    fontSize: 13,
                    lineHeight: `${LINE_HEIGHT}px`,
                    whiteSpace: "pre",
                  }}
                >
                  {visibleTokens.map((tok, ti) => (
                    <span
                      key={ti}
                      style={{
                        color: tokenColor(tok, theme),
                        opacity: tokenOpacity(tok),
                      }}
                    >
                      {tok.text}
                    </span>
                  ))}

                  {/* Blinking cursor at active line (cursor mode) */}
                  {!lineByLine && li === cursorLine && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 7,
                        height: 14,
                        background: theme.colors.ink,
                        opacity: cursorOpacity,
                        verticalAlign: "text-top",
                        marginTop: 7,
                        marginLeft: 1,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
