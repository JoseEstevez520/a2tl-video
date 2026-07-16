import React from 'react';
import { Composition } from 'remotion';
import { Video } from './Video';

export const RemotionRoot = () => (
  <Composition
    id="Video"
    component={Video}
    durationInFrames={2220}
    fps={30}
    width={1920}
    height={1080}
  />
);