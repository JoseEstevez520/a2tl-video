import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface Theme {
  name: string;
  colors: { bg: string; bg2: string; ink: string; inkSoft: string; inkFaint: string; grid: string; green: string; red: string; amber: string; purple: string; };
  fonts: { display: string; body: string; mono: string; };
  grid: boolean;
}

interface QuoteBlockProps {
  theme: Theme;
  timing: { start: number; end?: number };
  quote: string;
  author?: string;
  style?: "editorial" | "callout" | "minimal";
}

/**
 * QuoteBlock — an impactful quote display with editorial styling.
 * The quote reveals word by word with a large quotation mark.
 * Great for: key insights, thesis statements, memorable lines.
 */
export const QuoteBlock: React.FC<QuoteBlockProps> = ({
  theme,
  timing,
  quote,
  author,
  style = "editorial",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(timing.start * fps);
  const localFrame = frame - startFrame;

  const words = quote.split(" ");

  // Big quote mark
  const quoteMarkOpacity = interpolate(localFrame, [0, 12], [0, 0.08], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const quoteMarkScale = interpolate(localFrame, [0, 20], [0.8, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Left accent bar
  const barHeight = interpolate(localFrame, [5, 30], [0, 200], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Author
  const authorOpacity = interpolate(localFrame - 30, [0, 12], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: 0, height: 900,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* Giant quotation mark */}
      {style === "editorial" && (
        <div style={{
          position: "absolute",
          left: 200, top: 180,
          fontFamily: theme.fonts.display,
          fontSize: 400,
          color: theme.colors.ink,
          opacity: quoteMarkOpacity,
          transform: `scale(${quoteMarkScale})`,
          lineHeight: 0.8,
          userSelect: "none",
        }}>
          &ldquo;
        </div>
      )}

      {/* Left accent bar */}
      {style === "callout" && (
        <div style={{
          position: "absolute",
          left: 280,
          top: 350,
          width: 4,
          height: barHeight,
          background: theme.colors.ink,
          borderRadius: 2,
        }} />
      )}

      {/* Quote text — word by word reveal */}
      <div style={{
        maxWidth: 1100,
        paddingLeft: style === "callout" ? 80 : 0,
        paddingRight: 40,
      }}>
        <div style={{
          fontFamily: style === "minimal" ? theme.fonts.body : theme.fonts.display,
          fontSize: style === "minimal" ? 36 : 48,
          fontStyle: style === "editorial" ? "italic" : "normal",
          color: theme.colors.ink,
          lineHeight: 1.4,
          textAlign: style === "minimal" ? "center" : "left",
        }}>
          {words.map((word, i) => {
            const wordDelay = 5 + i * 3;
            const opacity = interpolate(localFrame - wordDelay, [0, 8], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            const y = interpolate(localFrame - wordDelay, [0, 8], [12, 0], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            return (
              <span key={i} style={{
                display: "inline-block",
                opacity,
                transform: `translateY(${y}px)`,
                marginRight: "0.25em",
              }}>
                {word}
              </span>
            );
          })}
        </div>

        {/* Author */}
        {author && (
          <div style={{
            marginTop: 32,
            fontFamily: theme.fonts.body,
            fontSize: 20,
            color: theme.colors.inkSoft,
            opacity: authorOpacity,
            textAlign: style === "minimal" ? "center" : "left",
            letterSpacing: "0.08em",
          }}>
            — {author}
          </div>
        )}
      </div>
    </div>
  );
};
