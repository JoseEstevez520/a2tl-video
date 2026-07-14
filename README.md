# VDSL — Video Description Language

**Describe videos in ~100 lines. Render professional MP4s.**

VDSL is a compact, declarative language for describing explainer videos. You write *what* to show — the renderer handles animation, layout, and theming with 38 built-in components.

```
VDSL/1
theme dark-tech
canvas 1920x1080

scene "The Problem" 6s crossfade
  text "Your data has no walls." hero center word-stagger 0-4s
  label "only suggestions" center 2.5s

scene "The Solution" 8s blur-crossfade
  architecture 0-8s
    title: "VDSL Pipeline"
    layer "Input" ".vdsl file"
    layer "Compiler" "Parser" "Code Generator"
    layer "Renderer" "Remotion" "Chrome" "FFmpeg"
```

## Why VDSL

| | Remotion (React) | Raw HTML | **VDSL** |
|---|---|---|---|
| Lines for a 74s video | ~450 | ~2,200 | **~100** |
| Tokens (AI cost) | ~1,800 | ~8,000 | **~400** |
| Visual quality | Manual | Manual | **38 components** |
| Theming | DIY | DIY | **1 line** |
| Agent-friendly | No | No | **Yes** |

## Quick Start

```bash
npm install vdsl remotion @remotion/cli react react-dom

npx vdsl init my-video        # create a .vdsl file
npx vdsl render my-video.vdsl  # render to MP4
```

## Component Catalog (38 components)

### Layout (4)

| Component | VDSL syntax | What it does |
|---|---|---|
| **GridCanvas** | *(automatic per scene)* | Background grid + hairlines + vignette |
| **SplitScreen** | `split-screen 0-6s slide-in` | Side-by-side panels with animated reveal |
| **IconGrid** | `icon-grid 3 0-6s` | Grid of items with icons/emoji |
| **SceneStack** | `scene-stack 0-8s` | Vertically stacked content blocks |

### Text (10)

| Component | VDSL syntax | What it does |
|---|---|---|
| **WordReveal** | `text "Hello" display center word-stagger 0-3s` | Words fade in one by one |
| **TextCycle** | `text-cycle center display` | Phrases hard-cut between each other |
| **TypewriterText** | `text "Hello" mono center typewriter 0-3s` | Character-by-character with cursor |
| **FadeText** | `text "Hello" display center fade 0-3s` | Smooth fade in + slide up |
| **Label** | `label "subtitle" center 1.5s` | Small uppercase positioned label |
| **Triptych** | `triptych 0-5s stagger` | Three items in a row with stagger |
| **StepSequence** | `step-sequence 0-8s` | Numbered steps that cycle |
| **Byline** | `byline "credit" bottom-right 4s` | Attribution text |
| **QuoteBlock** | `quote "text" 0-5s` | Editorial quote with large quotation mark |
| **KineticText** | `kinetic-text "VDSL" 0-4s` | Dynamic text with motion effects |

### Diagrams (10)

| Component | VDSL syntax | What it does |
|---|---|---|
| **NodeGraph** | `viz type: node-graph` | SVG nodes + edges with draw-on animation |
| **FlowDiagram** | `viz type: flow-diagram` | Connected steps with arrow paths |
| **BoundarySim** | `viz type: boundary-sim` | Animated PASS/BLOCK gate simulation |
| **WorkspaceDiagram** | `viz type: workspace` | Shared/private zones with labels |
| **Comparison** | `comparison 0-6s split-tilt` | Side-by-side cards with 3D tilt |
| **ComparisonSlider** | `comparison-slider 0-6s` | Before/after with sliding divider |
| **Timeline** | `timeline 0-6s horizontal` | Events on a timeline with stagger |
| **MorphTransition** | `morph 0-6s` | Smooth state transformation |
| **ArchitectureDiagram** | `architecture 0-7s` | Layered stack diagram |
| **ZoomReveal** | `zoom-reveal 0-8s` | Items revealed by zooming through |

### Code (5)

| Component | VDSL syntax | What it does |
|---|---|---|
| **CodeReveal** | `code-reveal "..." javascript 0-7s` | Syntax-highlighted code with line reveal |
| **TerminalReplay** | `terminal 0-6s` | Terminal with typed commands + output |
| **FileTreeWalk** | `file-tree 0-5s` | Animated file/folder tree |
| **CodeDiff** | `code-diff 0-6s` | Before/after code with red/green diff |
| **TypingCode** | `typing-code "..." 0-5s` | Code typing with cursor |

### Data (7)

| Component | VDSL syntax | What it does |
|---|---|---|
| **AnimatedChart** | `chart bar "Title" 0-6s` | Bar/line charts with spring animation |
| **ProgressBar** | `progress 0-5s` | Horizontal progress bars with values |
| **CountUp** | `count-up 1234 0-5s` | Animated counter with ring progress |
| **TraceLog** | `trace-log 0-8s` | Terminal-style accumulating log |
| **ProtocolCompare** | `viz type: protocol-compare` | Protocol comparison with badges |
| **FormulaCard** | `card center scale-in 0-5s` | Formula with animated assembly |
| **AnimatedCounter** | `animated-counter 0-4s` | Number ticker animation |

### Ambient (2)

| Component | VDSL syntax | What it does |
|---|---|---|
| **ParticleField** | `particles 0-5s` | Floating particles background |
| **GlowOrb** | `glow 0-5s` | Soft pulsing light orb |

## Themes

```
VDSL/1
theme cobalt-grid    # warm cream + cobalt ink + graph paper
theme dark-tech      # dark background + cyan accent
theme warm-editorial # ivory + dark ink + Playfair Display serif
```

Add your own theme as a JSON file — colors, fonts, grid toggle.

## The Two Levels

Inspired by [Generative UI research](https://github.com/ANFAIA/SkillNet):

**Level 2 (80%)** — Predefined components with guaranteed quality. Text, charts, layouts, transitions. Zero design decisions.

**Level 3 (20%)** — The `viz` block for custom diagrams. Describe the data, the renderer animates it.

```
// Level 2: one line = professional animation
text "Hello World" hero center word-stagger 0-3s

// Level 3: data → rich animated diagram
viz 0-8s build-up
  type: flow-diagram
  steps:
    - label: "Parse" desc: "VDSL → JSON" icon: 1 color: blue
    - label: "Compile" desc: "JSON → React" icon: 2 color: green
    - label: "Render" desc: "React → MP4" icon: 3 color: amber
  connectors: arrow
```

## Architecture

```
video.vdsl          (~100 lines)
    ↓ parser        (tokenizer + AST)
JSON spec           (intermediate representation)
    ↓ compiler      (code generator)
Remotion JSX        (~500 lines, generated)
    ↓ remotion      (headless Chrome + FFmpeg)
video.mp4           (professional output)
```

## CLI

```bash
npx vdsl compile video.vdsl -o output.jsx   # compile only
npx vdsl render video.vdsl -o video.mp4      # compile + render
npx vdsl render video.vdsl --theme dark-tech # override theme
npx vdsl themes                              # list themes
npx vdsl init my-explainer                   # scaffold .vdsl
```

## Stats

- **38 components** across 7 categories
- **3 themes** (extensible via JSON)
- **~12,000 lines** of TypeScript
- **0 type errors**
- **0 runtime dependencies** (Remotion as peer dep)
- Pipeline: `.vdsl` → parse → compile → render → MP4

## License

MIT

## Credits

Built on [Remotion](https://remotion.dev). Inspired by [UIDL](https://github.com/JoseEstevez520/uidl).
