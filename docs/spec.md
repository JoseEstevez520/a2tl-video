# VDSL/1 — Video Description Language

Formato compacto para que una IA describa vídeos explicativos gastando ~95% menos tokens que generando Remotion/HTML directo.

## Filosofía

Misma que UIDL: la IA dice **QUÉ** mostrar. El renderer decide **CÓMO** animarlo.

Nivel 2 para el 80% (primitivos predefinidos con calidad garantizada).
Nivel 3 para el 20% (bloque `viz` donde el agente genera SVG/JSX custom para visualizaciones únicas).

## Estructura

```
VDSL/1
theme <nombre>
canvas <ancho>x<alto>

scene "<título>" <duración> <transición>
  <componente> <contenido> <animación> <timing>
```

## Componentes Level 2 (predefinidos, calidad garantizada)

### Texto
```
text "<contenido>" <font> <posición> <reveal> <timing>
```
- font: display | display-italic | body | mono | hero
- posición: center | upper-left | upper-right | bottom-center
- reveal: fade | word-stagger | typewriter | slide-up | none
- timing: <inicio>-<fin> en segundos, o <inicio> (fade in a partir de)

### Texto cíclico (hard-cut entre frases)
```
text-cycle <posición> <font>
  "<frase 1>" <timing> [accent]
  "<frase 2>" <timing> [accent]
```
- accent: underline | strike | hero | dim | glow

### Etiqueta
```
label "<texto>" <posición> <timing>
```

### Triptych (tres elementos en línea)
```
triptych <timing> <reveal>
  "<elemento 1>"
  "<elemento 2>"
  "<elemento 3>"
```
- reveal: stagger | simultaneous

### Secuencia de pasos
```
step-sequence <timing>
  "<número>. <TÍTULO>" "<descripción>"
  ...
```

### Comparación lado a lado
```
comparison <timing> <animación>
  left "<título>" "<subtítulo>" badge "<texto>" <color>
  right "<título>" "<subtítulo>" badge "<texto>" <color>
```
- animación: split-tilt | slide-in | fade

### Tarjeta centrada
```
card <posición> <reveal> <timing>
  formula "<A>" "<op>" "<B>"
  arrow
  result "<resultado>" <font>
  subtitle "<texto>"
```

### Código
```
code "<contenido>" <reveal> <timing>
  [shrink <factor> move-top <timing>]
```

### Bloque de log
```
trace-log <timing> <reveal>
  "<col1>" "<col2>" "<col3>"
  ...
```

### Crédito
```
byline "<texto>" <posición> <timing>
```

## Componente Level 3: `viz` (visualización custom)

Para diagramas y gráficas que no caben en los primitivos:

```
viz <timing> <reveal>
  type: <node-graph | flow-diagram | venn | boundary-sim | custom>
  """
  <SVG o descripción estructurada>
  """
```

El agente genera el contenido SVG/estructurado. El renderer:
1. Lo envuelve en un contenedor con el tema activo
2. Aplica la animación de entrada (reveal)
3. Si es un tipo conocido (node-graph, flow-diagram), aplica animaciones internas predefinidas
4. Si es custom, anima las partes marcadas con `data-animate="<tipo>"`

### Tipos de viz predefinidos

**node-graph**: Nodos y conexiones animados
```
viz 0-9s fade
  type: node-graph
  nodes:
    - id: jose label: "Jose" access: [A,B] x: 60 y: 40
    - id: pepito label: "Pepito" access: [A] x: 200 y: 40
  edges:
    - from: jose to: A color: blue
    - from: pepito to: A color: blue
  compartments:
    - id: A x: 130 y: 150 color: blue
    - id: B x: 200 y: 150 color: amber
```

**flow-diagram**: Flujo con pasos conectados
```
viz 0-9s stagger
  type: flow-diagram
  steps:
    - label: "Arranque" desc: "read-in" icon: 1 color: blue
    - label: "Trabajo" desc: "procesa" icon: 2 color: purple
    - label: "Frontera" desc: "verifica" icon: 3 color: amber
  connectors: arrow
```

**boundary-sim**: Simulación de frontera PASS/BLOCK
```
viz 0-8s animate-flow
  type: boundary-sim
  packet: "Dato A" label: A
  gate: "∈" check: inclusion
  recipient: "Jose" access: [A,B]
  result: pass
```

**workspace**: Diagrama de espacio compartido
```
viz 0-9s build-up
  type: workspace
  shared: "COMPARTIDO"
  zones:
    - side: left label: "PRIVADO A" tag: "etiqueta: A"
    - side: right label: "PRIVADO B" tag: "etiqueta: B"
```

**custom**: SVG directo (Level 3 puro)
```
viz 0-5s fade
  type: custom
  """
  <svg viewBox="0 0 800 400">
    <circle cx="400" cy="200" r="80" data-animate="scale-in" />
    <text x="400" y="210" data-animate="fade" data-delay="0.5">Custom</text>
  </svg>
  """
```

## Animaciones predefinidas

### Reveals (entrada de elementos)
fade | word-stagger | typewriter | slide-up | slide-left | scale-in | split-tilt | stagger | build-up | none

### Transiciones entre escenas
cut | crossfade | blur-crossfade | push-right | push-left | push-up | zoom-through

### Accents (énfasis en texto)
underline | strike | hero | dim | glow

## Temas predefinidos

Cada tema define: paleta, tipografía, fondo, hairlines, componentes base.

- cobalt-grid: papel crema, tinta cobalto, cuadrícula, Newsreader + Hanken Grotesk + DM Mono
- dark-tech: fondo oscuro, acento cyan, Inter + JetBrains Mono
- warm-editorial: fondo marfil, serif clásica, EB Garamond + Inter
- (extensible: tema = archivo JSON con tokens)

## Medición estimada

| Formato | Tokens | Ratio | Ahorro |
|---------|--------|-------|--------|
| HyperFrames (9 HTML) | ~8,000 | 100% | — |
| Remotion JSX directo | ~1,800 | 22% | 78% |
| **VDSL (Level 2 puro)** | **~200** | **2.5%** | **97%** |
| **VDSL (Level 2 + viz)** | **~400** | **5%** | **95%** |

## Pipeline

```
contenido.md → (agente, ~400 tokens) → video.vdsl → (parser) → JSON → (renderer Remotion) → MP4
```
