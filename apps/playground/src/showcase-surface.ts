/** Material tiers selectable on the overview hero sample. */
export const showcaseSurfaces = ['glass-subtle', 'glass-elevated'] as const;

export type ShowcaseSurface = (typeof showcaseSurfaces)[number];

export const defaultShowcaseSurface: ShowcaseSurface = 'glass-subtle';

export function isShowcaseSurface(value: unknown): value is ShowcaseSurface {
  return typeof value === 'string' && showcaseSurfaces.some((surface) => surface === value);
}
