export const radiusCssVariables = {
  none: '--neoverse-radius-none',
  xs: '--neoverse-radius-xs',
  sm: '--neoverse-radius-sm',
  md: '--neoverse-radius-md',
  lg: '--neoverse-radius-lg',
  xl: '--neoverse-radius-xl',
  '2xl': '--neoverse-radius-2xl',
  pill: '--neoverse-radius-pill',
  control: '--neoverse-radius-control',
  controlInner: '--neoverse-radius-control-inner',
  card: '--neoverse-radius-card',
  panel: '--neoverse-radius-panel',
} as const;

export type RadiusToken = keyof typeof radiusCssVariables;
