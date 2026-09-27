export const motionDurations = {
  fast: '140ms',
  standard: '240ms',
  expressive: '420ms',
} as const;

export const motionEasings = {
  linear: 'linear',
  standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const motionRoles = {
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
} as const;

export type MotionDuration = keyof typeof motionDurations;
export type MotionEasing = keyof typeof motionEasings;
export type MotionRole = keyof typeof motionRoles;
