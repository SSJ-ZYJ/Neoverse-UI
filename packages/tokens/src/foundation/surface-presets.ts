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

/** Map auto roles to a Glass utility and to the named Solid plate recipe */
export const materialSurfacePresets = {
  control: { glass: 'glass-subtle', solid: 'solid', solidRole: 'control' },
  panel: { glass: 'glass-elevated', solid: 'solid', solidRole: 'raised' },
  group: { glass: 'glass-subtle', solid: 'solid', solidRole: 'group' },
  field: { glass: 'none', solid: 'solid', solidRole: 'inset' },
  overlay: { glass: 'glass-elevated', solid: 'solid', solidRole: 'overlay' },
  table: { glass: 'none', solid: 'solid', solidRole: 'raised' },
} as const satisfies Record<
  string,
  Record<MaterialMode, SurfacePreset> & {
    solidRole: 'control' | 'raised' | 'group' | 'inset' | 'overlay';
  }
>;

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
  control: autoSurfaceClass('control'),
  panel: autoSurfaceClass('panel'),
  group: autoSurfaceClass('group'),
  field: autoSurfaceClass('field'),
  overlay: autoSurfaceClass('overlay'),
  table: autoSurfaceClass('table'),
} as const satisfies Record<MaterialSurfaceRole, string>;

function autoSurfaceClass(role: MaterialSurfaceRole): string {
  const { glass, solidRole } = materialSurfacePresets[role];
  const glassClass = surfaceClasses[glass];
  return `${surfaceClasses.auto} material-solid-${solidRole}${glassClass ? ` ${glassClass}` : ''}`;
}
