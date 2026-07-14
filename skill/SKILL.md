---
name: vdsl
description: Generate explainer videos from compact VDSL specs. Use when the user wants to create a video, animation, or motion graphic for documentation, courses, or presentations.
---

# VDSL — Video Description Language

Use this skill to generate explainer videos from documentation or content. VDSL is a compact format (~100 lines) that compiles to professional MP4s.

## When to use

- User wants a video about a concept, feature, or process
- User wants to add video to documentation
- User wants an animated explainer for a course
- User says "make a video about...", "animate this", "create a video for..."

## How to use

1. Read the content the user wants to visualize
2. Write a `.vdsl` file describing the video
3. Save it and run `npx vdsl render <file>.vdsl -o output.mp4`

## VDSL Format

```
VDSL/1
theme dark-tech          # or cobalt-grid, warm-editorial
canvas 1920x1080

scene "<title>" <duration>s <transition>
  <component> <args> <timing>
```

## Available Components

### Text
- `text "<content>" <font> <position> <reveal> <timing>` — font: display|body|mono|hero, reveal: fade|word-stagger|typewriter
- `text-cycle <font>` + indented phrases — hard-cut cycling text
- `label "<text>" <position> <timing>` — small uppercase label
- `quote "<text>" <timing>` — editorial quote with quotation marks
- `code-reveal "<code>" <language> <timing>` — syntax-highlighted code

### Data
- `chart bar|line "<title>" <timing>` + data lines — animated chart
- `progress <timing>` + bar lines — progress bars
- `count-up <number> <timing>` — animated counter with ring

### Diagrams
- `architecture <timing>` + layer lines — tech stack diagram
- `timeline <timing>` + event lines — event timeline
- `split-screen <timing> <animation>` — before/after comparison
- `comparison <timing>` — side-by-side cards

### Visualizations (viz block)
```
viz <timing> <reveal>
  type: node-graph|flow-diagram|boundary-sim|workspace|protocol-compare
  <structured data>
```

### Ambient
- `particles <timing>` — floating particle background
- `glow <timing>` — soft light orb

## Transitions
cut | crossfade | blur-crossfade | push-right | push-left

## Themes
- `cobalt-grid` — cream paper + cobalt ink + serif
- `dark-tech` — dark + cyan accent + sans-serif
- `warm-editorial` — ivory + warm ink + serif

## Example

```
VDSL/1
theme dark-tech
canvas 1920x1080

scene "Intro" 4s cut
  particles 0-4s
  text "My Feature" hero center word-stagger 0-3s
  label "documentation video" center 1.5s

scene "How it works" 6s crossfade
  architecture 0-6s
    title: "Pipeline"
    layer "Input" "markdown" "images"
    layer "Process" "parser" "compiler"
    layer "Output" "video" "pdf"

scene "Results" 5s crossfade
  chart bar "Performance" 0-5s
    data: "Before" 100, "After" 15

scene "Close" 3s crossfade
  quote "Ship faster with less code." 0-3s
  byline "github.com/myproject" bottom-right 1.5s
```

## Tips

- Keep scenes 3-8s each
- Use particles + glow in intro scenes for visual interest
- code-reveal for showing code, terminal for CLI
- chart for metrics, count-up for single numbers
- split-screen for before/after
- architecture for tech stacks
- ~30 lines = ~15s video. Scale proportionally.
