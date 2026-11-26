import type { MaterialMode } from '@neoverse-ui/tokens';

/** Centre-column backdrops for judging component optics inside the shell. */
export const stageBackgrounds = ['canvas', 'tint', 'gradient', 'optical'] as const;

export type StageBackground = (typeof stageBackgrounds)[number];

export const defaultStageBackground: StageBackground = 'canvas';

export function isStageBackground(value: unknown): value is StageBackground {
  return typeof value === 'string' && stageBackgrounds.some((mode) => mode === value);
}

/** Opt into a specimen-only comparison without changing stored appearance. */
export function readStageMaterial(search: string): MaterialMode | undefined {
  const value = new URLSearchParams(search).get('material');
  return value === 'glass' || value === 'solid' ? value : undefined;
}
