export const shadowCssVariables = {
  none: '--neoverse-shadow-none',
  xs: '--neoverse-shadow-xs',
  sm: '--neoverse-shadow-sm',
  md: '--neoverse-shadow-md',
  lg: '--neoverse-shadow-lg',
  xl: '--neoverse-shadow-xl',
  inset: '--neoverse-shadow-inset',
  control: '--neoverse-shadow-control',
  float: '--neoverse-shadow-float',
  raised: '--neoverse-shadow-raised',
  card: '--neoverse-shadow-card',
  overlay: '--neoverse-shadow-overlay',
  modal: '--neoverse-shadow-modal',
} as const;

export type ShadowToken = keyof typeof shadowCssVariables;
