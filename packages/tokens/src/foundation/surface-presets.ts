/** Select the material family independently of the color theme */
export type MaterialMode = 'glass' | 'solid';

/** Map explicit surface presets and the auto marker to shared CSS classes */
export const surfaceClasses = {
  none: '',
  solid: 'ui-surface-solid',
  subtle: 'ui-surface-subtle',
  elevated: 'ui-surface-elevated',
  inset: 'ui-surface-inset',
  'glass-subtle': 'material-glass-subtle',
  'glass-elevated': 'material-glass-elevated',
  'glass-immersive': 'material-glass-immersive',
  auto: 'material-auto',
} satisfies Record<string, string>;

/** Name a surface recipe or let its role resolve one by material mode */
export type SurfacePreset = keyof typeof surfaceClasses;
/** Select a quiet, automatic, or explicit Glass surface for a compact control */
export type ControlSurfacePreset = Extract<SurfacePreset, 'auto' | 'none' | `glass-${string}`>;

/** Define the default preset for each material and semantic role */
export const materialSurfacePresets = {
  control: { glass: 'glass-subtle', solid: 'solid' },
  panel: { glass: 'glass-elevated', solid: 'solid' },
  group: { glass: 'glass-subtle', solid: 'solid' },
} as const satisfies Record<string, Record<MaterialMode, SurfacePreset>>;

/** Identify the responsibility of a surface independently of its material */
export type MaterialSurfaceRole = keyof typeof materialSurfacePresets;

/** Compose a preset class without resolving its surrounding DOM material scope */
export function getSurfaceClass(
  surface: SurfacePreset = 'none',
  role: MaterialSurfaceRole = 'panel',
): string {
  if (surface !== 'auto') return surfaceClasses[surface];
  return autoSurfaceClasses[role];
}

/** Check whether a preset explicitly names an Aurora Glass tier */
export function isGlassSurface(surface: SurfacePreset): boolean {
  return surface.startsWith('glass-');
}

const autoSurfaceClasses = {
  control: `${surfaceClasses.auto} ${surfaceClasses[materialSurfacePresets.control.glass]}`,
  panel: `${surfaceClasses.auto} ${surfaceClasses[materialSurfacePresets.panel.glass]}`,
  group: `${surfaceClasses.auto} ${surfaceClasses[materialSurfacePresets.group.glass]}`,
} as const satisfies Record<MaterialSurfaceRole, string>;
