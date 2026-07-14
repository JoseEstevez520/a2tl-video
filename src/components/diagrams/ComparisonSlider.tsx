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

interface ComparisonSliderProps {
  theme: Theme;
  timing: { start: number; end?: number };
  beforeLabel?: string;
  afterLabel?: string;
  orientation?: "horizontal" | "vertical";
  autoPlay?: boolean;
  autoPlayDuration?: number;
  handleColor?: string;
}

const W = 800;
const H = 450;

const BeforeContent: React.FC<{ theme: Theme }> = ({ theme }) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={theme.colors.bg2} />
    <rect x={0} y={0} width={W} height={56} fill={theme.colors.bg} opacity={0.5} />
    <rect x={20} y={18} width={24} height={4} rx={2} fill={theme.colors.inkFaint} opacity={0.3} />
    <rect x={48} y={18} width={80} height={4} rx={2} fill={theme.colors.inkFaint} opacity={0.2} />
    <rect x={0} y={56} width={180} height={H - 56} fill={theme.colors.bg} opacity={0.25} />
    <rect x={14} y={80} width={120} height={10} rx={3} fill={theme.colors.inkFaint} opacity={0.15} />
    <rect x={14} y={100} width={90} height={10} rx={3} fill={theme.colors.inkFaint} opacity={0.1} />
    <rect x={14} y={124} width={110} height={10} rx={3} fill={theme.colors.inkFaint} opacity={0.1} />
    <rect x={200} y={80} width={560} height={150} rx={10} fill={theme.colors.inkFaint} opacity={0.08} />
    <rect x={200} y={250} width={560} height={150} rx={10} fill={theme.colors.inkFaint} opacity={0.05} />
  </>
);

const AfterContent: React.FC<{ theme: Theme }> = ({ theme }) => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={theme.colors.bg} />
    <rect x={0} y={0} width={W} height={56} fill={theme.colors.purple} opacity={0.12} />
    <rect x={0} y={56} width={W} height={2} fill={theme.colors.purple} opacity={0.3} />
    <circle cx={32} cy={28} r={8} fill={theme.colors.purple} opacity={0.4} />
    <text x={48} y={32} fill={theme.colors.ink} fontFamily={theme.fonts.body} fontSize={13} fontWeight={600}>
      Dashboard
    </text>
    <rect x={0} y={58} width={180} height={H - 58} fill={theme.colors.bg2} />
    <rect x={14} y={80} width={120} height={32} rx={6} fill={theme.colors.green} opacity={0.12} />
    <rect x={18} y={92} width={4} height={8} rx={2} fill={theme.colors.green} />
    <text x={30} y={99} fill={theme.colors.inkSoft} fontFamily={theme.fonts.body} fontSize={12}>
      Overview
    </text>
    <rect x={14} y={120} width={110} height={32} rx={6} fill="transparent" />
    <text x={30} y={139} fill={theme.colors.inkFaint} fontFamily={theme.fonts.body} fontSize={12}>
      Analytics
    </text>
    <rect x={14} y={160} width={100} height={32} rx={6} fill="transparent" />
    <text x={30} y={179} fill={theme.colors.inkFaint} fontFamily={theme.fonts.body} fontSize={12}>
      Settings
    </text>
    <rect x={200} y={80} width={560} height={150} rx={10} fill={theme.colors.bg2} stroke={theme.colors.grid} strokeWidth={1} />
    <rect x={200} y={80} width={560} height={4} rx={10} fill={theme.colors.purple} />
    <text x={224} y={112} fill={theme.colors.ink} fontFamily={theme.fonts.body} fontSize={16} fontWeight={600}>
      Active Projects
    </text>
    <text x={224} y={132} fill={theme.colors.inkSoft} fontFamily={theme.fonts.body} fontSize={12}>
      You have 4 active projects this quarter
    </text>
    <rect x={224} y={152} width={160} height={60} rx={8} fill={theme.colors.green} opacity={0.08} stroke={theme.colors.green} strokeWidth={1} strokeOpacity={0.2} />
    <text x={240} y={176} fill={theme.colors.green} fontFamily={theme.fonts.mono} fontSize={18} fontWeight={700}>
      82%
    </text>
    <text x={240} y={194} fill={theme.colors.inkSoft} fontFamily={theme.fonts.body} fontSize={10}>
      Completion
    </text>
    <rect x={404} y={152} width={160} height={60} rx={8} fill={theme.colors.amber} opacity={0.08} stroke={theme.colors.amber} strokeWidth={1} strokeOpacity={0.2} />
    <text x={420} y={176} fill={theme.colors.amber} fontFamily={theme.fonts.mono} fontSize={18} fontWeight={700}>
      12
    </text>
    <text x={420} y={194} fill={theme.colors.inkSoft} fontFamily={theme.fonts.body} fontSize={10}>
      Pending
    </text>
    <rect x={584} y={152} width={160} height={60} rx={8} fill={theme.colors.purple} opacity={0.08} stroke={theme.colors.purple} strokeWidth={1} strokeOpacity={0.2} />
    <text x={600} y={176} fill={theme.colors.purple} fontFamily={theme.fonts.mono} fontSize={18} fontWeight={700}>
      6
    </text>
    <text x={600} y={194} fill={theme.colors.inkSoft} fontFamily={theme.fonts.body} fontSize={10}>
      Reviews
    </text>
    <rect x={200} y={250} width={560} height={150} rx={10} fill={theme.colors.bg2} stroke={theme.colors.grid} strokeWidth={1} />
    <rect x={200} y={250} width={560} height={4} rx={10} fill={theme.colors.amber} />
    <text x={224} y={282} fill={theme.colors.ink} fontFamily={theme.fonts.body} fontSize={16} fontWeight={600}>
      Recent Activity
    </text>
    <rect x={224} y={300} width={520} height={1} fill={theme.colors.grid} />
    <circle cx={234} cy={320} r={4} fill={theme.colors.green} />
    <text x={248} y={324} fill={theme.colors.inkSoft} fontFamily={theme.fonts.body} fontSize={12}>
      Updated deployment pipeline
    </text>
    <circle cx={234} cy={344} r={4} fill={theme.colors.purple} />
    <text x={248} y={348} fill={theme.colors.inkSoft} fontFamily={theme.fonts.body} fontSize={12}>
      New team member joined
    </text>
  </>
);

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  theme,
  timing,
  beforeLabel = "Before",
  afterLabel = "After",
  orientation = "horizontal",
  autoPlay = true,
  autoPlayDuration = 60,
  handleColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - timing.start * fps;

  const isHorizontal = orientation === "horizontal";

  const wipeProgress = autoPlay
    ? interpolate(localFrame, [0, autoPlayDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const wipePos = isHorizontal ? wipeProgress * W : wipeProgress * H;
  const hc = handleColor ?? theme.colors.ink;
  const clipId = `cs-${timing.start}`.replace(".", "_");
  const labelOpacity = interpolate(wipeProgress, [0, 0.08], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <clipPath id={clipId}>
          {isHorizontal ? (
            <rect x={0} y={0} width={wipePos} height={H} />
          ) : (
            <rect x={0} y={0} width={W} height={wipePos} />
          )}
        </clipPath>
      </defs>

      <BeforeContent theme={theme} />

      <g clipPath={`url(#${clipId})`}>
        <AfterContent theme={theme} />
      </g>

      <line
        x1={isHorizontal ? wipePos : 0}
        y1={isHorizontal ? 0 : wipePos}
        x2={isHorizontal ? wipePos : W}
        y2={isHorizontal ? H : wipePos}
        stroke={hc}
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      <line
        x1={isHorizontal ? wipePos : 0}
        y1={isHorizontal ? 0 : wipePos}
        x2={isHorizontal ? wipePos : W}
        y2={isHorizontal ? H : wipePos}
        stroke={theme.colors.bg}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.3}
      />

      <circle
        cx={isHorizontal ? wipePos : W / 2}
        cy={isHorizontal ? H / 2 : wipePos}
        r={14}
        fill={hc}
        opacity={0.12}
      />
      <circle
        cx={isHorizontal ? wipePos : W / 2}
        cy={isHorizontal ? H / 2 : wipePos}
        r={8}
        fill={hc}
        stroke={theme.colors.bg}
        strokeWidth={2.5}
      />

      <g opacity={labelOpacity}>
        {isHorizontal ? (
          <>
            <text
              x={Math.max(wipePos - 12, 0)}
              y={H - 14}
              textAnchor="end"
              fill={theme.colors.inkFaint}
              fontFamily={theme.fonts.mono}
              fontSize={11}
              letterSpacing="0.08em"
            >
              {beforeLabel}
            </text>
            <text
              x={Math.min(wipePos + 12, W)}
              y={H - 14}
              textAnchor="start"
              fill={theme.colors.inkFaint}
              fontFamily={theme.fonts.mono}
              fontSize={11}
              letterSpacing="0.08em"
            >
              {afterLabel}
            </text>
          </>
        ) : (
          <>
            <text
              x={14}
              y={Math.max(wipePos - 12, 0)}
              textAnchor="start"
              dominantBaseline="text-after-edge"
              fill={theme.colors.inkFaint}
              fontFamily={theme.fonts.mono}
              fontSize={11}
              letterSpacing="0.08em"
            >
              {beforeLabel}
            </text>
            <text
              x={14}
              y={Math.min(wipePos + 12, H)}
              textAnchor="start"
              dominantBaseline="hanging"
              fill={theme.colors.inkFaint}
              fontFamily={theme.fonts.mono}
              fontSize={11}
              letterSpacing="0.08em"
            >
              {afterLabel}
            </text>
          </>
        )}
      </g>
    </svg>
  );
};
