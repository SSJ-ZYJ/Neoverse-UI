export const motionDurations = {
  fast: '180ms',
  standard: '360ms',
  expressive: '760ms',
} as const;

export const motionEasings = {
  linear: 'linear',
  standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const motionTransitions = {
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
} as const;

export type MotionDuration = keyof typeof motionDurations;
export type MotionEasing = keyof typeof motionEasings;
export type MotionTransition = keyof typeof motionTransitions;
