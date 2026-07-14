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

interface IconGridProps {
  theme: Theme;
  timing: { start: number; end?: number };
  items: { icon: string; label: string; description?: string }[];
  columns?: number;
  style?: "cards" | "minimal" | "numbered";
}

// ─── SVG icon map ────────────────────────────────────────────────────────────

const SVG_ICONS: Record<string, React.FC<{ color: string }>> = {
  check: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="2" opacity={0.3} />
      <path
        d="M11 20.5 L17.5 27 L29 14"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  star: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M20 4 L23.9 14.6 H35.1 L26.1 21.2 L29.9 31.8 L20 25.2 L10.1 31.8 L13.9 21.2 L4.9 14.6 H16.1 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  lock: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="9" y="19" width="22" height="16" rx="3" stroke={color} strokeWidth="2" />
      <path
        d="M13 19 V14 C13 9.6 27 9.6 27 14 V19"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="27" r="2.5" fill={color} />
    </svg>
  ),
  bolt: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M22 4 L10 22 H19 L18 36 L30 18 H21 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  globe: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="15" stroke={color} strokeWidth="2" />
      <ellipse cx="20" cy="20" rx="7" ry="15" stroke={color} strokeWidth="2" />
      <line x1="5" y1="20" x2="35" y2="20" stroke={color} strokeWidth="2" />
      <line x1="8" y1="12" x2="32" y2="12" stroke={color} strokeWidth="1.5" />
      <line x1="8" y1="28" x2="32" y2="28" stroke={color} strokeWidth="1.5" />
    </svg>
  ),
  arrow: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M8 20 H32 M22 10 L32 20 L22 30"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  code: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M14 12 L6 20 L14 28"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 12 L34 20 L26 28"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="22" y1="8" x2="18" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  shield: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M20 4 L34 10 V20 C34 28 20 36 20 36 C20 36 6 28 6 20 V10 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 20 L18 24 L26 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  chart: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <polyline
        points="6,30 14,18 22,23 30,10 34,14"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="6" y1="34" x2="34" y2="34" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  heart: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M20 33 C20 33 6 24 6 14 C6 9.6 9.6 6 14 6 C16.5 6 18.8 7.2 20 9 C21.2 7.2 23.5 6 26 6 C30.4 6 34 9.6 34 14 C34 24 20 33 20 33 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
};

// ─── Icon renderer ────────────────────────────────────────────────────────────

const isEmoji = (str: string): boolean => {
  // If it's not a single known keyword, treat as emoji
  return !SVG_ICONS[str.toLowerCase()];
};

const IconRenderer: React.FC<{ icon: string; color: string }> = ({ icon, color }) => {
  const key = icon.toLowerCase();
  const SvgIcon = SVG_ICONS[key];

  if (SvgIcon) {
    return <SvgIcon color={color} />;
  }

  // Emoji fallback
  return (
    <span
      style={{
        fontSize: 40,
        lineHeight: 1,
        display: "block",
        userSelect: "none",
      }}
    >
      {icon}
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const IconGrid: React.FC<IconGridProps> = ({
  theme,
  timing,
  items,
  columns = 3,
  style = "cards",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const localFrame = frame - timing.start * fps;

  // Grid container fade + scale
  const gridOpacity = interpolate(localFrame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const gridScale = interpolate(localFrame, [0, 14], [0.98, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Stagger config: 4 frames apart, row-major order
  const STAGGER_FRAMES = 4;
  const ITEM_DURATION = 12;

  // Layout constants
  const CONTAINER_PADDING = 80;
  const COL_GAP = 32;
  const ROW_GAP = 32;
  const availableWidth = width - CONTAINER_PADDING * 2;
  const cellWidth = (availableWidth - COL_GAP * (columns - 1)) / columns;

  // Accent colors cycle for cards/numbered
  const accentPalette = [
    theme.colors.green,
    theme.colors.purple,
    theme.colors.amber,
    theme.colors.red,
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: availableWidth,
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${ROW_GAP}px ${COL_GAP}px`,
          opacity: gridOpacity,
          transform: `scale(${gridScale})`,
          willChange: "transform, opacity",
        }}
      >
        {items.map((item, i) => {
          const itemDelay = i * STAGGER_FRAMES;
          const itemFrame = localFrame - itemDelay;

          const itemOpacity = interpolate(itemFrame, [0, ITEM_DURATION], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const itemY = interpolate(itemFrame, [0, ITEM_DURATION], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const accentColor = accentPalette[i % accentPalette.length];

          return (
            <div
              key={i}
              style={{
                opacity: itemOpacity,
                transform: `translateY(${itemY}px)`,
                willChange: "transform, opacity",
              }}
            >
              {style === "cards" && (
                <CardItem
                  item={item}
                  accentColor={accentColor}
                  theme={theme}
                />
              )}
              {style === "minimal" && (
                <MinimalItem
                  item={item}
                  accentColor={accentColor}
                  theme={theme}
                />
              )}
              {style === "numbered" && (
                <NumberedItem
                  item={item}
                  index={i}
                  accentColor={accentColor}
                  theme={theme}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── cards style ─────────────────────────────────────────────────────────────

const CardItem: React.FC<{
  item: { icon: string; label: string; description?: string };
  accentColor: string;
  theme: Theme;
}> = ({ item, accentColor, theme }) => (
  <div
    style={{
      backgroundColor: theme.colors.bg2,
      borderRadius: 12,
      padding: "32px 28px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 14,
      borderTop: `3px solid ${accentColor}`,
      minHeight: 180,
      boxSizing: "border-box",
    }}
  >
    <div style={{ lineHeight: 0 }}>
      <IconRenderer icon={item.icon} color={accentColor} />
    </div>
    <div
      style={{
        fontFamily: theme.fonts.display,
        fontSize: 20,
        fontWeight: 700,
        color: theme.colors.ink,
        lineHeight: 1.25,
        letterSpacing: "-0.01em",
      }}
    >
      {item.label}
    </div>
    {item.description && (
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 16,
          color: theme.colors.inkSoft,
          lineHeight: 1.6,
        }}
      >
        {item.description}
      </div>
    )}
  </div>
);

// ─── minimal style ────────────────────────────────────────────────────────────

const MinimalItem: React.FC<{
  item: { icon: string; label: string; description?: string };
  accentColor: string;
  theme: Theme;
}> = ({ item, accentColor, theme }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      padding: "20px 12px",
    }}
  >
    <div style={{ lineHeight: 0 }}>
      <IconRenderer icon={item.icon} color={accentColor} />
    </div>
    <div
      style={{
        fontFamily: theme.fonts.body,
        fontSize: 18,
        fontWeight: 600,
        color: theme.colors.ink,
        textAlign: "center",
        lineHeight: 1.3,
      }}
    >
      {item.label}
    </div>
  </div>
);

// ─── numbered style ───────────────────────────────────────────────────────────

const NumberedItem: React.FC<{
  item: { icon: string; label: string; description?: string };
  index: number;
  accentColor: string;
  theme: Theme;
}> = ({ item, index, accentColor, theme }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 14,
      padding: "24px 20px",
    }}
  >
    {/* Number circle */}
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        backgroundColor: accentColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: theme.fonts.mono,
          fontSize: 18,
          fontWeight: 700,
          color: theme.colors.bg,
          lineHeight: 1,
        }}
      >
        {index + 1}
      </span>
    </div>
    <div
      style={{
        fontFamily: theme.fonts.display,
        fontSize: 20,
        fontWeight: 700,
        color: theme.colors.ink,
        lineHeight: 1.25,
      }}
    >
      {item.label}
    </div>
    {item.description && (
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 16,
          color: theme.colors.inkSoft,
          lineHeight: 1.6,
        }}
      >
        {item.description}
      </div>
    )}
  </div>
);
