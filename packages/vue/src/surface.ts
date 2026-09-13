import type { GlassSurfaceVariant, SurfacePreset } from './types';

export const surfaceClasses: Record<SurfacePreset, string> = {
  none: '',
  solid: 'bg-surface-canvas border border-subtle',
  subtle: 'bg-surface-subtle border border-subtle',
  elevated: 'bg-surface-raised border border-default shadow-raised',
  chrome: 'ui-surface-chrome',
  'glass-subtle': 'material-glass-subtle',
  'glass-elevated': 'material-glass-elevated',
  'glass-card': 'material-glass-card',
  'glass-immersive': 'material-glass-immersive',
};

export function getSurfaceClass(surface: SurfacePreset = 'none'): string {
  return surfaceClasses[surface];
}

export function glassVariantToSurface(variant: GlassSurfaceVariant): SurfacePreset {
  return `glass-${variant}` as SurfacePreset;
}

export function isGlassSurface(surface: SurfacePreset): boolean {
  return surface.startsWith('glass-');
}
