# VDSL — Video Description Language

**Describe videos in ~100 lines. Render professional MP4s.**

VDSL is a compact, declarative language for describing explainer videos. You write *what* to show. The renderer decides *how* to animate it — with rich SVG diagrams, smooth transitions, and professional typography.

```
VDSL/1
theme dark-tech
canvas 1920x1080

scene "The Problem" 6s crossfade
  text "Your data has no walls." hero center word-stagger 0-4s
  label "only suggestions" center 2.5s

scene "The Solution" 8s blur-crossfade
  viz 0.5-8s build-up
    type: flow-diagram
    steps:
      - label: "Label" desc: "tag your data" icon: 1 color: blue
      - label: "Check" desc: "verify at the gate" icon: 2 color: green
      - label: "Record" desc: "trace every crossing" icon: 3 color: amber
    connectors: arrow
```

**~95% fewer tokens than writing React/HTML directly.** Same visual quality.

## Why VDSL

| | Direct Remotion | Direct HTML | VDSL |
|---|---|---|---|
| Lines for a 74s video | ~450 | ~2,200 | **~100** |
| Tokens (est.) | ~1,800 | ~8,000 | **~400** |
| Visual quality | Manual | Manual | **Built-in** |
| Agent-friendly | No | No | **Yes** |
| Reusable components | DIY | No | **12 rich components** |
| Theming | Manual | Manual | **1 line** |

## Pipeline

```
video.vdsl          (you write this — ~100 lines)
    ↓ vdsl compile
compiled JSX         (auto-generated Remotion component)
    ↓ vdsl render
video.mp4            (final output)
```

## Quick Start

```bash
# Clone and build
git clone https://github.com/JoseEstevez520/vdsl
cd vdsl
npm install && npm run build

# Install render project dependencies
cd render && npm install && cd ..

# Create a video from the example
npx vdsl render examples/communication.vdsl -o communication.mp4

# Or create your own
npx vdsl init my-video
npx vdsl render my-video.vdsl -o my-video.mp4

# Preview in Remotion Studio (interactive)
npx vdsl preview my-video.vdsl
```

## The Two Levels

VDSL uses a hybrid approach inspired by [Generative UI research](https://github.com/ANFAIA/SkillNet):

**Level 2 (Predefined) — 80% of the video.** Text reveals, transitions, layouts, themes. Quality is guaranteed by the renderer. Zero design decisions needed.

**Level 3 (Generative) — 20% of the video.** The `viz` block lets you describe custom diagrams, charts, and visualizations with structured data. The renderer has built-in support for common viz types and an escape hatch for custom SVG.

```
// Level 2: predefined animation, always looks good
text "Hello World" hero center word-stagger 0-3s

// Level 3: structured data → rich animated diagram  
viz 2-8s build-up
  type: node-graph
  nodes:
    - id: a label: "Agent A" x: 30 y: 50 color: blue
    - id: b label: "Agent B" x: 70 y: 50 color: green
  edges:
    - from: a to: b style: dashed animate: draw
```

## Components

### Text (Level 2)

| Component | What it does |
|---|---|
| `text` | Text with reveal animation (fade, word-stagger, typewriter, slide-up) |
| `text-cycle` | Phrases that hard-cut between each other with accents |
| `label` | Small positioned label/tag |
| `code` | Monospace code with typewriter effect |
| `byline` | Credit/attribution |

### Structure (Level 2)

| Component | What it does |
|---|---|
| `triptych` | Three items in a row with stagger reveal |
| `step-sequence` | Numbered steps that cycle (1. TITLE / description) |
| `comparison` | Side-by-side cards with split-tilt 3D entry |
| `card` | Centered card with formula/content |

### Visualizations (Level 3 — `viz` block)

| Type | What it renders |
|---|---|
| `node-graph` | SVG node-edge diagram with animated reveal |
| `flow-diagram` | Connected steps with arrow paths |
| `boundary-sim` | Data packets flowing through PASS/BLOCK gates |
| `workspace` | Shared/private zones with labels |
| `protocol-compare` | Protocol comparison table with badges |
| `trace-log` | Terminal-style log entries accumulating |
| `custom` | Raw SVG with `data-animate` hints |

## Themes

Three built-in themes. Add your own as a JSON file.

| Theme | Style |
|---|---|
| `cobalt-grid` | Warm cream paper, electric cobalt ink, graph-paper grid, Newsreader serif |
| `dark-tech` | Near-black background, cyan accent, Inter sans-serif |
| `warm-editorial` | Ivory background, warm dark ink, Playfair Display serif |

```
VDSL/1
theme dark-tech      ← one line changes the entire look
```

### Custom themes

```json
{
  "name": "my-brand",
  "colors": {
    "bg": "#ffffff",
    "bg2": "#f5f5f5",
    "ink": "#1a1a2e",
    "inkSoft": "#4a4a6a",
    "inkFaint": "rgba(26,26,46,0.15)",
    "grid": "rgba(26,26,46,0.05)",
    "green": "#059669",
    "red": "#dc2626",
    "amber": "#F59E0B",
    "purple": "#8B5CF6"
  },
  "fonts": {
    "display": "'Plus Jakarta Sans', sans-serif",
    "body": "'Inter', sans-serif",
    "mono": "'Fira Code', monospace"
  },
  "grid": false
}
```

## CLI

```bash
# Compile VDSL to a Remotion composition
npx vdsl compile video.vdsl -o composition.jsx

# Compile and render to MP4
npx vdsl render video.vdsl -o output.mp4

# Render with a different theme
npx vdsl render video.vdsl -o output.mp4 --theme dark-tech

# List available themes
npx vdsl themes

# Create a new VDSL file from template
npx vdsl init my-explainer
```

## VDSL Format Reference

See [docs/spec.md](docs/spec.md) for the complete format specification.

### Timing syntax

```
0-5s        → starts at 0s, ends at 5s
3.2s        → appears at 3.2s
0.5-9s      → starts at 0.5s, ends at 9s
```

### Scene transitions

`cut` | `crossfade` | `blur-crossfade` | `push-right` | `push-left` | `push-up` | `zoom-through`

### Text reveals

`fade` | `word-stagger` | `typewriter` | `slide-up` | `scale-in` | `none`

### Text accents

`underline` | `strike` | `hero` | `dim` | `glow`

## Architecture

```
video.vdsl          (you write this — ~100 lines, ~400 tokens)
    ↓ parser
JSON spec           (intermediate representation)
    ↓ compiler
Remotion JSX        (generated — ~500 lines)
    ↓ remotion render
video.mp4           (professional output)
```

The parser and compiler are deterministic — no LLM involved. All the visual quality comes from the **12 built-in Remotion components** that handle animation, layout, and theming.

## For AI Agents

VDSL is designed to be generated by AI agents. An agent reads documentation/content and produces a `.vdsl` file using ~400 tokens. Compare:

| What the agent writes | Tokens |
|---|---|
| Full Remotion JSX | ~1,800 |
| Full HTML + GSAP | ~8,000 |
| **VDSL spec** | **~400** |

The agent describes *what* to show. The renderer handles the *how*.

## Extensibility

VDSL is designed to be customized per project:

- **Themes**: Add a JSON file → new visual identity
- **Viz types**: Register new `viz` handlers in the component registry
- **Fonts**: Reference any Google Font in your theme config

## License

MIT

## Credits

Built on [Remotion](https://remotion.dev). Inspired by [UIDL](https://github.com/JoseEstevez520/uidl) — the same philosophy applied to video.
