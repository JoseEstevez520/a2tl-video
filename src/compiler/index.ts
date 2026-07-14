/**
 * VDSL Compiler
 *
 * Takes a parsed VDSLSpec (JSON AST) and generates a complete, standalone
 * Remotion `.jsx` file ready to be rendered with `npx remotion render`.
 *
 * Pipeline:
 *   VDSLSpec  →  compile()  →  JSX string
 */

import type {
  VDSLSpec,
  Scene,
  Component,
  TextComponent,
  TextCycleComponent,
  LabelComponent,
  TriptychComponent,
  StepSequenceComponent,
  ComparisonComponent,
  CardComponent,
  CodeComponent,
  TraceLogComponent,
  VizComponent,
  BylineComponent,
  CodeRevealComponent,
  ChartComponent,
  TerminalComponent,
  TimelineComponent,
  ProgressComponent,
  CountUpComponent,
  SplitScreenComponent,
  IconGridComponent,
  ParticlesComponent,
  GlowComponent,
  QuoteComponent,
  ArchitectureComponent,
  ZoomRevealComponent,
  MorphComponent,
  KineticTextComponent,
  CodeDiffComponent,
  FileTreeWalkComponent,
  TypingCodeComponent,
  AnimatedCounterComponent,
  ComparisonSliderComponent,
  SceneStackComponent,
} from "../parser/types";
import { indent, propsToJSX, escapeString, serializeValue } from "./codegen";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CompileOptions {
  /**
   * Override the theme name. If omitted the theme from VDSLSpec is used.
   */
  themeName?: string;
  /**
   * Name of the exported composition component (default: "Video").
   */
  componentName?: string;
  /**
   * Use relative imports (./components, ./themes) instead of package imports (vdsl/components).
   * Used by the CLI render command to create self-contained workspaces.
   */
  relativeImports?: boolean;
}

/**
 * Compiles a parsed VDSL spec into a complete Remotion `.jsx` file string.
 *
 * The generated file:
 *  - imports React, Remotion primitives, vdsl components and themes
 *  - resolves the theme at module level
 *  - exports a single composition component (`Video` by default)
 *  - wraps every scene in a `<Sequence>` + `<GridCanvas>` with exact timing
 */
export function compile(spec: VDSLSpec, options: CompileOptions = {}): string {
  const themeName = options.themeName ?? spec.theme ?? "cobalt-grid";
  const componentName = options.componentName ?? "Video";

  // Collect which component names we actually need to import
  const usedComponents = collectUsedComponents(spec);

  const sections: string[] = [];

  // 1. Imports
  sections.push(buildImports(usedComponents, themeName, options.relativeImports ?? false));

  // 2. Theme constant
  sections.push(`const theme = themes['${themeName}'];`);
  sections.push(`const fps = ${spec.canvas ? 30 : 30};`);

  // 3. Main composition
  sections.push(buildComposition(spec, componentName));

  // 4. Remotion root registration
  sections.push(buildRoot(spec, componentName));

  return sections.join("\n\n") + "\n";
}

// ---------------------------------------------------------------------------
// Import collection
// ---------------------------------------------------------------------------

const COMPONENT_IMPORTS: Record<string, string> = {
  WordReveal: "WordReveal",
  TypewriterText: "TypewriterText",
  FadeText: "FadeText",
  TextCycle: "TextCycle",
  Label: "Label",
  Triptych: "Triptych",
  StepSequence: "StepSequence",
  Comparison: "Comparison",
  FormulaCard: "FormulaCard",
  TraceLog: "TraceLog",
  NodeGraph: "NodeGraph",
  FlowDiagram: "FlowDiagram",
  BoundarySim: "BoundarySim",
  WorkspaceDiagram: "WorkspaceDiagram",
  ProtocolCompare: "ProtocolCompare",
  Byline: "Byline",
  GridCanvas: "GridCanvas",
  CodeReveal: "CodeReveal",
  AnimatedChart: "AnimatedChart",
  TerminalReplay: "TerminalReplay",
  Timeline: "Timeline",
  ProgressBar: "ProgressBar",
  CountUp: "CountUp",
  SplitScreen: "SplitScreen",
  IconGrid: "IconGrid",
  ParticleField: "ParticleField",
  GlowOrb: "GlowOrb",
  QuoteBlock: "QuoteBlock",
  ArchitectureDiagram: "ArchitectureDiagram",
  ZoomReveal: "ZoomReveal",
  MorphTransition: "MorphTransition",
  KineticText: "KineticText",
  CodeDiff: "CodeDiff",
  FileTreeWalk: "FileTreeWalk",
  TypingCode: "TypingCode",
  AnimatedCounter: "AnimatedCounter",
  ComparisonSlider: "ComparisonSlider",
  SceneStack: "SceneStack",
};

function collectUsedComponents(spec: VDSLSpec): Set<string> {
  const used = new Set<string>(["GridCanvas"]);

  for (const scene of spec.scenes) {
    for (const comp of scene.components) {
      switch (comp.type) {
        case "text": {
          const tc = comp as TextComponent;
          if (tc.reveal === "typewriter") used.add("TypewriterText");
          else if (tc.reveal === "fade" || tc.reveal === "none") used.add("FadeText");
          else used.add("WordReveal");
          break;
        }
        case "text-cycle":
          used.add("TextCycle");
          break;
        case "label":
          used.add("Label");
          break;
        case "triptych":
          used.add("Triptych");
          break;
        case "step-sequence":
          used.add("StepSequence");
          break;
        case "comparison":
          used.add("Comparison");
          break;
        case "card":
          used.add("FormulaCard");
          break;
        case "code":
          used.add("TypewriterText");
          break;
        case "trace-log":
          used.add("TraceLog");
          break;
        case "viz": {
          const vc = comp as VizComponent;
          switch (vc.vizType) {
            case "node-graph":      used.add("NodeGraph"); break;
            case "flow-diagram":    used.add("FlowDiagram"); break;
            case "boundary-sim":    used.add("BoundarySim"); break;
            case "workspace":       used.add("WorkspaceDiagram"); break;
            case "protocol-compare":used.add("ProtocolCompare"); break;
            default:                used.add("NodeGraph"); // generic fallback
          }
          break;
        }
        case "byline":
          used.add("Byline");
          break;
        case "code-reveal":
          used.add("CodeReveal");
          break;
        case "chart":
          used.add("AnimatedChart");
          break;
        case "terminal":
          used.add("TerminalReplay");
          break;
        case "timeline":
          used.add("Timeline");
          break;
        case "progress":
          used.add("ProgressBar");
          break;
        case "count-up":
          used.add("CountUp");
          break;
        case "split-screen":
          used.add("SplitScreen");
          break;
        case "icon-grid":
          used.add("IconGrid");
          break;
        case "particles":
          used.add("ParticleField");
          break;
        case "glow":
          used.add("GlowOrb");
          break;
        case "quote":
          used.add("QuoteBlock");
          break;
        case "architecture":
          used.add("ArchitectureDiagram");
          break;
        case "zoom-reveal":
          used.add("ZoomReveal");
          break;
        case "morph":
          used.add("MorphTransition");
          break;
        case "kinetic-text":
          used.add("KineticText");
          break;
        case "code-diff":
          used.add("CodeDiff");
          break;
        case "file-tree-walk":
          used.add("FileTreeWalk");
          break;
        case "typing-code":
          used.add("TypingCode");
          break;
        case "animated-counter":
          used.add("AnimatedCounter");
          break;
        case "comparison-slider":
          used.add("ComparisonSlider");
          break;
        case "scene-stack":
          used.add("SceneStack");
          break;
      }
    }
  }

  return used;
}

// ---------------------------------------------------------------------------
// Import block
// ---------------------------------------------------------------------------

function buildImports(used: Set<string>, _themeName: string, relativeImports = false): string {
  const vdslComponents = [...used].filter((c) => c in COMPONENT_IMPORTS).sort();

  const componentImportPath = relativeImports ? './components' : 'vdsl/components';
  const themeImportPath = relativeImports ? './themes' : 'vdsl/themes';

  const lines: string[] = [
    `import React from 'react';`,
    `import { Sequence, AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, registerRoot, Composition } from 'remotion';`,
    `import { ${vdslComponents.join(", ")} } from '${componentImportPath}';`,
    `import { themes } from '${themeImportPath}';`,
  ];

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Composition component
// ---------------------------------------------------------------------------

function buildComposition(spec: VDSLSpec, componentName: string): string {
  const sceneBlocks = spec.scenes.map((scene, i) => buildScene(scene, i, spec));

  const body = sceneBlocks.join("\n");

  return [
    `export const ${componentName} = () => {`,
    `  return (`,
    `    <AbsoluteFill>`,
    indent(body, 3),
    `    </AbsoluteFill>`,
    `  );`,
    `};`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Scene → <Sequence><GridCanvas>…</GridCanvas></Sequence>
// ---------------------------------------------------------------------------

function buildScene(scene: Scene, index: number, spec: VDSLSpec): string {
  // Compute cumulative start frame for this scene
  const startFrame = computeSceneStartFrame(spec, index);
  const durationFrames = Math.round(scene.duration * 30);

  // Timing object covers the full scene duration (in seconds from absolute 0)
  const sceneStartSec = startFrame / 30;
  const sceneEndSec = sceneStartSec + scene.duration;

  const componentLines = scene.components
    .map((comp) => buildComponent(comp, sceneStartSec))
    .filter(Boolean)
    .join("\n");

  const gridProps = propsToJSX({
    theme: "{theme}",
    timing: `{{ start: ${sceneStartSec}, end: ${sceneEndSec} }}`,
  });

  // We need to emit the brace-wrapped expressions literally, so build manually
  const gridCanvasOpen = `<GridCanvas theme={theme} timing={{ start: ${sceneStartSec}, end: ${sceneEndSec} }}>`;
  const gridCanvasClose = `</GridCanvas>`;

  const sceneName = scene.title ? escapeString(scene.title) : `Scene ${index + 1}`;

  const lines: string[] = [
    `{/* Scene ${index + 1}: ${sceneName} */}`,
    `<Sequence from={${startFrame}} durationInFrames={${durationFrames}}>`,
    `  ${gridCanvasOpen}`,
    indent(componentLines || "    {/* empty scene */}", 2),
    `  ${gridCanvasClose}`,
    `</Sequence>`,
  ];

  return lines.join("\n");
}

function computeSceneStartFrame(spec: VDSLSpec, index: number): number {
  let frame = 0;
  for (let i = 0; i < index; i++) {
    frame += Math.round(spec.scenes[i].duration * 30);
  }
  return frame;
}

// ---------------------------------------------------------------------------
// Component dispatch
// ---------------------------------------------------------------------------

function buildComponent(comp: Component, sceneStartSec: number): string {
  switch (comp.type) {
    case "text":              return buildText(comp as TextComponent);
    case "text-cycle":        return buildTextCycle(comp as TextCycleComponent);
    case "label":             return buildLabel(comp as LabelComponent);
    case "triptych":          return buildTriptych(comp as TriptychComponent);
    case "step-sequence":     return buildStepSequence(comp as StepSequenceComponent);
    case "comparison":        return buildComparison(comp as ComparisonComponent);
    case "card":              return buildCard(comp as CardComponent);
    case "code":              return buildCode(comp as CodeComponent);
    case "trace-log":         return buildTraceLog(comp as TraceLogComponent);
    case "viz":               return buildViz(comp as VizComponent);
    case "byline":            return buildByline(comp as BylineComponent);
    case "code-reveal":       return buildCodeReveal(comp as CodeRevealComponent);
    case "chart":             return buildChart(comp as ChartComponent);
    case "terminal":          return buildTerminal(comp as TerminalComponent);
    case "timeline":          return buildTimeline(comp as TimelineComponent);
    case "progress":          return buildProgress(comp as ProgressComponent);
    case "count-up":          return buildCountUp(comp as CountUpComponent);
    case "split-screen":      return buildSplitScreen(comp as SplitScreenComponent);
    case "icon-grid":         return buildIconGrid(comp as IconGridComponent);
    case "particles":         return buildParticles(comp as ParticlesComponent);
    case "glow":              return buildGlow(comp as GlowComponent);
    case "quote":             return buildQuote(comp as QuoteComponent);
    case "architecture":      return buildArchitecture(comp as ArchitectureComponent);
    case "zoom-reveal":       return buildZoomReveal(comp as ZoomRevealComponent);
    case "morph":             return buildMorph(comp as MorphComponent);
    case "kinetic-text":      return buildKineticText(comp as KineticTextComponent);
    case "code-diff":         return buildCodeDiff(comp as CodeDiffComponent);
    case "file-tree-walk":    return buildFileTreeWalk(comp as FileTreeWalkComponent);
    case "typing-code":       return buildTypingCode(comp as TypingCodeComponent);
    case "animated-counter":  return buildAnimatedCounter(comp as AnimatedCounterComponent);
    case "comparison-slider": return buildComparisonSlider(comp as ComparisonSliderComponent);
    case "scene-stack":       return buildSceneStack(comp as SceneStackComponent);
    default:                  return `{/* unknown component type: ${(comp as Component).type} */}`;
  }
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

function buildText(comp: TextComponent): string {
  const reveal = comp.reveal ?? "word-stagger";

  if (reveal === "typewriter") {
    return [
      `<TypewriterText`,
      `  text="${escapeString(comp.content)}"`,
      `  font="${comp.font}"`,
      `  position="${comp.position}"`,
      `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
      `  theme={theme}`,
      `/>`,
    ].join("\n");
  }

  if (reveal === "fade" || reveal === "none") {
    return [
      `<FadeText`,
      `  text="${escapeString(comp.content)}"`,
      `  font="${comp.font}"`,
      `  position="${comp.position}"`,
      `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
      `  theme={theme}`,
      `/>`,
    ].join("\n");
  }

  // Default: WordReveal (covers word-stagger, slide-up, scale-in, etc.)
  return [
    `<WordReveal`,
    `  text="${escapeString(comp.content)}"`,
    `  font="${comp.font}"`,
    `  position="${comp.position}"`,
    `  reveal="${reveal}"`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// TextCycle
// ---------------------------------------------------------------------------

function buildTextCycle(comp: TextCycleComponent): string {
  const phrasesArr = comp.phrases.map((p) => {
    const parts = [`text: "${escapeString(p.text)}"`, `timing: ${serializeValue(p.timing as unknown as Record<string, unknown>)}`];
    if (p.accent) parts.push(`accent: "${p.accent}"`);
    return `{ ${parts.join(", ")} }`;
  });

  return [
    `<TextCycle`,
    `  position="${comp.position}"`,
    `  font="${comp.font}"`,
    `  phrases={[`,
    phrasesArr.map((p) => `    ${p},`).join("\n"),
    `  ]}`,
    `  theme={theme}`,
    `/>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

function buildLabel(comp: LabelComponent): string {
  return [
    `<Label`,
    `  text="${escapeString(comp.text)}"`,
    `  position="${comp.position}"`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Triptych
// ---------------------------------------------------------------------------

function buildTriptych(comp: TriptychComponent): string {
  const itemsArr = comp.items.map((item) => `{ tokens: [${item.tokens.map((t) => `"${escapeString(t)}"`).join(", ")}] }`);

  return [
    `<Triptych`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  reveal="${comp.reveal}"`,
    `  items={[`,
    itemsArr.map((i) => `    ${i},`).join("\n"),
    `  ]}`,
    `  theme={theme}`,
    `/>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// StepSequence
// ---------------------------------------------------------------------------

function buildStepSequence(comp: StepSequenceComponent): string {
  const stepsArr = comp.steps.map(
    (s) => `{ label: "${escapeString(s.label)}", description: "${escapeString(s.description)}" }`
  );

  return [
    `<StepSequence`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  steps={[`,
    stepsArr.map((s) => `    ${s},`).join("\n"),
    `  ]}`,
    `  theme={theme}`,
    `/>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

function buildComparison(comp: ComparisonComponent): string {
  const sidesArr = comp.sides.map((s) => {
    const parts = [
      `side: "${s.side}"`,
      `title: "${escapeString(s.title)}"`,
      `subtitle: "${escapeString(s.subtitle)}"`,
    ];
    if (s.badge) {
      parts.push(`badge: { text: "${escapeString(s.badge.text)}", color: "${s.badge.color}" }`);
    }
    return `{ ${parts.join(", ")} }`;
  });

  return [
    `<Comparison`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  animation="${comp.animation}"`,
    `  sides={[`,
    sidesArr.map((s) => `    ${s},`).join("\n"),
    `  ]}`,
    `  theme={theme}`,
    `/>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Card (FormulaCard)
// ---------------------------------------------------------------------------

function buildCard(comp: CardComponent): string {
  const childrenArr = comp.children.map((c) => {
    switch (c.type) {
      case "formula":  return `{ type: "formula", content: "${escapeString(c.content)}" }`;
      case "arrow":    return `{ type: "arrow"${c.direction ? `, direction: "${escapeString(c.direction)}"` : ""} }`;
      case "result":   return `{ type: "result", content: "${escapeString(c.content)}" }`;
      case "subtitle": return `{ type: "subtitle", content: "${escapeString(c.content)}" }`;
      default:         return `{ type: "unknown" }`;
    }
  });

  return [
    `<FormulaCard`,
    `  position="${comp.position}"`,
    `  reveal="${comp.reveal}"`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  children={[`,
    childrenArr.map((c) => `    ${c},`).join("\n"),
    `  ]}`,
    `  theme={theme}`,
    `/>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Code (TypewriterText with mono font)
// ---------------------------------------------------------------------------

function buildCode(comp: CodeComponent): string {
  const lines: string[] = [
    `<TypewriterText`,
    `  text="${escapeString(comp.content)}"`,
    `  font="mono"`,
    `  position="center"`,
    `  reveal="${comp.reveal}"`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
  ];

  if (comp.modifier) {
    lines.push(`  shrink={${comp.modifier.shrink}}`);
    lines.push(`  moveTop={${serializeValue(comp.modifier.moveTop as unknown as Record<string, unknown>)}}`);
  }

  lines.push(`/>`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// TraceLog
// ---------------------------------------------------------------------------

function buildTraceLog(comp: TraceLogComponent): string {
  const entriesArr = comp.entries.map(
    (e) => `{ tokens: [${e.tokens.map((t) => `"${escapeString(String(t))}"`).join(", ")}] }`
  );

  const lines: string[] = [
    `<TraceLog`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  reveal="${comp.reveal}"`,
  ];

  if (comp.columns && comp.columns.length > 0) {
    lines.push(`  columns={[${comp.columns.map((c) => `"${escapeString(c)}"`).join(", ")}]}`);
  }

  if (comp.badge) {
    lines.push(`  badge="${escapeString(comp.badge)}"`);
  }

  lines.push(
    `  entries={[`,
    ...entriesArr.map((e) => `    ${e},`),
    `  ]}`,
    `  theme={theme}`,
    `/>`
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Viz — dispatched by vizType
// ---------------------------------------------------------------------------

function buildViz(comp: VizComponent): string {
  const componentName = resolveVizComponent(comp.vizType);
  const propsEntries = Object.entries(comp.props)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `  ${k}={${serializeValue(v as never)}}`)
    .join("\n");

  const lines: string[] = [
    `<${componentName}`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  reveal="${comp.reveal}"`,
  ];

  if (propsEntries) {
    lines.push(propsEntries);
  }

  lines.push(`  theme={theme}`);
  lines.push(`/>`);

  return lines.join("\n");
}

function resolveVizComponent(vizType?: string): string {
  switch (vizType) {
    case "node-graph":       return "NodeGraph";
    case "flow-diagram":     return "FlowDiagram";
    case "boundary-sim":     return "BoundarySim";
    case "workspace":        return "WorkspaceDiagram";
    case "protocol-compare": return "ProtocolCompare";
    default:                 return "NodeGraph";
  }
}

// ---------------------------------------------------------------------------
// Byline
// ---------------------------------------------------------------------------

function buildByline(comp: BylineComponent): string {
  return [
    `<Byline`,
    `  text="${escapeString(comp.text)}"`,
    `  position="${comp.position}"`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// CodeReveal
// ---------------------------------------------------------------------------

function buildCodeReveal(comp: CodeRevealComponent): string {
  const lines: string[] = [
    `<CodeReveal`,
    `  code={"${escapeString(comp.code)}"}`,
  ];
  if (comp.language) lines.push(`  language="${escapeString(comp.language)}"`);
  if (comp.title) lines.push(`  title="${escapeString(comp.title)}"`);
  if (comp.highlightLines && comp.highlightLines.length > 0) {
    lines.push(`  highlightLines={[${comp.highlightLines.join(", ")}]}`);
  }
  lines.push(
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// AnimatedChart
// ---------------------------------------------------------------------------

function buildChart(comp: ChartComponent): string {
  const dataArr = comp.data.map((d) => {
    const parts = [`label: "${escapeString(d.label)}"`, `value: ${d.value}`];
    if (d.color) parts.push(`color: "${escapeString(d.color)}"`);
    return `{ ${parts.join(", ")} }`;
  });

  const lines: string[] = [
    `<AnimatedChart`,
    `  type="${escapeString(comp.chartType)}"`,
  ];
  if (comp.title) lines.push(`  title="${escapeString(comp.title)}"`);
  lines.push(
    `  data={[`,
    ...dataArr.map((d) => `    ${d},`),
    `  ]}`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// TerminalReplay
// ---------------------------------------------------------------------------

function buildTerminal(comp: TerminalComponent): string {
  const linesArr = comp.lines.map(
    (l) => `{ text: "${escapeString(l.text)}", isCommand: ${l.isCommand} }`
  );

  const lines: string[] = [`<TerminalReplay`];
  if (comp.title) lines.push(`  title="${escapeString(comp.title)}"`);
  lines.push(
    `  lines={[`,
    ...linesArr.map((l) => `    ${l},`),
    `  ]}`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

function buildTimeline(comp: TimelineComponent): string {
  const eventsArr = comp.events.map((e) => {
    const parts = [`label: "${escapeString(e.label)}"`];
    if (e.description) parts.push(`description: "${escapeString(e.description)}"`);
    if (e.color) parts.push(`color: "${escapeString(e.color)}"`);
    return `{ ${parts.join(", ")} }`;
  });

  const lines: string[] = [`<Timeline`];
  if (comp.direction) lines.push(`  direction="${comp.direction}"`);
  lines.push(
    `  events={[`,
    ...eventsArr.map((e) => `    ${e},`),
    `  ]}`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------

function buildProgress(comp: ProgressComponent): string {
  const barsArr = comp.bars.map((b) => {
    const parts = [`label: "${escapeString(b.label)}"`, `value: ${b.value}`];
    if (b.color) parts.push(`color: "${escapeString(b.color)}"`);
    return `{ ${parts.join(", ")} }`;
  });

  return [
    `<ProgressBar`,
    `  bars={[`,
    ...barsArr.map((b) => `    ${b},`),
    `  ]}`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// CountUp
// ---------------------------------------------------------------------------

function buildCountUp(comp: CountUpComponent): string {
  const lines: string[] = [
    `<CountUp`,
    `  value={${comp.value}}`,
  ];
  if (comp.prefix) lines.push(`  prefix="${escapeString(comp.prefix)}"`);
  if (comp.suffix) lines.push(`  suffix="${escapeString(comp.suffix)}"`);
  if (comp.label) lines.push(`  label="${escapeString(comp.label)}"`);
  lines.push(
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// SplitScreen
// ---------------------------------------------------------------------------

function buildSplitScreen(comp: SplitScreenComponent): string {
  const lines: string[] = [
    `<SplitScreen`,
    `  left={{ title: "${escapeString(comp.left.title)}", content: "${escapeString(comp.left.content)}" }}`,
    `  right={{ title: "${escapeString(comp.right.title)}", content: "${escapeString(comp.right.content)}" }}`,
  ];
  if (comp.animation) lines.push(`  animation="${escapeString(comp.animation)}"`);
  if (comp.divider) lines.push(`  divider="${escapeString(comp.divider)}"`);
  lines.push(
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// IconGrid
// ---------------------------------------------------------------------------

function buildIconGrid(comp: IconGridComponent): string {
  const itemsArr = comp.items.map((item) => {
    const parts = [`icon: "${escapeString(item.icon)}"`, `label: "${escapeString(item.label)}"`];
    if (item.description) parts.push(`description: "${escapeString(item.description)}"`);
    return `{ ${parts.join(", ")} }`;
  });

  return [
    `<IconGrid`,
    `  columns={${comp.columns}}`,
    `  items={[`,
    ...itemsArr.map((i) => `    ${i},`),
    `  ]}`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// ParticleField
// ---------------------------------------------------------------------------

function buildParticles(comp: ParticlesComponent): string {
  const lines: string[] = [`<ParticleField`];
  if (comp.count !== undefined) lines.push(`  count={${comp.count}}`);
  if (comp.pattern) lines.push(`  pattern="${escapeString(comp.pattern)}"`);
  if (comp.opacity !== undefined) lines.push(`  opacity={${comp.opacity}}`);
  lines.push(
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// GlowOrb
// ---------------------------------------------------------------------------

function buildGlow(comp: GlowComponent): string {
  const lines: string[] = [`<GlowOrb`];
  if (comp.x !== undefined) lines.push(`  x={${comp.x}}`);
  if (comp.y !== undefined) lines.push(`  y={${comp.y}}`);
  if (comp.size !== undefined) lines.push(`  size={${comp.size}}`);
  if (comp.color) lines.push(`  color="${escapeString(comp.color)}"`);
  lines.push(
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// QuoteBlock
// ---------------------------------------------------------------------------

function buildQuote(comp: QuoteComponent): string {
  const lines: string[] = [
    `<QuoteBlock`,
    `  quote="${escapeString(comp.text)}"`,
  ];
  if (comp.author) lines.push(`  author="${escapeString(comp.author)}"`);
  if (comp.style) lines.push(`  style="${escapeString(comp.style)}"`);
  lines.push(
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// ArchitectureDiagram
// ---------------------------------------------------------------------------

function buildArchitecture(comp: ArchitectureComponent): string {
  const layersArr = comp.layers.map((layer) => {
    const itemsStr = layer.items.map((item) => `"${escapeString(item)}"`).join(", ");
    return `{ label: "${escapeString(layer.label)}", items: [${itemsStr}] }`;
  });

  const lines: string[] = [`<ArchitectureDiagram`];
  if (comp.title) lines.push(`  title="${escapeString(comp.title)}"`);
  lines.push(
    `  layers={[`,
    ...layersArr.map((l) => `    ${l},`),
    `  ]}`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// ZoomReveal
// ---------------------------------------------------------------------------

function buildZoomReveal(comp: ZoomRevealComponent): string {
  const itemsArr = comp.items.map((item) => {
    const parts = [`text: "${escapeString(item.text)}"`];
    if (item.detail) parts.push(`detail: "${escapeString(item.detail)}"`);
    return `{ ${parts.join(", ")} }`;
  });

  const lines: string[] = [`<ZoomReveal`];
  if (comp.style) lines.push(`  style="${escapeString(comp.style)}"`);
  lines.push(
    `  items={[`,
    ...itemsArr.map((i) => `    ${i},`),
    `  ]}`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// MorphTransition
// ---------------------------------------------------------------------------

function buildMorph(comp: MorphComponent): string {
  const fromParts = [`text: "${escapeString(comp.from.text)}"`];
  if (comp.from.subtitle) fromParts.push(`subtitle: "${escapeString(comp.from.subtitle)}"`);

  const toParts = [`text: "${escapeString(comp.to.text)}"`];
  if (comp.to.subtitle) toParts.push(`subtitle: "${escapeString(comp.to.subtitle)}"`);

  const lines: string[] = [
    `<MorphTransition`,
    `  from={{ ${fromParts.join(", ")} }}`,
    `  to={{ ${toParts.join(", ")} }}`,
  ];
  if (comp.style) lines.push(`  style="${escapeString(comp.style)}"`);
  lines.push(
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// KineticText
// ---------------------------------------------------------------------------

function buildKineticText(comp: KineticTextComponent): string {
  const lines: string[] = [
    `<KineticText`,
    `  text="${escapeString(comp.text)}"`,
  ];
  if (comp.style) lines.push(`  style="${escapeString(comp.style)}"`);
  lines.push(
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CodeDiff
// ---------------------------------------------------------------------------

function buildCodeDiff(comp: CodeDiffComponent): string {
  const lines: string[] = [
    `<CodeDiff`,
    `  before={"${escapeString(comp.before)}"}`,
    `  after={"${escapeString(comp.after)}"}`,
  ];
  if (comp.language) lines.push(`  language="${escapeString(comp.language)}"`);
  if (comp.title) lines.push(`  title="${escapeString(comp.title)}"`);
  lines.push(
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// FileTreeWalk
// ---------------------------------------------------------------------------

function serializeFileTree(nodes: import("../parser/types").FileTreeNode[]): string {
  const items = nodes.map((node) => {
    const parts = [
      `name: "${escapeString(node.name)}"`,
      `type: "${node.type}"`,
    ];
    if (node.children && node.children.length > 0) {
      parts.push(`children: ${serializeFileTree(node.children)}`);
    }
    return `{ ${parts.join(", ")} }`;
  });
  return `[${items.join(", ")}]`;
}

function buildFileTreeWalk(comp: FileTreeWalkComponent): string {
  const lines: string[] = [
    `<FileTreeWalk`,
    `  tree={${serializeFileTree(comp.tree)}}`,
  ];
  if (comp.highlight && comp.highlight.length > 0) {
    lines.push(`  highlight={[${comp.highlight.map((h) => `"${escapeString(h)}"`).join(", ")}]}`);
  }
  lines.push(
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// TypingCode
// ---------------------------------------------------------------------------

function buildTypingCode(comp: TypingCodeComponent): string {
  const lines: string[] = [
    `<TypingCode`,
    `  code={"${escapeString(comp.code)}"}`,
  ];
  if (comp.language) lines.push(`  language="${escapeString(comp.language)}"`);
  if (comp.speed !== undefined) lines.push(`  speed={${comp.speed}}`);
  lines.push(
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// AnimatedCounter
// ---------------------------------------------------------------------------

function buildAnimatedCounter(comp: AnimatedCounterComponent): string {
  const statsArr = comp.stats.map((s) => {
    const parts = [`label: "${escapeString(s.label)}"`, `value: ${s.value}`];
    if (s.suffix) parts.push(`suffix: "${escapeString(s.suffix)}"`);
    if (s.prefix) parts.push(`prefix: "${escapeString(s.prefix)}"`);
    return `{ ${parts.join(", ")} }`;
  });

  return [
    `<AnimatedCounter`,
    `  stats={[`,
    ...statsArr.map((s) => `    ${s},`),
    `  ]}`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// ComparisonSlider
// ---------------------------------------------------------------------------

function buildComparisonSlider(comp: ComparisonSliderComponent): string {
  const lines: string[] = [
    `<ComparisonSlider`,
    `  before="${escapeString(comp.before)}"`,
    `  after="${escapeString(comp.after)}"`,
  ];
  if (comp.initialPosition !== undefined) lines.push(`  initialPosition={${comp.initialPosition}}`);
  lines.push(
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// SceneStack
// ---------------------------------------------------------------------------

function buildSceneStack(comp: SceneStackComponent): string {
  const layersArr = comp.layers.map((layer) => {
    const parts = [
      `label: "${escapeString(layer.label)}"`,
      `content: "${escapeString(layer.content)}"`,
    ];
    if (layer.depth !== undefined) parts.push(`depth: ${layer.depth}`);
    return `{ ${parts.join(", ")} }`;
  });

  return [
    `<SceneStack`,
    `  layers={[`,
    ...layersArr.map((l) => `    ${l},`),
    `  ]}`,
    `  timing={${serializeValue(comp.timing as unknown as Record<string, unknown>)}}`,
    `  theme={theme}`,
    `/>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Remotion root (registerRoot + Composition)
// ---------------------------------------------------------------------------

function buildRoot(spec: VDSLSpec, componentName: string): string {
  const totalFrames = spec.scenes.reduce(
    (sum, scene) => sum + Math.round(scene.duration * 30),
    0
  );
  const width = spec.canvas?.width ?? 1920;
  const height = spec.canvas?.height ?? 1080;

  return [
    `const Root = () => (`,
    `  <Composition`,
    `    id="${componentName}"`,
    `    component={${componentName}}`,
    `    durationInFrames={${totalFrames}}`,
    `    fps={30}`,
    `    width={${width}}`,
    `    height={${height}}`,
    `  />`,
    `);`,
    ``,
    `registerRoot(Root);`,
  ].join("\n");
}
