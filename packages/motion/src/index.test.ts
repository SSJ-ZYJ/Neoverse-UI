import { expect, test } from 'bun:test';

import { motionDurations, motionEasings, motionRecipes, motionTransitions } from './index.js';

test('exposes the canonical Motion durations and easings', () => {
  expect(motionDurations).toEqual({
    fast: '180ms',
    standard: '360ms',
    expressive: '760ms',
  });
  expect(motionEasings).toEqual({
    linear: 'linear',
    standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
    emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
  });
});

test('exposes semantic transition CSS variable names', () => {
  expect(motionTransitions).toEqual({
    micro: {
      duration: '--neoverse-motion-micro-duration',
      easing: '--neoverse-motion-micro-easing',
      property: '--neoverse-motion-micro-property',
    },
    state: {
      duration: '--neoverse-motion-state-duration',
      easing: '--neoverse-motion-state-easing',
      property: '--neoverse-motion-state-property',
    },
    spatial: {
      duration: '--neoverse-motion-spatial-duration',
      easing: '--neoverse-motion-spatial-easing',
      property: '--neoverse-motion-spatial-property',
    },
  });
});

test('exposes reusable entrance and emphasis motion recipes', () => {
  expect(motionRecipes).toEqual({
    fade: {
      className: 'neoverse-motion-fade-in',
      duration: 'standard',
      easing: 'standard',
    },
    rise: {
      className: 'neoverse-motion-rise-in',
      duration: 'standard',
      easing: 'emphasized',
    },
    scale: {
      className: 'neoverse-motion-scale-in',
      duration: 'expressive',
      easing: 'emphasized',
    },
    emphasis: {
      className: 'neoverse-motion-emphasis',
      duration: 'expressive',
      easing: 'emphasized',
    },
  });
});
