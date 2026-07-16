import React from 'react';
import { Sequence, AbsoluteFill, useCurrentFrame, useVideoConfig, registerRoot, Composition } from 'remotion';
import { Byline, Comparison, FadeText, GridCanvas, Label, StepSequence, Triptych, TypewriterText, WordReveal } from 'vdsl/components';
import { themes } from 'vdsl/themes';

const theme = themes['dark-tech'];

export const Video = () => {
  return (
    <AbsoluteFill>
      {/* Scene 1: Intro */}
      <Sequence from={0} durationInFrames={150}>
        <GridCanvas theme={theme} timing={{ start: 0, end: 5 }}>
          <WordReveal
            text="Lección: Arrays en JavaScript"
            font="display"
            position="center"
            reveal="word-stagger"
            timing={{ start: 0, end: 3.5 }}
            theme={theme}
          />
          <Label
            text="PROGRAMACIÓN PARA PRINCIPIANTES"
            position="center"
            timing={{ start: 1.8 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 2: El problema */}
      <Sequence from={150} durationInFrames={210}>
        <GridCanvas theme={theme} timing={{ start: 5, end: 12 }}>
          <TypewriterText
            text="Tienes 3 notas de examenes:"
            font="body"
            position="upper-left"
            timing={{ start: 0, end: 2 }}
            theme={theme}
          />
          <TypewriterText
            text="nota1, nota2, nota3..."
            font="body"
            position="upper-left"
            timing={{ start: 2, end: 3.5 }}
            theme={theme}
          />
          <WordReveal
            text="¿Y si fueran 300?"
            font="hero"
            position="center"
            reveal="word-stagger"
            timing={{ start: 3.5, end: 5.5 }}
            theme={theme}
          />
          <Label
            text="NECESITAMOS UNA LISTA"
            position="center"
            timing={{ start: 4.5 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 3: Que es un array */}
      <Sequence from={360} durationInFrames={240}>
        <GridCanvas theme={theme} timing={{ start: 12, end: 20 }}>
          <WordReveal
            text="Un array es una lista ordenada"
            font="display"
            position="center"
            reveal="word-stagger"
            timing={{ start: 0, end: 3 }}
            theme={theme}
          />
          <TypewriterText
            text="let notas = [7, 8, 9, 6, 10];"
            font="mono"
            position="center"
            reveal="typewriter"
            timing={{ start: 0, end: 3.5 }}
            theme={theme}
          />
          <Label
            text="CORCHETES = ARRAY"
            position="center"
            timing={{ start: 3.8 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 4: Indices */}
      <Sequence from={600} durationInFrames={240}>
        <GridCanvas theme={theme} timing={{ start: 20, end: 28 }}>
          <FadeText
            text="Cada elemento tiene una posicion"
            font="display"
            position="center"
            timing={{ start: 0, end: 2 }}
            theme={theme}
          />
          <WordReveal
            text="Primer elemento = índice 0"
            font="body"
            position="center"
            reveal="word-stagger"
            timing={{ start: 2, end: 4 }}
            theme={theme}
          />
          <WordReveal
            text="Segundo elemento = índice 1"
            font="body"
            position="center"
            reveal="word-stagger"
            timing={{ start: 3, end: 5 }}
            theme={theme}
          />
          <WordReveal
            text="Tercer elemento = índice 2"
            font="body"
            position="center"
            reveal="word-stagger"
            timing={{ start: 4, end: 6 }}
            theme={theme}
          />
          <Label
            text="ÍNDICE EMPIEZA EN 0"
            position="center"
            timing={{ start: 5.5 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 5: Acceder */}
      <Sequence from={840} durationInFrames={210}>
        <GridCanvas theme={theme} timing={{ start: 28, end: 35 }}>
          <TypewriterText
            text="Para acceder a un elemento:"
            font="body"
            position="upper-left"
            timing={{ start: 0, end: 2 }}
            theme={theme}
          />
          <TypewriterText
            text="notas[0] → 7"
            font="mono"
            position="center"
            reveal="typewriter"
            timing={{ start: 2, end: 4.5 }}
            theme={theme}
          />
          <TypewriterText
            text="notas[2] → 9"
            font="mono"
            position="center"
            reveal="typewriter"
            timing={{ start: 3, end: 5 }}
            theme={theme}
          />
          <FadeText
            text="notas[0] es el primer elemento"
            font="body"
            position="center"
            timing={{ start: 4.5, end: 7 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 6: Recorrer un array */}
      <Sequence from={1050} durationInFrames={270}>
        <GridCanvas theme={theme} timing={{ start: 35, end: 44 }}>
          <WordReveal
            text="Podemos recorrerlo con un bucle"
            font="display"
            position="center"
            reveal="word-stagger"
            timing={{ start: 0, end: 2.5 }}
            theme={theme}
          />
          <StepSequence
            timing={{ start: 3, end: 9 }}
            steps={[
              { label: "1. Inicio", description: "let i = 0" },
              { label: "2. Condicion", description: "i < notas.length" },
              { label: "3. Acceso", description: "notas[i]" },
              { label: "4. Incremento", description: "i++" },
            ]}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 7: Metodos utiles */}
      <Sequence from={1320} durationInFrames={300}>
        <GridCanvas theme={theme} timing={{ start: 44, end: 54 }}>
          <WordReveal
            text="Metodos que todo array necesita"
            font="display"
            position="center"
            reveal="word-stagger"
            timing={{ start: 0, end: 2.5 }}
            theme={theme}
          />
          <Triptych
            timing={{ start: 3, end: 10 }}
            reveal="none"
            items={[
              { tokens: ["push()", "Añade al final"] },
              { tokens: ["pop()", "Quita del final"] },
              { tokens: ["length", "Cuantos tiene"] },
            ]}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 8: Push */}
      <Sequence from={1620} durationInFrames={180}>
        <GridCanvas theme={theme} timing={{ start: 54, end: 60 }}>
          <TypewriterText
            text="Añadir un elemento al final:"
            font="body"
            position="upper-left"
            timing={{ start: 0, end: 2 }}
            theme={theme}
          />
          <TypewriterText
            text="let nums = [1, 2, 3];"
            font="mono"
            position="center"
            reveal="typewriter"
            timing={{ start: 0, end: 2.5 }}
            theme={theme}
          />
          <TypewriterText
            text="nums.push(4);"
            font="mono"
            position="center"
            reveal="typewriter"
            timing={{ start: 2.5, end: 4 }}
            theme={theme}
          />
          <Label
            text="AHORA: [1, 2, 3, 4]"
            position="center"
            timing={{ start: 4.5 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 9: Comparacion */}
      <Sequence from={1800} durationInFrames={240}>
        <GridCanvas theme={theme} timing={{ start: 60, end: 68 }}>
          <WordReveal
            text="Array vs Variables sueltas"
            font="display"
            position="center"
            reveal="word-stagger"
            timing={{ start: 0, end: 2 }}
            theme={theme}
          />
          <Comparison
            timing={{ start: 2.5, end: 8 }}
            animation="split-tilt"
            left={{ title: "Variables sueltas", subtitle: "nota1, nota2, nota3…", badge: { text: "Caos", color: "red" } }}
            right={{ title: "Array", subtitle: "notas[0], notas[1]…", badge: { text: "Ordenado", color: "green" } }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 10: Cierre */}
      <Sequence from={2040} durationInFrames={180}>
        <GridCanvas theme={theme} timing={{ start: 68, end: 74 }}>
          <WordReveal
            text="Los arrays son la base"
            font="display"
            position="center"
            reveal="word-stagger"
            timing={{ start: 0, end: 2.5 }}
            theme={theme}
          />
          <FadeText
            text="Dominalos y dominaras los datos."
            font="body"
            position="center"
            timing={{ start: 2.5, end: 4 }}
            theme={theme}
          />
          <Byline
            text="VDSL — Video Description Language"
            position="bottom-right"
            timing={{ start: 4.5 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
    </AbsoluteFill>
  );
};
