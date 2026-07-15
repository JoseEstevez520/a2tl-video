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
const FONT = 'Inter, system-ui, -apple-system, sans-serif';
const fps = 30;

// Dark scene wrapper
const Scene: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{ background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
    {children}
  </AbsoluteFill>
);

// Custom word reveal (sans-serif, controlled)
const WordRevealCustom: React.FC<{text: string; fontSize: number; delay?: number; color?: string; weight?: number}> = ({text, fontSize, delay = 0, color = C, weight = 700}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.25em' }}>
      {words.map((w, i) => {
        const d = Math.round((delay + i * 0.12) * fps);
        const o = interpolate(frame - d, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const y = interpolate(frame - d, [0, 12], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return <span key={i} style={{ display: 'inline-block', opacity: o, transform: `translateY(${y}px)`, fontSize, fontWeight: weight, color, fontFamily: FONT }}>{w}</span>;
      })}
    </div>
  );
};

// Custom count up (not NumberWheel which shows random digits)
const CountUpCustom: React.FC<{value: number; label: string}> = ({value, label}) => {
  const frame = useCurrentFrame();
  const progress = spring({ frame, fps, config: { damping: 30, stiffness: 60 } });
  const current = Math.round(progress * value);
  const scaleIn = interpolate(frame, [0, 15], [0.8, 1], { extrapolateRight: 'clamp' });
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{ textAlign: 'center', opacity, transform: `scale(${scaleIn})` }}>
      <div style={{ fontSize: 180, fontWeight: 800, color: C, fontFamily: FONT, letterSpacing: '-0.03em' }}>{current}</div>
      <div style={{ fontSize: 36, color: '#666', fontFamily: FONT, marginTop: 8 }}>{label}</div>
    </div>
  );
};

// 1. Hero
const S1 = () => (
  <Scene>
    <Backdrop color={C} />
    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 160, fontWeight: 800, color: C, fontFamily: FONT, letterSpacing: '-0.04em' }}>
        <WordRevealCustom text="VDSL" fontSize={160} />
      </div>
      <div style={{ fontSize: 24, color: '#555', fontFamily: FONT, marginTop: 16, opacity: interpolate(0, [0, 1], [0, 1]) }}>
        Video Description Language
      </div>
    </div>
  </Scene>
);

// 2. Tagline — custom, no StaggeredFadeUp (it forces white bg)
const S2 = () => (
  <Scene>
    <WordRevealCustom text="Describe videos in 100 lines" fontSize={64} delay={0.2} />
  </Scene>
);

// 3. Write.Compile.Render
const S3 = () => (
  <Scene>
    <KineticCenterBuild text="Write. Compile. Render." fontSize={72} color={C} fontWeight={700} />
  </Scene>
);

// 4. Code — bigger
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

// 6. Bar chart — title on top, centered
const S6 = () => {
  const frame = useCurrentFrame();
  const titleO = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <Scene>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 28, color: '#888', fontWeight: 600, marginBottom: 40, opacity: titleO, fontFamily: FONT }}>
          Tokens per 74-second video
        </div>
        <AnimatedBarChart
          data={[8000, 1800, 400]}
          labels={["Raw HTML", "Remotion JSX", "VDSL"]}
          barColor={C}
          width={1100}
          height={450}
          gap={80}
        />
      </div>
    </Scene>
  );
};

// 7. Counter — custom (not NumberWheel)
const S7 = () => (
  <Scene>
    <CountUpCustom value={38} label="components" />
  </Scene>
);

// 8. Architecture
const S8 = () => (
  <Scene>
    <DataFlowPipes />
  </Scene>
);

// 9. Pipeline steps — custom (ProgressSteps needs config)
const S9 = () => {
  const frame = useCurrentFrame();
  const steps = [
    { label: ".vdsl", desc: "100 lines of VDSL", icon: "📝" },
    { label: "Parser", desc: "Tokenize → AST", icon: "⚙️" },
    { label: "Compiler", desc: "AST → Remotion JSX", icon: "🔧" },
    { label: "Render", desc: "Chrome → MP4", icon: "🎬" },
  ];
  return (
    <Scene>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {steps.map((s, i) => {
          const d = i * 12;
          const o = interpolate(frame - d, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const scale = spring({ frame: Math.max(0, frame - d), fps, config: { damping: 14, stiffness: 120 } });
          return (
            <React.Fragment key={i}>
              <div style={{
                opacity: o, transform: `scale(${0.8 + scale * 0.2})`,
                background: '#141420', border: '1px solid #2a2a3a', borderRadius: 16,
                padding: '28px 32px', textAlign: 'center', minWidth: 200,
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C, fontFamily: FONT }}>{s.label}</div>
                <div style={{ fontSize: 14, color: '#666', fontFamily: FONT, marginTop: 6 }}>{s.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ fontSize: 28, color: '#333', opacity: interpolate(frame - d - 6, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>→</div>
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
  const y = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: 'clamp' });
  return (
    <Scene>
      <div style={{ textAlign: 'center', opacity: o, transform: `translateY(${y}px)` }}>
        <div style={{ fontSize: 48, color: C, fontWeight: 700, fontFamily: FONT }}>
          github.com/JoseEstevez520/vdsl
        </div>
        <div style={{ fontSize: 22, color: '#555', fontFamily: FONT, marginTop: 16 }}>
          Describe videos. Render beauty.
        </div>
      </div>
    </Scene>
  );
};

const scenes = [
  { C: S1, d: 4 }, { C: S2, d: 4 }, { C: S3, d: 5 }, { C: S4, d: 8 },
  { C: S5, d: 9 }, { C: S6, d: 7 }, { C: S7, d: 4 }, { C: S8, d: 6 },
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
