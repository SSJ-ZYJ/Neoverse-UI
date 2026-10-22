export type SurfacePreset =
  | 'none'
  | 'solid'
  | 'subtle'
  | 'elevated'
  | 'inset'
  | 'glass-subtle'
  | 'glass-elevated'
  | 'glass-immersive';

export const surfaceClasses: Record<SurfacePreset, string> = {
  none: '',
  solid: 'ui-surface-solid',
  subtle: 'ui-surface-subtle',
  elevated: 'ui-surface-elevated',
  inset: 'ui-surface-inset',
  'glass-subtle': 'material-glass-subtle',
  'glass-elevated': 'material-glass-elevated',
  'glass-immersive': 'material-glass-immersive',
};
