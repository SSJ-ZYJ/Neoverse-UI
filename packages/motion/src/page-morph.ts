import { motionEasings, motionRoles } from './motion-tokens.js';
import {
  isUsableRegionTarget,
  type PageTransitionVariant,
  readPageExpressiveDuration,
} from './page-transition-fallback.js';

/** Attribute marking elements that smoothly morph across pages in `morph` transitions. */
export const pageTransitionMorphAttribute = 'data-neoverse-page-morph';

const morphNamePrefix = 'nv-morph-';

export interface ActiveMorphSnapshotEntry {
  element: HTMLElement;
  previousInlineName: string;
  previousPriority: string;
}

export interface CapturedMorphRect {
  rect: DOMRect;
  borderRadius: string;
}

export function toMorphSnapshotName(rawKey: string | null): string | null {
  if (!rawKey) return null;
  const cleaned = rawKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!cleaned) return null;
  return `${morphNamePrefix}${cleaned}`;
}

function queryMorphElements(scopeRoot: ParentNode): HTMLElement[] {
  if (typeof scopeRoot.querySelectorAll !== 'function') return [];
  const matches = scopeRoot.querySelectorAll(`[${pageTransitionMorphAttribute}]`);
  const elements: HTMLElement[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const candidate = matches[i] as HTMLElement | undefined;
    if (isUsableRegionTarget(candidate)) elements.push(candidate);
  }
  return elements;
}

export function applyMorphSnapshotNames(
  scopeRoot: ParentNode,
  tracked: ActiveMorphSnapshotEntry[],
): void {
  const seenNames = new Set<string>();
  for (const element of queryMorphElements(scopeRoot)) {
    const name = toMorphSnapshotName(element.getAttribute(pageTransitionMorphAttribute));
    if (!name || seenNames.has(name)) continue;
    seenNames.add(name);
    if (!tracked.some((entry) => entry.element === element)) {
      tracked.push({
        element,
        previousInlineName: element.style.getPropertyValue('view-transition-name'),
        previousPriority: element.style.getPropertyPriority('view-transition-name'),
      });
    }
    element.style.setProperty('view-transition-name', name);
  }
}

export function clearMorphSnapshotNames(tracked: ActiveMorphSnapshotEntry[]): void {
  while (tracked.length > 0) {
    const entry = tracked.pop();
    if (!entry) continue;
    if (entry.previousInlineName) {
      entry.element.style.setProperty(
        'view-transition-name',
        entry.previousInlineName,
        entry.previousPriority,
      );
    } else {
      entry.element.style.removeProperty('view-transition-name');
    }
  }
}

export function captureMorphRects(scopeRoot: ParentNode): Map<string, CapturedMorphRect> {
  const rects = new Map<string, CapturedMorphRect>();
  for (const element of queryMorphElements(scopeRoot)) {
    const name = toMorphSnapshotName(element.getAttribute(pageTransitionMorphAttribute));
    if (!name || rects.has(name) || typeof element.getBoundingClientRect !== 'function') continue;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const borderRadius =
      typeof getComputedStyle === 'function' ? getComputedStyle(element).borderRadius : '';
    rects.set(name, { rect, borderRadius });
  }
  return rects;
}

export function animateMorphFallback(
  scopeRoot: ParentNode,
  previousRects: Map<string, CapturedMorphRect>,
  durationMs: number,
  root: HTMLElement = scopeRoot as HTMLElement,
): Animation[] {
  const animations: Animation[] = [];
  if (previousRects.size === 0) return animations;
  const computedEasing =
    typeof getComputedStyle === 'function'
      ? getComputedStyle(root).getPropertyValue(motionRoles.spatial.easing).trim()
      : '';
  const easing = computedEasing || motionEasings.emphasized;
  const seen = new Set<string>();

  for (const element of queryMorphElements(scopeRoot)) {
    const name = toMorphSnapshotName(element.getAttribute(pageTransitionMorphAttribute));
    if (!name || seen.has(name) || typeof element.animate !== 'function') continue;
    seen.add(name);
    const prev = previousRects.get(name);
    if (!prev || typeof element.getBoundingClientRect !== 'function') continue;
    const next = element.getBoundingClientRect();
    if (next.width <= 0 || next.height <= 0) continue;

    const dx = prev.rect.left - next.left;
    const dy = prev.rect.top - next.top;
    const sx = prev.rect.width / next.width;
    const sy = prev.rect.height / next.height;
    if (
      Math.abs(dx) < 0.5 &&
      Math.abs(dy) < 0.5 &&
      Math.abs(sx - 1) < 0.01 &&
      Math.abs(sy - 1) < 0.01
    ) {
      continue;
    }

    const fromFrame: Keyframe = {
      transformOrigin: 'top left',
      transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
    };
    if (prev.borderRadius) fromFrame.borderRadius = prev.borderRadius;

    animations.push(
      element.animate([fromFrame, { transformOrigin: 'top left', transform: 'none' }], {
        duration: durationMs,
        easing,
        fill: 'none',
      }),
    );
  }

  return animations;
}

function readDurationToken(root: HTMLElement, variable: string, fallbackMs: number): number {
  if (typeof getComputedStyle !== 'function') return fallbackMs;
  const raw = getComputedStyle(root).getPropertyValue(variable).trim();
  const amount = Number.parseFloat(raw);
  if (!Number.isFinite(amount) || amount <= 0) return fallbackMs;
  if (raw.endsWith('ms')) return amount;
  if (raw.endsWith('s')) return amount * 1000;
  return fallbackMs;
}

export function measureElementHeight(element: HTMLElement | null | undefined): number | null {
  if (!isUsableRegionTarget(element) || typeof element.getBoundingClientRect !== 'function') {
    return null;
  }
  const height = element.getBoundingClientRect().height;
  return Number.isFinite(height) && height > 0 ? height : null;
}

export function animateStageResize(
  element: HTMLElement | null | undefined,
  fromHeight: number | null,
  root: HTMLElement,
  variant: Exclude<PageTransitionVariant, 'dissolve'>,
): Animation | null {
  if (fromHeight === null || !element?.isConnected || typeof element.animate !== 'function') {
    return null;
  }
  const toHeight = measureElementHeight(element);
  if (toHeight === null || Math.abs(toHeight - fromHeight) <= 0.5) return null;

  const isExpressive =
    variant === 'veil' || variant === 'curtain' || variant === 'iris' || variant === 'morph';
  const duration = isExpressive
    ? readPageExpressiveDuration(root)
    : readDurationToken(root, '--neoverse-motion-page-duration', 360);
  const easingVariable =
    variant === 'veil' || variant === 'curtain' || variant === 'iris'
      ? '--neoverse-motion-easing-symmetric'
      : '--neoverse-motion-easing-emphasized';
  const easing =
    (typeof getComputedStyle === 'function'
      ? getComputedStyle(root).getPropertyValue(easingVariable).trim()
      : '') || motionEasings.emphasized;

  return element.animate(
    [
      { height: `${fromHeight}px`, overflow: 'clip' },
      { height: `${toHeight}px`, overflow: 'clip' },
    ],
    { duration, easing, fill: 'none' },
  );
}
