import React from 'react';
import { Sequence, AbsoluteFill, useCurrentFrame, useVideoConfig, registerRoot, Composition } from 'remotion';
import { BoundarySim, Byline, FadeText, FlowDiagram, GridCanvas, Label, NodeGraph, ProtocolCompare, TextCycle, TraceLog, Triptych, TypewriterText, WordReveal, WorkspaceDiagram } from 'vdsl/components';
import { themes } from 'vdsl/themes';

const theme = themes['cobalt-grid'];

export const Video = () => {
  return (
    <AbsoluteFill>
      {/* Scene 1: El repartidor */}
      <Sequence from={0} durationInFrames={150}>
        <GridCanvas theme={theme} timing={{ start: 0, end: 5 }}>
          <TypewriterText
            text="El agente de tu repartidor le pregunta a tu asistente —"
            font="body"
            position="upper-left"
            timing={{ start: 0, end: 1.8 }}
            theme={theme}
          />
          <WordReveal
            text="¿saldo bancario?"
            font="hero"
            position="center"
            reveal="word-stagger"
            timing={{ start: 1.8, end: 5 }}
            theme={theme}
          />
          <Label
            text="AGENTE → AGENTE"
            position="center"
            timing={{ start: 2.8 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 2: Normas blandas */}
      <Sequence from={150} durationInFrames={240}>
        <GridCanvas theme={theme} timing={{ start: 5, end: 13 }}>
          <TextCycle
            position="center"
            font="display"
            phrases={[
              { text: "instrucción de prompt", timing: { start: 0, end: 2 }, accent: "underline" },
              { text: "Una sugerencia — no un muro", timing: { start: 2, end: 4 }, accent: "strike" },
              { text: "Los protocolos resuelven identidad", timing: { start: 4, end: 6.5 }, accent: "dim" },
              { text: "normas blandas", timing: { start: 6.5, end: 8 }, accent: "hero" },
            ]}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 3: Tres pilares */}
      <Sequence from={390} durationInFrames={210}>
        <GridCanvas theme={theme} timing={{ start: 13, end: 20 }}>
          <WordReveal
            text="etiquetas sobre los datos"
            font="display"
            position="center"
            reveal="word-stagger"
            timing={{ start: 0, end: 2.5 }}
            theme={theme}
          />
          <Label
            text="VERIFICADAS EN LA PUERTA — NO DENTRO DEL AGENTE"
            position="center"
            timing={{ start: 0.8 }}
            theme={theme}
          />
          <FadeText
            text="Tres pilares:"
            font="display-italic"
            position="center"
            timing={{ start: 2.5, end: 3.5 }}
            theme={theme}
          />
          <Triptych
            timing={{ start: 3.5, end: 7 }}
            reveal="none"
            items={[
              { tokens: ["PROTOCOLO"] },
              { tokens: ["TRAZABILIDAD"] },
              { tokens: ["ESPACIO DE TRABAJO"] },
            ]}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 4: Protocolo */}
      <Sequence from={600} durationInFrames={330}>
        <GridCanvas theme={theme} timing={{ start: 20, end: 31 }}>
          <TypewriterText
            text="data.compartment ∈ recipient.allowed → PASS"
            font="mono"
            position="center"
            reveal="typewriter"
            timing={{ start: 0, end: 3 }}
            theme={theme}
            shrink={0.6}
            moveTop={{ start: 3 }}
          />
          <Label
            text="EN LA FRONTERA"
            position="center"
            timing={{ start: 3.2 }}
            theme={theme}
          />
          <BoundarySim
            timing={{ start: 4.5, end: 11 }}
            reveal="none"
            cases={[{ packet: "Dato A", label: "A", recipient: "Jose", access: "[A, B]", result: "pass" }, { packet: "Dato B", label: "B", recipient: "Pepito", access: "[A]", result: "block" }]}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 5: Trazabilidad */}
      <Sequence from={930} durationInFrames={270}>
        <GridCanvas theme={theme} timing={{ start: 31, end: 40 }}>
          <FadeText
            text="Si cruzó — hay un registro."
            font="display-italic"
            position="center"
            timing={{ start: 0, end: 2 }}
            theme={theme}
          />
          <FadeText
            text="Si no hay registro — no cruzó."
            font="display-italic"
            position="center"
            timing={{ start: 2, end: 3 }}
            theme={theme}
          />
          <TraceLog
            timing={{ start: 3.2, end: 9 }}
            reveal="none"
            columns={"pieza etiqueta dirección"}
            entries={[{ tokens: ["dato_A", "A", "→ Jose"] }, { tokens: ["dato_B", "B", "→ Jose"] }, { tokens: ["dato_C", "A", "→ David"] }]}
            badge={"FRONTERA"}
            position={"right"}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 6: Espacio de trabajo */}
      <Sequence from={1200} durationInFrames={270}>
        <GridCanvas theme={theme} timing={{ start: 40, end: 49 }}>
          <WorkspaceDiagram
            timing={{ start: 0.5, end: 9 }}
            reveal="none"
            shared={"COMPARTIDO"}
            zones={[{ side: "left", label: "PRIVADO A", tag: "etiqueta: A" }, { side: "right", label: "PRIVADO B", tag: "etiqueta: B" }]}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 7: Tres momentos */}
      <Sequence from={1470} durationInFrames={330}>
        <GridCanvas theme={theme} timing={{ start: 49, end: 60 }}>
          <FadeText
            text="TRES MOMENTOS"
            font="display"
            position="center"
            timing={{ start: 0, end: 1.5 }}
            theme={theme}
          />
          <FlowDiagram
            timing={{ start: 1.5, end: 8 }}
            reveal="none"
            steps={[{ label: "Arranque", desc: "el agente nace solo con lo que necesita", icon: 1, color: "blue" }, { label: "Trabajo", desc: "procesa libremente", icon: 2, color: "purple" }, { label: "Aduana", desc: "lo que sale se verifica", icon: 3, color: "amber" }]}
            connectors={"arrow"}
            theme={theme}
          />
          <WordReveal
            text="Está en la frontera."
            font="hero"
            position="center"
            reveal="word-stagger"
            timing={{ start: 8, end: 11 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 8: Datos derivados */}
      <Sequence from={1800} durationInFrames={240}>
        <GridCanvas theme={theme} timing={{ start: 60, end: 68 }}>
          <NodeGraph
            timing={{ start: 0, end: 5 }}
            reveal="scale-in"
            nodes={[{ id: "a", label: "A", size: "lg", color: "blue", x: 30, y: 50 }, { id: "b", label: "B", size: "lg", color: "amber", x: 70, y: 50 }, { id: "result", label: "A ∪ B", size: "xl", color: "ink", x: 50, y: 80 }]}
            edges={[{ from: "a", to: "result", style: "dashed", animate: "draw" }, { from: "b", to: "result", style: "dashed", animate: "draw" }]}
            annotation={"hereda ambas etiquetas"}
            theme={theme}
          />
          <FadeText
            text="Solo agentes con acceso a A y B"
            font="body"
            position="center"
            timing={{ start: 5 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 9: La capa que falta */}
      <Sequence from={2040} durationInFrames={180}>
        <GridCanvas theme={theme} timing={{ start: 68, end: 74 }}>
          <ProtocolCompare
            timing={{ start: 0, end: 2.5 }}
            reveal="none"
            protocols={[{ name: "A2A", auth: "yes", data: "no" }, { name: "MCP", auth: "yes", data: "no" }]}
            theme={theme}
          />
          <WordReveal
            text="La capa que falta"
            font="display"
            position="center"
            reveal="word-stagger"
            timing={{ start: 2.5, end: 4.5 }}
            theme={theme}
          />
          <FadeText
            text="qué datos pueden fluir"
            font="body"
            position="center"
            timing={{ start: 3.3 }}
            theme={theme}
          />
          <Byline
            text="ANFAIA / SkillNet"
            position="bottom-right"
            timing={{ start: 4.8 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
    </AbsoluteFill>
  );
};
