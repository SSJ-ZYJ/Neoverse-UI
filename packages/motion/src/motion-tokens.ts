/**
 * The Motion token scale and its semantic roles.
 *
 * Kept separate from the package entry so the DOM helpers can read the same
 * role names without importing the entry that re-exports them.
 */

export const motionDurations = {
  fast: '140ms',
  standard: '240ms',
  expressive: '420ms',
} as const;

export const motionEasings = {
  linear: 'linear',
  standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
  accelerate: 'cubic-bezier(0.5, 0, 0.75, 0)',
} as const;

export const motionDistances = {
  near: '--neoverse-motion-distance-near',
  mid: '--neoverse-motion-distance-mid',
  far: '--neoverse-motion-distance-far',
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
  enter: {
    duration: '--neoverse-motion-enter-duration',
    easing: '--neoverse-motion-enter-easing',
  },
  exit: {
    duration: '--neoverse-motion-exit-duration',
    easing: '--neoverse-motion-exit-easing',
  },
} as const;

export type MotionDuration = keyof typeof motionDurations;
export type MotionEasing = keyof typeof motionEasings;
export type MotionDistance = keyof typeof motionDistances;
export type MotionRole = keyof typeof motionRoles;
