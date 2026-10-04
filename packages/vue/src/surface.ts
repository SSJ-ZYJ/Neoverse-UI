import type { SurfacePreset } from './types';

export const surfaceClasses: Record<SurfacePreset, string> = {
  none: '',
  solid: 'ui-surface-solid',
  subtle: 'ui-surface-subtle',
  elevated: 'ui-surface-elevated',
  inset: 'ui-surface-inset',
  chrome: 'ui-surface-chrome',
  'glass-subtle': 'material-glass-subtle',
  'glass-elevated': 'material-glass-elevated',
  'glass-immersive': 'material-glass-immersive',
};

export function getSurfaceClass(surface: SurfacePreset = 'none'): string {
  return surfaceClasses[surface];
}

export function isGlassSurface(surface: SurfacePreset): boolean {
  return surface.startsWith('glass-');
}
