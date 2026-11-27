import { motionStaticSelector } from '../motion-tracking.js';
import { occluderSelector } from './occlusion.js';
import { glassSelector, materialModeAttribute } from './style-resolution.js';

export const glassRendererAttribute = 'data-neoverse-glass-renderer';

export const glassMutationAttributes = [
  'class',
  'style',
  'hidden',
  'open',
  'data-theme',
  materialModeAttribute,
  'data-presentation',
  'data-surface',
  glassRendererAttribute,
  'data-neoverse-glass-edge-pass',
  'data-neoverse-glass-edge-pass-active',
  'data-neoverse-glass-occluder',
  'data-neoverse-glass-nesting',
  'data-neoverse-tooltip-surface',
  'colspan',
  'rowspan',
  'span',
] as const;

// Attribute changes outside a Glass surface, its occluders and its ancestors
// cannot move or restyle an edge. Typewriters and scrollbar thumbs emit
// thousands of style mutations per second from exactly that region.
const sceneRelevantAttributes = new Set<string>([
  materialModeAttribute,
  'data-theme',
  'open',
  'data-presentation',
  'data-surface',
  glassRendererAttribute,
  'data-neoverse-glass-edge-pass',
  'data-neoverse-glass-edge-pass-active',
  'data-neoverse-glass-occluder',
  'data-neoverse-glass-nesting',
  'data-neoverse-tooltip-surface',
  'colspan',
  'rowspan',
  'span',
  'hidden',
]);

export interface SceneMutationContext {
  ownerDocument: Document | undefined;
  canvas: HTMLCanvasElement | undefined;
  chromaCanvas: HTMLCanvasElement | undefined;
  colorProbe: HTMLElement | undefined;
  observedGlassElements: ReadonlySet<HTMLElement>;
}

/** Decorative attribute churn cannot change edge geometry; only scene-bearing
 * mutations raise the revision and schedule a repaint. */
export const isSceneMutation = (record: MutationRecord, context: SceneMutationContext): boolean => {
  const target = record.target;
  const element = target.nodeType === 1 ? (target as Element) : undefined;
  if (
    target === context.colorProbe ||
    target === context.canvas ||
    target === context.chromaCanvas ||
    (record.attributeName === glassRendererAttribute &&
      element === context.ownerDocument?.documentElement) ||
    element?.closest('[data-neoverse-particle-capture]') ||
    (record.attributeName !== materialModeAttribute && element?.closest(motionStaticSelector))
  ) {
    return false;
  }
  if (record.type === 'childList') {
    // The renderer's own canvases and probe appear and disappear with the
    // optics; they never change the scene that needs an edge pass.
    const owned = Array.from(record.addedNodes).concat(Array.from(record.removedNodes));
    if (
      owned.length > 0 &&
      owned.every(
        (node) =>
          node === context.canvas || node === context.chromaCanvas || node === context.colorProbe,
      )
    ) {
      return false;
    }
  }
  if (record.type !== 'attributes') return true;
  const name = record.attributeName ?? '';
  if (sceneRelevantAttributes.has(name)) return true;
  if (name !== 'class' && name !== 'style') return true;
  if (element === undefined || element === context.ownerDocument?.documentElement) return true;
  if (element.matches?.(glassSelector) || element.closest(glassSelector)) return true;
  if (element.matches?.(occluderSelector) || element.closest(occluderSelector)) return true;
  // An ancestor can move or resize a surface without changing its attributes.
  if (element.querySelector?.(glassSelector)) return true;
  // A class removal can erase the old selector match on a surface (or on
  // its prose ancestor) before the observer sees the mutation.
  if (name === 'class') {
    for (const surface of context.observedGlassElements) {
      if (element.contains(surface)) return true;
    }
  }
  return false;
};

export const isRelevantScrollTarget = (
  event: Event | undefined,
  ownerDocument: Document | undefined,
): boolean => {
  const target = event?.target;
  const isRootScroll =
    event === undefined ||
    target === null ||
    target === ownerDocument ||
    target === ownerDocument?.documentElement ||
    target === ownerDocument?.body ||
    target === ownerDocument?.defaultView;

  if (isRootScroll || !target || typeof (target as Element).matches !== 'function') {
    return true;
  }

  const element = target as Element;
  return (
    element.matches(glassSelector) ||
    element.matches(occluderSelector) ||
    element.closest(glassSelector) !== null ||
    element.closest(occluderSelector) !== null ||
    element.querySelector(glassSelector) !== null ||
    element.querySelector(occluderSelector) !== null
  );
};
