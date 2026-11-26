import { animateAppearanceChange, stopAppearanceTransition } from '@neoverse-ui/motion';
import type { MaterialMode } from '@neoverse-ui/tokens';
import { readPreferences, writePreferences } from './playground-preferences';
import { isReloadNavigation } from './theme-runtime';

/* Framework-neutral material engine for the Playground. The shell, the frame
   and the React fixture resolve, apply and persist the same selection through
   this module, so `data-neoverse-material` stays the one live contract. A
   `?material=` link stays a temporary preview and never writes a preference. */

export const materialModes: readonly MaterialMode[] = ['glass', 'solid'];
export const defaultMaterialMode: MaterialMode = 'glass';
const materialQueryParameter = 'material';
const materialAttribute = 'data-neoverse-material';
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

export function isMaterialMode(value: unknown): value is MaterialMode {
  return typeof value === 'string' && materialModes.includes(value as MaterialMode);
}

export function readMaterialFromSearch(search: string): MaterialMode | undefined {
  const value = new URLSearchParams(search).get(materialQueryParameter);
  return isMaterialMode(value) ? value : undefined;
}

/** Match the pre-paint material selection to the mounted application's policy. */
export function selectInitialMaterialMode(
  query: MaterialMode | undefined,
  stored: unknown,
  reloading: boolean,
  modes = materialModes,
  fallback = defaultMaterialMode,
): MaterialMode {
  const preference = modes.find((mode) => mode === stored);
  // A fresh link is a fixed preview; a reload keeps the last interactive choice.
  return reloading ? (preference ?? query ?? fallback) : (query ?? preference ?? fallback);
}

export function resolveInitialMaterialMode(): MaterialMode {
  if (typeof window === 'undefined') {
    return defaultMaterialMode;
  }

  return selectInitialMaterialMode(
    readMaterialFromSearch(window.location.search),
    readPreferences().material,
    isReloadNavigation(),
  );
}

function setDocumentMaterial(value: MaterialMode): void {
  const root = document.documentElement;
  if (root.getAttribute(materialAttribute) === value) return;
  root.setAttribute(materialAttribute, value);
}

/** The authoritative request. A canceled snapshot may still commit late; it
 *  must paint the newest selection rather than the one it started with. */
let requestedMaterial: MaterialMode | undefined;

function paintRequestedMaterial(): void {
  if (requestedMaterial !== undefined) setDocumentMaterial(requestedMaterial);
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(reducedMotionQuery).matches;
}

export function applyMaterialMode(value: MaterialMode, animate = true): void {
  if (typeof document === 'undefined') return;
  requestedMaterial = value;
  const root = document.documentElement;
  if (root.getAttribute(materialAttribute) === value) return;

  if (!animate || prefersReducedMotion()) {
    stopAppearanceTransition(document);
    paintRequestedMaterial();
    return;
  }

  // The snapshot owns the whole swap: surfaces never interpolate their blur,
  // refraction or shadow, and a newer request stops the previous run.
  void animateAppearanceChange(paintRequestedMaterial, { kind: 'material-fade' });
}

export function persistMaterialMode(value: MaterialMode): void {
  writePreferences({ material: value });
}
