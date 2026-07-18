import React from 'react';
import { Sequence, AbsoluteFill, useCurrentFrame, useVideoConfig, registerRoot, Composition } from 'remotion';
import { Byline, FadeText, GridCanvas, Label, StepSequence, WordReveal } from 'vdsl/components';
import { themes } from 'vdsl/themes';

const theme = themes['dark-tech'];

export const Video = () => {
  return (
    <AbsoluteFill>
      {/* Scene 1: Hello */}
      <Sequence from={0} durationInFrames={120}>
        <GridCanvas theme={theme} timing={{ start: 0, end: 4 }}>
          <WordReveal
            text="Hello, VDSL"
            font="hero"
            position="center"
            reveal="word-stagger"
            timing={{ start: 0, end: 3 }}
            theme={theme}
          />
          <Label
            text="your first video"
            position="center"
            timing={{ start: 1.5 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 2: How it works */}
      <Sequence from={120} durationInFrames={180}>
        <GridCanvas theme={theme} timing={{ start: 4, end: 10 }}>
          <StepSequence
            timing={{ start: 0.5, end: 6 }}
            steps={[
              { label: "1. WRITE", description: "describe your video in ~100 lines" },
              { label: "2. COMPILE", description: "VDSL generates Remotion components" },
              { label: "3. RENDER", description: "get a professional MP4" },
            ]}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
      {/* Scene 3: Done */}
      <Sequence from={300} durationInFrames={90}>
        <GridCanvas theme={theme} timing={{ start: 10, end: 13 }}>
          <FadeText
            text="That's it."
            font="display"
            position="center"
            timing={{ start: 0, end: 3 }}
            theme={theme}
          />
          <Byline
            text="Made with VDSL"
            position="bottom-right"
            timing={{ start: 1 }}
            theme={theme}
          />
        </GridCanvas>
      </Sequence>
    </AbsoluteFill>
  );
};
