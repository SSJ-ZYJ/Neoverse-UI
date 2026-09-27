import { expect, test } from 'bun:test';

import { motionDurations, motionEasings, motionRoles } from './index.js';

test('exposes the canonical Motion durations and easings', () => {
  expect(motionDurations).toEqual({
    fast: '140ms',
    standard: '240ms',
    expressive: '420ms',
  });
  expect(motionEasings).toEqual({
    linear: 'linear',
    standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
    emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
  });
});

test('exposes semantic motion roles used by shared components', () => {
  expect(motionRoles).toEqual({
    feedback: {
      duration: '--neoverse-motion-feedback-duration',
      easing: '--neoverse-motion-feedback-easing',
    },
    state: {
      duration: '--neoverse-motion-state-duration',
      easing: '--neoverse-motion-state-easing',
    },
    spatial: {
      duration: '--neoverse-motion-spatial-duration',
      easing: '--neoverse-motion-spatial-easing',
    },
  });
});
