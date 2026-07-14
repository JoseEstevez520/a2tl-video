import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface Theme {
  name: string;
  colors: { bg: string; bg2: string; ink: string; inkSoft: string; inkFaint: string; grid: string; green: string; red: string; amber: string; purple: string; };
  fonts: { display: string; body: string; mono: string; };
  grid: boolean;
}

interface ArchLayer {
  label: string;
  items: string[];
  color?: string;
}

interface ArchitectureDiagramProps {
  theme: Theme;
  timing: { start: number; end?: number };
  title?: string;
  layers: ArchLayer[];
  direction?: "top-down" | "bottom-up";
  connectors?: boolean;
}

/**
 * ArchitectureDiagram — layered architecture visualization.
 * Shows stacked layers (like a tech stack), each containing items.
 * Layers reveal from bottom-up or top-down with stagger.
 * Great for: tech stacks, system architecture, protocol layers.
 */
export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  theme,
  timing,
  title,
  layers,
  direction = "bottom-up",
  connectors = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(timing.start * fps);
  const localFrame = frame - startFrame;

  const palette = [theme.colors.ink, theme.colors.purple, theme.colors.green, theme.colors.amber, theme.colors.red];

  const layerHeight = 80;
  const layerGap = 16;
  const totalHeight = layers.length * (layerHeight + layerGap) - layerGap;
  const startY = (800 - totalHeight) / 2 + (title ? 40 : 0);

  // Title
  const titleOpacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const orderedLayers = direction === "bottom-up" ? [...layers].reverse() : layers;

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: 0, height: 900,
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      {title && (
        <div style={{
          fontFamily: theme.fonts.display, fontSize: 36, color: theme.colors.ink,
          marginTop: 60, opacity: titleOpacity,
        }}>
          {title}
        </div>
      )}

      <svg viewBox="0 0 1400 700" style={{
        width: 1400, height: 700, marginTop: 20,
      }}>
        {orderedLayers.map((layer, idx) => {
          const layerDelay = 8 + idx * 12;
          const color = layer.color || palette[idx % palette.length];
          const y = startY + idx * (layerHeight + layerGap) - 50;

          const layerOpacity = interpolate(localFrame - layerDelay, [0, 10], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          const layerSlideY = interpolate(localFrame - layerDelay, [0, 12], [
            direction === "bottom-up" ? 30 : -30, 0
          ], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });

          const itemWidth = 1200 / Math.max(layer.items.length, 1);

          return (
            <g key={idx} opacity={layerOpacity} transform={`translate(0, ${layerSlideY})`}>
              {/* Layer background */}
              <rect
                x={100} y={y}
                width={1200} height={layerHeight}
                rx={12} ry={12}
                fill={color}
                fillOpacity={0.08}
                stroke={color}
                strokeWidth={2}
                strokeOpacity={0.3}
              />

              {/* Layer label */}
              <text
                x={115} y={y + 22}
                fontFamily={theme.fonts.body}
                fontSize={13}
                fontWeight={600}
                fill={color}
                letterSpacing="0.12em"
              >
                {layer.label.toUpperCase()}
              </text>

              {/* Items */}
              {layer.items.map((item, itemIdx) => {
                const itemDelay = layerDelay + 6 + itemIdx * 4;
                const itemOpacity = interpolate(localFrame - itemDelay, [0, 8], [0, 1], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                });
                const itemX = 120 + itemIdx * itemWidth + itemWidth / 2;

                return (
                  <g key={itemIdx} opacity={itemOpacity}>
                    <rect
                      x={itemX - itemWidth * 0.4}
                      y={y + 35}
                      width={itemWidth * 0.8}
                      height={36}
                      rx={8} ry={8}
                      fill={theme.colors.bg2}
                      stroke={color}
                      strokeWidth={1.5}
                      strokeOpacity={0.4}
                    />
                    <text
                      x={itemX}
                      y={y + 58}
                      fontFamily={theme.fonts.mono}
                      fontSize={14}
                      fill={theme.colors.ink}
                      textAnchor="middle"
                    >
                      {item}
                    </text>
                  </g>
                );
              })}

              {/* Connector line to next layer */}
              {connectors && idx < orderedLayers.length - 1 && (
                <line
                  x1={700} y1={y + layerHeight}
                  x2={700} y2={y + layerHeight + layerGap}
                  stroke={theme.colors.inkFaint}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  opacity={layerOpacity}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
