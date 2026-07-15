import React from 'react';
import { Sequence, AbsoluteFill, registerRoot, Composition, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { GlassCodeBlock } from './components/remocn/glass-code-block';
import { AnimatedBarChart } from './components/remocn/animated-bar-chart';
import { TerminalSimulator } from './components/remocn/terminal-simulator';
import { KineticCenterBuild } from './components/remocn/kinetic-center-build';
import { DataFlowPipes } from './components/remocn/data-flow-pipes';
import { Backdrop } from './components/remocn/backdrop';

const BG = '#0a0a0f';
const C = '#00d4ff';
const C2 = '#8B5CF6';
const FONT = 'Inter, system-ui, sans-serif';
const fps = 30;

const Scene: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{ background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
    {children}
  </AbsoluteFill>
);

// ═══ Text reveal with proper word spacing ═══
const TextReveal: React.FC<{text: string; fontSize: number; delay?: number; color?: string; weight?: number; spacing?: string}> = ({
  text, fontSize, delay = 0, color = C, weight = 700, spacing = '0.08em'
}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', /* gap via marginRight */ fontFamily: FONT }}>
      {words.map((w, i) => {
        const d = Math.round((delay + i * 0.1) * fps);
        const o = interpolate(frame - d, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const y = interpolate(frame - d, [0, 12], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return <span key={i} style={{ display: 'inline-block', opacity: o, transform: `translateY(${y}px)`, fontSize, fontWeight: weight, color, fontFamily: FONT, marginRight: 12 }}>{w}</span>;
      })}
    </div>
  );
};

// ═══ SVG Icons (no emojis) ═══
const IconFile = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;
const IconGear = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>;
const IconCode = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const IconFilm = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="1.5"><rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"/><line x1="7" x2="7" y1="2" y2="22"/><line x1="17" x2="17" y1="2" y2="22"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="2" x2="7" y1="7" y2="7"/><line x1="2" x2="7" y1="17" y2="17"/><line x1="17" x2="22" y1="7" y2="7"/><line x1="17" x2="22" y1="17" y2="17"/></svg>;

// ═══ CountUp ═══
const CountUp: React.FC<{value: number; label: string}> = ({value, label}) => {
  const frame = useCurrentFrame();
  const progress = spring({ frame, fps, config: { damping: 30, stiffness: 60 } });
  const current = Math.round(progress * value);
  const scale = interpolate(frame, [0, 15], [0.85, 1], { extrapolateRight: 'clamp' });
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{ textAlign: 'center', opacity, transform: `scale(${scale})` }}>
      <div style={{ fontSize: 180, fontWeight: 800, color: C, fontFamily: FONT, letterSpacing: '-0.03em' }}>{current}</div>
      <div style={{ fontSize: 32, color: '#666', fontFamily: FONT, marginTop: 8, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{label}</div>
    </div>
  );
};

// ═══ SCENES ═══

// 1. Hero
const S1 = () => (
  <Scene>
    <Backdrop color={C} />
    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
      <TextReveal text="VDSL" fontSize={160} delay={0.1} weight={800} spacing="0.15em" />
      <TextReveal text="Video Description Language" fontSize={26} delay={0.6} color="#666" weight={400} spacing="0.12em" />
    </div>
  </Scene>
);

// 2. Tagline
const S2 = () => (
  <Scene>
    <TextReveal text="Describe videos in 100 lines" fontSize={64} delay={0.2} spacing="0.12em" />
    <TextReveal text="Render professional MP4s" fontSize={28} delay={1} color="#555" weight={400} spacing="0.1em" />
  </Scene>
);

// 3. Kinetic
const S3 = () => (
  <Scene>
    <KineticCenterBuild text="Write. Compile. Render." fontSize={72} color={C} fontWeight={700} />
  </Scene>
);

// 4. Code
const S4 = () => (
  <Scene>
    <GlassCodeBlock
      code={`VDSL/1
theme dark-tech
canvas 1920x1080

scene "Intro" 5s cut
  text "Hello" hero center 0-3s
  label "your video" center 1.5s

scene "Data" 6s crossfade
  chart bar "Metrics" 0-6s
    data: "Before" 100, "After" 15

scene "Close" 3s crossfade
  quote "Ship it." 0-3s`}
      title="demo.vdsl"
      aura
      width={1200}
      height={680}
      fontSize={20}
    />
  </Scene>
);

// 5. Terminal
const S5 = () => (
  <Scene>
    <TerminalSimulator
      lines={[
        { text: "npx vdsl render demo.vdsl -o video.mp4", type: "command" },
        { text: "Parsing 3 scenes...", type: "log" },
        { text: "Compiling → Remotion JSX (178 lines)", type: "log" },
        { text: "Rendering with Chrome Headless...", type: "log", pause: 30 },
        { text: "✓ Rendered → video.mp4 (2.1 MB, 14s)", type: "success" },
      ]}
      title="Terminal"
      width={1100}
      fontSize={18}
    />
  </Scene>
);

// 6. Bar chart
const S6 = () => {
  const frame = useCurrentFrame();
  const titleO = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <Scene>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ fontSize: 28, color: '#888', fontWeight: 600, marginBottom: 60, opacity: titleO, fontFamily: FONT, textAlign: 'center' }}>
          Tokens per 74-second video
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <AnimatedBarChart
            data={[8000, 1800, 400]}
            labels={["Raw HTML", "Remotion JSX", "VDSL"]}
            barColor={C}
            width={1100}
            height={400}
            gap={80}
          />
        </div>
      </div>
    </Scene>
  );
};

// 7. Counter
const S7 = () => (
  <Scene>
    <CountUp value={38} label="components" />
  </Scene>
);

// 8. Architecture — CUSTOM DataFlowPipes with VDSL pipeline data
const S8 = () => (
  <Scene>
    <DataFlowPipes
      nodes={[
        { id: "vdsl", x: 140, y: 360, label: ".vdsl" },
        { id: "parser", x: 460, y: 240, label: "Parser" },
        { id: "compiler", x: 460, y: 480, label: "Compiler" },
        { id: "jsx", x: 780, y: 360, label: "Remotion JSX" },
        { id: "chrome", x: 1100, y: 280, label: "Chrome" },
        { id: "mp4", x: 1100, y: 440, label: "MP4" },
      ]}
      edges={[
        { from: "vdsl", to: "parser", startFrame: 0 },
        { from: "vdsl", to: "compiler", startFrame: 8 },
        { from: "parser", to: "jsx", startFrame: 20 },
        { from: "compiler", to: "jsx", startFrame: 28 },
        { from: "jsx", to: "chrome", startFrame: 40 },
        { from: "jsx", to: "mp4", startFrame: 48 },
      ]}
      pulseColor={C}
      pipeColor="#2a2a3a"
      nodeColor="#141420"
      textColor="#ccc"
    />
  </Scene>
);

// 9. Pipeline steps — SVG icons, no emojis
const S9 = () => {
  const frame = useCurrentFrame();
  const steps = [
    { label: ".vdsl", desc: "100 lines", Icon: IconFile },
    { label: "Parser", desc: "Tokenize → AST", Icon: IconGear },
    { label: "Compiler", desc: "AST → JSX", Icon: IconCode },
    { label: "Render", desc: "Chrome → MP4", Icon: IconFilm },
  ];
  return (
    <Scene>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {steps.map((s, i) => {
          const d = i * 12;
          const o = interpolate(frame - d, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const scale = spring({ frame: Math.max(0, frame - d), fps, config: { damping: 14, stiffness: 120 } });
          return (
            <React.Fragment key={i}>
              <div style={{
                opacity: o, transform: `scale(${0.85 + scale * 0.15})`,
                background: '#141420', border: '1px solid #2a2a3a', borderRadius: 16,
                padding: '28px 36px', textAlign: 'center', minWidth: 180,
              }}>
                <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}><s.Icon /></div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C, fontFamily: FONT }}>{s.label}</div>
                <div style={{ fontSize: 13, color: '#555', fontFamily: FONT, marginTop: 6 }}>{s.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" style={{
                  opacity: interpolate(frame - d - 8, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                }}>
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Scene>
  );
};

// 10. Close
const S10 = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const y = interpolate(frame, [0, 20], [16, 0], { extrapolateRight: 'clamp' });
  return (
    <Scene>
      <div style={{ textAlign: 'center', opacity: o, transform: `translateY(${y}px)` }}>
        <div style={{ fontSize: 44, color: C, fontWeight: 700, fontFamily: FONT }}>
          github.com/JoseEstevez520/vdsl
        </div>
        <div style={{ fontSize: 20, color: '#555', fontFamily: FONT, marginTop: 14, letterSpacing: '0.05em' }}>
          Describe videos. Render beauty.
        </div>
      </div>
    </Scene>
  );
};

const scenes = [
  { C: S1, d: 5 }, { C: S2, d: 4 }, { C: S3, d: 5 }, { C: S4, d: 8 },
  { C: S5, d: 9 }, { C: S6, d: 7 }, { C: S7, d: 4 }, { C: S8, d: 7 },
  { C: S9, d: 6 }, { C: S10, d: 4 },
];

const Video = () => {
  let offset = 0;
  return (
    <AbsoluteFill>
      {scenes.map((s, i) => {
        const from = offset;
        offset += s.d * fps;
        return <Sequence key={i} from={from} durationInFrames={s.d * fps}><s.C /></Sequence>;
      })}
    </AbsoluteFill>
  );
};

const Root = () => (
  <Composition id="Video" component={Video}
    durationInFrames={scenes.reduce((s, sc) => s + sc.d * fps, 0)}
    fps={30} width={1920} height={1080} />
);
registerRoot(Root);
