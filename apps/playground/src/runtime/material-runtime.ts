import { animateAppearanceChange, stopAppearanceTransition } from '@neoverse-ui/motion';
import { defaultMaterial, isMaterial, type Material, materialAttribute } from '@neoverse-ui/tokens';
import { readPreferences, writePreferences } from './playground-preferences';
import { isReloadNavigation } from './theme-runtime';

/* Framework-neutral material engine for the Playground. The shell, the frame
   and the React fixture resolve, apply and persist the same selection through
   this module, so `data-neoverse-material` stays the one live contract. A
   `?material=` link stays a temporary preview and never writes a preference. */

const materialQueryParameter = 'material';
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

export function readMaterialFromSearch(search: string): Material | undefined {
  const value = new URLSearchParams(search).get(materialQueryParameter);
  return isMaterial(value) ? value : undefined;
}

/** Match the pre-paint material selection to the mounted application's policy. */
export function selectInitialMaterialMode(
  query: Material | undefined,
  stored: unknown,
  reloading: boolean,
  fallback: Material = defaultMaterial,
  validate = isMaterial,
): Material {
  const preference = validate(stored) ? stored : undefined;
  // A fresh link is a fixed preview; a reload keeps the last interactive choice.
  return reloading ? (preference ?? query ?? fallback) : (query ?? preference ?? fallback);
}

export function resolveInitialMaterialMode(): Material {
  if (typeof window === 'undefined') {
    return defaultMaterial;
  }

  return selectInitialMaterialMode(
    readMaterialFromSearch(window.location.search),
    readPreferences().material,
    isReloadNavigation(),
  );
}

function setDocumentMaterial(value: Material): void {
  const root = document.documentElement;
  if (root.getAttribute(materialAttribute) === value) return;
  root.setAttribute(materialAttribute, value);
}

/** The authoritative request. A canceled snapshot may still commit late; it
 *  must paint the newest selection rather than the one it started with. */
let requestedMaterial: Material | undefined;

function paintRequestedMaterial(): void {
  if (requestedMaterial !== undefined) setDocumentMaterial(requestedMaterial);
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(reducedMotionQuery).matches;
}

export function applyMaterialMode(value: Material, animate = true): void {
  if (typeof document === 'undefined') return;
  requestedMaterial = value;
  const root = document.documentElement;
  if (root.getAttribute(materialAttribute) === value) {
    // Cancel any in-flight material or appearance transition that started from
    // another target so returning to the live material never flashes late.
    stopAppearanceTransition(document);
    return;
  }

  if (!animate || prefersReducedMotion()) {
    stopAppearanceTransition(document);
    paintRequestedMaterial();
    return;
  }

  // The snapshot owns the whole swap: surfaces never interpolate their blur,
  // refraction or shadow, and a newer request stops the previous run.
  void animateAppearanceChange(paintRequestedMaterial, { kind: 'material-fade' });
}

export function persistMaterialMode(value: Material): void {
  writePreferences({ material: value });
}
