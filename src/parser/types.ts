/**
 * VDSL – Video Description Language
 * Type definitions for the parsed AST.
 */

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface Theme {
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

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** A half-open or closed timing window in seconds. */
export interface Timing {
  start: number;
  end?: number;
}

export type FontStyle = "display" | "display-italic" | "body" | "mono" | "hero";

export type Position =
  | "center"
  | "upper-left"
  | "upper-right"
  | "bottom-center";

export type RevealStyle =
  | "fade"
  | "word-stagger"
  | "typewriter"
  | "slide-up"
  | "scale-in"
  | "none";

export type AccentStyle = "underline" | "strike" | "hero" | "dim" | "glow";

export type Transition =
  | "cut"
  | "fade"
  | "slide"
  | "zoom"
  | "dissolve"
  | string;

export type ComparisonAnimation = "split-tilt" | "slide-in" | "fade" | string;

export type VizType =
  | "node-graph"
  | "flow-diagram"
  | "boundary-sim"
  | "workspace"
  | "protocol-compare"
  | "custom"
  | string;

// ---------------------------------------------------------------------------
// Components (discriminated union on `type`)
// ---------------------------------------------------------------------------

/** `text "…" <font> <position> <reveal> <timing>` */
export interface TextComponent {
  type: "text";
  content: string;
  font: FontStyle;
  position: Position;
  reveal: RevealStyle;
  timing: Timing;
}

/** A single phrase inside a `text-cycle` block. */
export interface TextCyclePhrase {
  text: string;
  timing: Timing;
  accent?: AccentStyle;
}

/** `text-cycle <position> <font>` with indented phrases */
export interface TextCycleComponent {
  type: "text-cycle";
  position: Position;
  font: FontStyle;
  phrases: TextCyclePhrase[];
}

/** `label "…" <position> <timing>` */
export interface LabelComponent {
  type: "label";
  text: string;
  position: Position;
  timing: Timing;
}

/** A single item inside a `triptych` block. */
export interface TriptychItem {
  /** Raw token list for the item line; structure varies by usage. */
  tokens: string[];
}

/** `triptych <timing> <reveal>` with indented items */
export interface TriptychComponent {
  type: "triptych";
  timing: Timing;
  reveal: RevealStyle;
  items: TriptychItem[];
}

/** A single step in a `step-sequence`. */
export interface StepSequenceItem {
  /** e.g. "1. TITLE" */
  label: string;
  description: string;
}

/** `step-sequence <timing>` with indented steps */
export interface StepSequenceComponent {
  type: "step-sequence";
  timing: Timing;
  steps: StepSequenceItem[];
}

/** One side of a `comparison` block. */
export interface ComparisonSide {
  side: "left" | "right";
  title: string;
  subtitle: string;
  badge?: { text: string; color: string };
}

/** `comparison <timing> <animation>` */
export interface ComparisonComponent {
  type: "comparison";
  timing: Timing;
  animation: ComparisonAnimation;
  sides: ComparisonSide[];
}

/** A child element inside a `card` block. */
export type CardChild =
  | { type: "formula"; content: string }
  | { type: "arrow"; direction?: string }
  | { type: "result"; content: string }
  | { type: "subtitle"; content: string };

/** `card <position> <reveal> <timing>` */
export interface CardComponent {
  type: "card";
  position: Position;
  reveal: RevealStyle;
  timing: Timing;
  children: CardChild[];
}

/** Optional shrink/move modifier for a `code` block. */
export interface CodeModifier {
  shrink: number;
  moveTop: Timing;
}

/** `code "…" <reveal> <timing>` */
export interface CodeComponent {
  type: "code";
  content: string;
  reveal: RevealStyle;
  timing: Timing;
  modifier?: CodeModifier;
}

/** A log entry inside a `trace-log` block. */
export interface TraceLogEntry {
  /** Raw tokens for the entry; varies by schema. */
  tokens: string[];
}

/** `trace-log <timing> <reveal>` */
export interface TraceLogComponent {
  type: "trace-log";
  timing: Timing;
  reveal: RevealStyle;
  columns?: string[];
  entries: TraceLogEntry[];
  badge?: string;
}

/**
 * `viz <timing> <reveal>` — Level-3 escape hatch.
 * Children are key-value pairs whose structure depends on the viz type.
 */
export interface VizComponent {
  type: "viz";
  timing: Timing;
  reveal: RevealStyle;
  vizType?: VizType;
  /** Arbitrary structured properties parsed from indented children. */
  props: Record<string, unknown>;
}

/** `byline "…" <position> <timing>` */
export interface BylineComponent {
  type: "byline";
  text: string;
  position: Position;
  timing: Timing;
}

// ---------------------------------------------------------------------------
// New component types
// ---------------------------------------------------------------------------

/** `code-reveal "…" <language> <timing>` */
export interface CodeRevealComponent {
  type: "code-reveal";
  code: string;
  language?: string;
  timing: Timing;
  title?: string;
  highlightLines?: number[];
}

/** `chart <chartType> "<title>" <timing>` */
export interface ChartComponent {
  type: "chart";
  chartType: "bar" | "line" | "horizontal-bar";
  title?: string;
  timing: Timing;
  data: { label: string; value: number; color?: string }[];
}

/** `terminal <timing>` */
export interface TerminalComponent {
  type: "terminal";
  timing: Timing;
  lines: { text: string; isCommand: boolean }[];
  title?: string;
}

/** `timeline <timing> <direction>` */
export interface TimelineComponent {
  type: "timeline";
  timing: Timing;
  direction?: "horizontal" | "vertical";
  events: { label: string; description?: string; color?: string }[];
}

/** `progress <timing>` */
export interface ProgressComponent {
  type: "progress";
  timing: Timing;
  bars: { label: string; value: number; color?: string }[];
}

/** `count-up <value> <timing>` */
export interface CountUpComponent {
  type: "count-up";
  value: number;
  timing: Timing;
  prefix?: string;
  suffix?: string;
  label?: string;
}

/** `split-screen <timing> <animation>` */
export interface SplitScreenComponent {
  type: "split-screen";
  timing: Timing;
  animation?: string;
  left: { title: string; content: string };
  right: { title: string; content: string };
  divider?: string;
}

/** `icon-grid <columns> <timing>` */
export interface IconGridComponent {
  type: "icon-grid";
  columns: number;
  timing: Timing;
  items: { icon: string; label: string; description?: string }[];
}

/** `particles <timing>` */
export interface ParticlesComponent {
  type: "particles";
  timing: Timing;
  count?: number;
  pattern?: string;
  opacity?: number;
}

/** `glow <timing>` */
export interface GlowComponent {
  type: "glow";
  timing: Timing;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
}

/** `quote "<text>" <timing>` */
export interface QuoteComponent {
  type: "quote";
  text: string;
  timing: Timing;
  author?: string;
  style?: string;
}

/** `architecture <timing>` */
export interface ArchitectureComponent {
  type: "architecture";
  timing: Timing;
  title?: string;
  layers: { label: string; items: string[] }[];
}

/** `zoom-reveal <timing>` */
export interface ZoomRevealComponent {
  type: "zoom-reveal";
  timing: Timing;
  items: { text: string; detail?: string }[];
  style?: string;
}

/** `morph <timing>` */
export interface MorphComponent {
  type: "morph";
  timing: Timing;
  from: { text: string; subtitle?: string };
  to: { text: string; subtitle?: string };
  style?: string;
}

/** `kinetic-text "<text>" <timing>` */
export interface KineticTextComponent {
  type: "kinetic-text";
  text: string;
  timing: Timing;
  style?: string;
}

/** `code-diff <timing>` */
export interface CodeDiffComponent {
  type: "code-diff";
  timing: Timing;
  language?: string;
  before: string;
  after: string;
  title?: string;
}

/** A node in a file tree */
export interface FileTreeNode {
  name: string;
  type: "file" | "dir";
  children?: FileTreeNode[];
}

/** `file-tree-walk <timing>` */
export interface FileTreeWalkComponent {
  type: "file-tree-walk";
  timing: Timing;
  tree: FileTreeNode[];
  highlight?: string[];
}

/** `typing-code <timing>` */
export interface TypingCodeComponent {
  type: "typing-code";
  timing: Timing;
  code: string;
  language?: string;
  speed?: number;
}

/** `animated-counter <timing>` */
export interface AnimatedCounterComponent {
  type: "animated-counter";
  timing: Timing;
  stats: { label: string; value: number; suffix?: string; prefix?: string }[];
}

/** `comparison-slider <timing>` */
export interface ComparisonSliderComponent {
  type: "comparison-slider";
  timing: Timing;
  before: string;
  after: string;
  initialPosition?: number;
}

/** `scene-stack <timing>` */
export interface SceneStackComponent {
  type: "scene-stack";
  timing: Timing;
  layers: { label: string; content: string; depth?: number }[];
}

export type Component =
  | TextComponent
  | TextCycleComponent
  | LabelComponent
  | TriptychComponent
  | StepSequenceComponent
  | ComparisonComponent
  | CardComponent
  | CodeComponent
  | TraceLogComponent
  | VizComponent
  | BylineComponent
  | CodeRevealComponent
  | ChartComponent
  | TerminalComponent
  | TimelineComponent
  | ProgressComponent
  | CountUpComponent
  | SplitScreenComponent
  | IconGridComponent
  | ParticlesComponent
  | GlowComponent
  | QuoteComponent
  | ArchitectureComponent
  | ZoomRevealComponent
  | MorphComponent
  | KineticTextComponent
  | CodeDiffComponent
  | FileTreeWalkComponent
  | TypingCodeComponent
  | AnimatedCounterComponent
  | ComparisonSliderComponent
  | SceneStackComponent;

// ---------------------------------------------------------------------------
// Top-level document
// ---------------------------------------------------------------------------

export interface Scene {
  title: string;
  duration: number;
  transition: Transition;
  components: Component[];
}

export interface VDSLSpec {
  version: number;
  theme: string;
  canvas: { width: number; height: number };
  scenes: Scene[];
}
