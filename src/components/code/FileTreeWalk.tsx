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

interface TreeNode {
  name: string;
  type: "file" | "folder";
  children?: TreeNode[];
  icon?: string;
}

interface FileTreeWalkProps {
  theme: Theme;
  timing: { start: number; end?: number };
  tree: TreeNode[];
  highlightPath?: string;
  animateEntrance?: boolean;
  showIcons?: boolean;
}

interface FlatNode {
  name: string;
  type: "file" | "folder";
  depth: number;
  icon?: string;
  path: string;
  children?: TreeNode[];
}

function flattenTree(nodes: TreeNode[], depth = 0, parentPath = ""): FlatNode[] {
  const result: FlatNode[] = [];
  for (const node of nodes) {
    const path = parentPath ? `${parentPath}/${node.name}` : node.name;
    result.push({ ...node, depth, path, children: node.children });
    if (node.type === "folder" && node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1, path));
    }
  }
  return result;
}

function fileTypeColor(name: string, theme: Theme): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js": return "#F7DF1E";
    case "jsx": return "#61DAFB";
    case "ts": return "#3178C6";
    case "tsx": return "#60A5FA";
    case "json": return "#7C8B9A";
    case "md": return "#6B9BD2";
    case "css": return "#1572B6";
    case "scss":
    case "sass": return "#CC6699";
    case "html": return "#E34F26";
    case "svg": return "#FFB13B";
    case "yaml":
    case "yml": return "#6BB5A0";
    case "toml": return "#7F5AB6";
    case "lock": return "#E36209";
    case "gitignore": return "#DD4C4F";
    default: return theme.colors.inkSoft;
  }
}

const ROW_H = 28;
const INDENT = 20;
const PAD_LEFT = 16;
const ICON_SIZE = 16;
const STAGGER = 4;

const FolderChevron: React.FC<{ expanded: boolean; color: string }> = ({ expanded, color }) => (
  <path
    d={expanded ? "M4 6l4 4 4-4" : "M6 4l4 4-4 4"}
    fill="none"
    stroke={color}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const FolderIcon: React.FC<{ color: string }> = ({ color }) => (
  <path
    d="M3 7V5a2 2 0 012-2h2l2 2h6a2 2 0 012 2v1M3 7v8a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2H3z"
    fill={color}
    opacity={0.85}
    stroke={color}
    strokeWidth={0.8}
    strokeOpacity={0.3}
  />
);

const FileIcon: React.FC<{ color: string }> = ({ color }) => (
  <path
    d="M5 2h6l4 4v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2z"
    fill={color}
    opacity={0.4}
    stroke={color}
    strokeWidth={0.8}
    strokeOpacity={0.3}
  />
);

export const FileTreeWalk: React.FC<FileTreeWalkProps> = ({
  theme,
  timing,
  tree,
  highlightPath,
  animateEntrance = true,
  showIcons = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - timing.start * fps;

  const flat = flattenTree(tree);
  const totalH = flat.length * ROW_H + 16;
  const svgW = 800;
  const svgH = Math.max(totalH, 300);

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      <rect x={0} y={0} width={svgW} height={svgH} fill="transparent" />
      {flat.map((node, i) => {
        const nodeFrame = animateEntrance
          ? localFrame - i * STAGGER
          : 999;

        const progress = spring({
          frame: Math.max(0, nodeFrame),
          fps,
          config: { damping: 14, stiffness: 200 },
        });

        const opacity = interpolate(
          animateEntrance ? progress : 1,
          [0, 0.3],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const slideY = animateEntrance
          ? interpolate(progress, [0, 1], [-8, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        const y = 12 + i * ROW_H + slideY;
        const x = PAD_LEFT + node.depth * INDENT;
        const isHighlighted = highlightPath !== undefined && node.path === highlightPath;
        const isFolder = node.type === "folder";
        const extColor = isFolder ? theme.colors.amber : fileTypeColor(node.name, theme);

        if (opacity <= 0.01) return null;

        const chevronX = x;
        const chevronY = y + ROW_H / 2;
        const iconX = x + 16;
        const iconY = y + (ROW_H - ICON_SIZE) / 2;
        const textX = iconX + 20;

        return (
          <g key={`${i}-${node.path}`} opacity={opacity}>
            {isHighlighted && (
              <rect
                x={PAD_LEFT}
                y={y}
                width={svgW - PAD_LEFT * 2}
                height={ROW_H}
                rx={4}
                fill={extColor}
                opacity={0.08}
              />
            )}

            {isFolder && (
              <g transform={`translate(${chevronX + 2}, ${chevronY - 4})`}>
                <FolderChevron expanded={true} color={theme.colors.inkSoft} />
              </g>
            )}

            {showIcons && (
              <g transform={`translate(${iconX}, ${iconY})`}>
                {isFolder ? (
                  <FolderIcon color={theme.colors.amber} />
                ) : (
                  <FileIcon color={extColor} />
                )}
              </g>
            )}

            <text
              x={isFolder ? textX + 8 : textX}
              y={y + ROW_H / 2 + 1}
              dominantBaseline="middle"
              fill={isHighlighted ? theme.colors.ink : theme.colors.inkSoft}
              fontFamily={theme.fonts.mono}
              fontSize={13}
              fontWeight={isHighlighted ? 600 : 400}
            >
              {node.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
