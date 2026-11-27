import { glassMaterial } from './glass-material.js';

/** Enumerate the material families independently of theme and surface role */
export const materials = ['glass', 'solid', 'frosted'] as const;

/** Identify a material family */
export type Material = (typeof materials)[number];

/** Localized display names for every material family; single source of truth for UI selectors. */
export interface MaterialDescriptor {
  readonly id: Material;
  readonly name: { readonly zh: string; readonly en: string };
  readonly shortName: { readonly zh: string; readonly en: string };
}

/** Shared registry describing every supported material in canonical order. */
export const materialCatalog = {
  glass: {
    id: 'glass',
    name: glassMaterial.name,
    shortName: { zh: '玻璃', en: 'Glass' },
  },
  solid: {
    id: 'solid',
    name: { zh: '实体', en: 'Solid' },
    shortName: { zh: '实体', en: 'Solid' },
  },
  frosted: {
    id: 'frosted',
    name: { zh: '磨砂', en: 'Frosted' },
    shortName: { zh: '磨砂', en: 'Frosted' },
  },
} as const satisfies Record<Material, MaterialDescriptor>;

/** Preserve the default paint for documents that do not select a material */
export const defaultMaterial: Material = 'glass';

/** Identify a DOM material scope */
export const materialAttribute = 'data-neoverse-material';

/** Check whether a value names a supported material */
export function isMaterial(value: unknown): value is Material {
  return materials.some((material) => material === value);
}

/** Identify an optical tier of Aurora Glass */
export type GlassTier = 'subtle' | 'elevated' | 'immersive';

const explicitSurfaces = {
  none: '',
  solid: 'ui-surface-solid',
  subtle: 'ui-surface-subtle',
  elevated: 'ui-surface-elevated',
  inset: 'ui-surface-inset',
  'glass-subtle': 'material-glass-subtle',
  'glass-elevated': 'material-glass-elevated',
  'glass-immersive': 'material-glass-immersive',
} as const satisfies Record<
  'none' | 'solid' | 'subtle' | 'elevated' | 'inset' | `glass-${GlassTier}`,
  string
>;

/** Select automatic paint, no paint, or an explicit surface treatment */
export type SurfacePreset = 'auto' | 'frosted' | keyof typeof explicitSurfaces;

/** Select a compatible surface treatment for a compact control */
export type ControlSurfacePreset = Extract<
  SurfacePreset,
  'auto' | 'none' | 'frosted' | `glass-${GlassTier}`
>;

/** Describe a surface's responsibility without specifying its paint */
export type SurfaceRole =
  | 'control'
  | 'panel'
  | 'group'
  | 'field'
  | 'overlay'
  | 'compactOverlay'
  | 'table';

const roleClasses = {
  control: 'material-role-control',
  panel: 'material-role-panel',
  group: 'material-role-group',
  field: 'material-role-field',
  overlay: 'material-role-overlay',
  compactOverlay: 'material-role-compact-overlay',
  table: 'material-role-table',
} as const satisfies Record<SurfaceRole, string>;

/** Mark an unresolved surface role or select an explicit treatment */
export function getSurfaceClass(
  surface: SurfacePreset = 'none',
  role: SurfaceRole = 'panel',
): string {
  if (surface === 'auto') return roleClasses[role];
  if (surface === 'frosted') return `${roleClasses[role]} material-frosted`;
  return explicitSurfaces[surface];
}

/** Check whether a preset explicitly names an Aurora Glass tier */
export function isGlassSurface(surface: SurfacePreset): surface is `glass-${GlassTier}` {
  return surface.startsWith('glass-');
}
