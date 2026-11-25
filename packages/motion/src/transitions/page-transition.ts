import { prefersReducedMotion } from '../foundation/reduced-motion.js';
import { stopAppearanceTransition } from './appearance-transition.js';
import {
  type ActiveMorphSnapshotEntry,
  animateMorphFallback,
  animateStageResize,
  applyMorphSnapshotNames,
  type CapturedMorphRect,
  captureMorphRects,
  clearMorphSnapshotNames,
  measureElementHeight,
} from './page-morph.js';
import {
  buildFallbackKeyframes,
  isUsableRegionTarget,
  isWholePageTransitionVariant,
  type PageTransitionBackgroundMode,
  type PageTransitionDirection,
  type PageTransitionOrigin,
  type PageTransitionScope,
  type PageTransitionVariant,
  readPageExpressiveDuration,
  resolveIrisCoordinates,
  resolveRegionMetrics,
  supportsAnimatedMask,
} from './page-transition-fallback.js';
import {
  clearActiveParticleDissolve,
  dissolveSourceAttribute,
  hasReusableParticleDissolve,
  type ParticlePipelinePreference,
  reuseActiveParticleDissolve,
  runFreshParticleDissolve,
} from './particle-transition.js';

export {
  pageTransitionMorphAttribute,
  toMorphSnapshotName,
} from './page-morph.js';
export type {
  PageTransitionBackgroundMode,
  PageTransitionDirection,
  PageTransitionOrigin,
  PageTransitionScope,
  PageTransitionVariant,
} from './page-transition-fallback.js';
export {
  isWholePageTransitionVariant,
  pageTransitionDirections,
  pageTransitionVariants,
  wholePageTransitionVariants,
} from './page-transition-fallback.js';
export type { ParticlePipelinePreference } from './particle-transition.js';
export {
  dissolveSourceAttribute,
  incomingAttribute,
  particleCanvasClassName,
  particleTransitionAttribute,
} from './particle-transition.js';

export interface ViewTransitionOptions {
  /** Skip the animation entirely under prefers-reduced-motion (DOM update still runs). */
  respectReducedMotion?: boolean;
  /** Page choreography preset; see `pageTransitionVariants`. */
  variant?: PageTransitionVariant | 'none';
  /** Travel or hierarchy direction for directional presets; defaults to `'forward'`. */
  direction?: PageTransitionDirection;
  /** Scoped container for region View Transitions (`nv-page`) and WAAPI fallbacks. */
  target?: HTMLElement | null;
  /** Inner content slot animated alone by content-preserving presets when backgrounds match. */
  contentTarget?: HTMLElement | null;
  /** Container whose height smoothly stretches/shrinks when page heights differ; defaults to `target`. */
  resizeTarget?: HTMLElement | null;
  /** Whether pages share the same background (`'shared'`) or own distinct surfaces (`'surface'`). */
  background?: PageTransitionBackgroundMode;
  /** Launch element or viewport point used by `iris` reveals. */
  origin?: PageTransitionOrigin | null;
  /** Whether to transition the full document or only `target`. */
  scope?: PageTransitionScope;
  /** Which choreography to run when dissolving; see `ParticlePipelinePreference`. */
  particle?: ParticlePipelinePreference;
  /** Element captured into particles; defaults to `target` or `[data-neoverse-dissolve]`. */
  dissolveSource?: HTMLElement | null;
}

/** Attribute set on `<html>` while a startViewTransition() capture is live. */
export const viewTransitionAttribute = 'data-neoverse-view-transitioning';

/** Attribute set on `<html>` naming the active page transition preset. */
export const pageTransitionAttribute = 'data-neoverse-page-transition';

/** Attribute set on `<html>` naming the active page transition direction. */
export const pageTransitionDirectionAttribute = 'data-neoverse-page-direction';

/** Attribute set on `<html>` naming `'document'` or `'region'` snapshot scope. */
export const pageTransitionScopeAttribute = 'data-neoverse-page-scope';

/** Attribute set on `<html>` naming `'shared'` or `'surface'` background preservation mode. */
export const pageTransitionBackgroundAttribute = 'data-neoverse-page-background';

/** Attribute marking a replaceable content slot inside a shared-background surface. */
export const pageTransitionContentAttribute = 'data-neoverse-page-content';

/** Attribute applied to the scoped page outlet during `'region'` View Transitions. */
export const pageTransitionTargetAttribute = 'data-neoverse-page-target';

/** Snapshot name assigned to `[data-neoverse-page-target]` during region transitions. */
export const pageTransitionSnapshotName = 'nv-page';

const pageRadiusProperty = '--neoverse-page-transition-radius';
const pageOriginProperty = '--neoverse-page-origin';
const pageRevealRadiusProperty = '--neoverse-page-reveal-radius';

let activeViewTransition: ViewTransition | undefined;
let activeFallbackAnimations: Animation[] = [];
const activeMorphSnapshots: ActiveMorphSnapshotEntry[] = [];
let activePageTarget: HTMLElement | undefined;
let transitionRequest = 0;

/** Feature-detect standard View Transitions API support in this browser. */
export function supportsViewTransition(): boolean {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
}

function clearPageTransitionAttributes(root: HTMLElement): void {
  clearMorphSnapshotNames(activeMorphSnapshots);
  activePageTarget?.removeAttribute(pageTransitionTargetAttribute);
  activePageTarget = undefined;
  root.removeAttribute(viewTransitionAttribute);
  root.removeAttribute(pageTransitionAttribute);
  root.removeAttribute(pageTransitionDirectionAttribute);
  root.removeAttribute(pageTransitionScopeAttribute);
  root.removeAttribute(pageTransitionBackgroundAttribute);
  root.style?.removeProperty(pageRadiusProperty);
  root.style?.removeProperty(pageOriginProperty);
  root.style?.removeProperty(pageRevealRadiusProperty);
}

function resolveContentElement(
  explicitContentTarget: HTMLElement | null | undefined,
  candidateTarget: HTMLElement | null,
): HTMLElement | null {
  if (isUsableRegionTarget(explicitContentTarget)) return explicitContentTarget;
  if (isUsableRegionTarget(candidateTarget)) {
    const inside =
      typeof candidateTarget.querySelector === 'function'
        ? (candidateTarget.querySelector(
            `[${pageTransitionContentAttribute}]`,
          ) as HTMLElement | null)
        : null;
    return isUsableRegionTarget(inside) ? inside : null;
  }
  if (typeof document.querySelector === 'function') {
    const docContent = document.querySelector(
      `[${pageTransitionContentAttribute}]`,
    ) as HTMLElement | null;
    return isUsableRegionTarget(docContent) ? docContent : null;
  }
  return null;
}

function resolveTargetRadius(primary: HTMLElement, fallback: HTMLElement | null): string | null {
  if (typeof getComputedStyle !== 'function') return null;
  const radius = getComputedStyle(primary).borderRadius;
  if (radius && radius !== '0px') return radius;
  if (fallback && fallback !== primary) {
    const fallbackRadius = getComputedStyle(fallback).borderRadius;
    if (fallbackRadius && fallbackRadius !== '0px') return fallbackRadius;
  }
  return null;
}

function cancelActiveChoreography(root: HTMLElement): void {
  clearActiveParticleDissolve(root);
  for (const animation of activeFallbackAnimations) {
    animation.cancel();
  }
  activeFallbackAnimations = [];
  activeViewTransition?.skipTransition();
  activeViewTransition = undefined;
  clearPageTransitionAttributes(root);
}

/** Cancel any active page transition and restore clean root/target state. */
export function stopViewTransition(): void {
  if (typeof document === 'undefined') return;
  transitionRequest += 1;
  cancelActiveChoreography(document.documentElement);
}

function resolveVariantSelection(
  options: ViewTransitionOptions,
  dissolveDomSource: HTMLElement | null,
): PageTransitionVariant | 'none' {
  const { variant, particle = true, dissolveSource } = options;
  if (variant === 'none' || particle === false) return 'none';
  if (variant === 'dissolve') return particle === 'crossfade' ? 'fade' : 'dissolve';
  if (variant !== undefined) return variant;
  if (particle === 'crossfade') return 'fade';
  if (dissolveSource !== undefined || dissolveDomSource !== null) return 'dissolve';
  return 'fade';
}

function resolveStandardVariant(
  variant: Exclude<PageTransitionVariant, 'dissolve'>,
): Exclude<PageTransitionVariant, 'dissolve'> {
  if (!supportsAnimatedMask()) {
    if (variant === 'curtain') return 'glide';
    if (variant === 'iris') return 'depth';
  }
  return variant;
}

/**
 * Run a DOM update so the change reads as one continuous shot instead of a
 * hard cut. Resolves once the choreography finishes; a plain update runs when
 * reduced motion is requested or no animation host is available.
 */
export async function startViewTransition(
  update: () => void | Promise<void>,
  options: ViewTransitionOptions = {},
): Promise<void> {
  const {
    respectReducedMotion = true,
    direction = 'forward',
    target = null,
    contentTarget = null,
    resizeTarget,
    background = 'auto',
    origin = null,
    scope = 'auto',
    particle = true,
    dissolveSource,
  } = options;

  const runUpdate = (): Promise<void> => Promise.resolve(update()).then(() => undefined);

  if (typeof document === 'undefined') {
    return runUpdate();
  }

  const root = document.documentElement;
  const request = ++transitionRequest;
  const superseded = (): boolean => request !== transitionRequest;
  const heightOwner =
    resizeTarget !== undefined ? resizeTarget : (target ?? options.dissolveSource ?? null);

  if (respectReducedMotion && prefersReducedMotion()) {
    cancelActiveChoreography(root);
    return runUpdate();
  }

  const domDissolveSource =
    dissolveSource ??
    (typeof document.querySelector === 'function'
      ? (document.querySelector(`[${dissolveSourceAttribute}]`) as HTMLElement | null)
      : null);
  const selectedVariant = resolveVariantSelection(options, domDissolveSource);

  if (selectedVariant === 'none') {
    cancelActiveChoreography(root);
    return runUpdate();
  }

  const beforeResizeHeight = measureElementHeight(heightOwner);

  if (selectedVariant === 'dissolve') {
    const source = dissolveSource ?? target ?? domDissolveSource;
    if (hasReusableParticleDissolve(root)) {
      activeViewTransition?.skipTransition();
      activeViewTransition = undefined;
      await reuseActiveParticleDissolve(root, source, runUpdate, superseded);
      return;
    }

    cancelActiveChoreography(root);
    if (
      source !== null &&
      (await runFreshParticleDissolve(root, source, particle, runUpdate, superseded))
    ) {
      return;
    }
  } else {
    cancelActiveChoreography(root);
  }

  if (superseded()) return;

  const standardVariant: Exclude<PageTransitionVariant, 'dissolve'> =
    selectedVariant === 'dissolve' ? 'fade' : selectedVariant;
  const effectiveVariant =
    typeof document.startViewTransition === 'function'
      ? resolveStandardVariant(standardVariant)
      : standardVariant;
  const candidateTarget =
    target ?? (options.variant !== undefined ? (dissolveSource ?? null) : null);
  const surfaceTarget =
    scope !== 'document' && isUsableRegionTarget(candidateTarget) ? candidateTarget : null;
  const backgroundMode: 'shared' | 'surface' =
    isWholePageTransitionVariant(effectiveVariant) || background === 'surface'
      ? 'surface'
      : 'shared';
  const resolvedContentTarget =
    backgroundMode === 'shared' ? resolveContentElement(contentTarget, candidateTarget) : null;
  const regionTarget = resolvedContentTarget ?? surfaceTarget;
  const effectiveScope: 'document' | 'region' = regionTarget !== null ? 'region' : 'document';

  const morphScope: ParentNode = regionTarget ?? root;

  if (typeof document.startViewTransition !== 'function') {
    const morphRects: Map<string, CapturedMorphRect> | null =
      effectiveVariant === 'morph' ? captureMorphRects(morphScope) : null;
    await runUpdate();
    if (superseded()) return;
    const started: Animation[] = morphRects
      ? animateMorphFallback(morphScope, morphRects, readPageExpressiveDuration(root), root)
      : [];
    const resizeAnimation = animateStageResize(
      heightOwner,
      beforeResizeHeight,
      root,
      standardVariant,
    );
    if (resizeAnimation) started.push(resizeAnimation);
    if (
      started.length === 0 &&
      regionTarget?.isConnected &&
      typeof regionTarget.animate === 'function'
    ) {
      const { keyframes, duration, easing } = buildFallbackKeyframes(
        root,
        regionTarget,
        standardVariant,
        direction,
        origin,
      );
      started.push(regionTarget.animate(keyframes, { duration, easing, fill: 'none' }));
    }
    if (started.length > 0) {
      activeFallbackAnimations = started;
      try {
        await Promise.all(started.map((animation) => animation.finished.catch(() => undefined)));
      } finally {
        if (activeFallbackAnimations === started) activeFallbackAnimations = [];
      }
    }
    return;
  }

  stopAppearanceTransition(document);

  root.setAttribute(viewTransitionAttribute, '');
  root.setAttribute(pageTransitionAttribute, effectiveVariant);
  root.setAttribute(pageTransitionDirectionAttribute, direction);
  root.setAttribute(pageTransitionScopeAttribute, effectiveScope);
  root.setAttribute(pageTransitionBackgroundAttribute, backgroundMode);

  if (regionTarget) {
    activePageTarget = regionTarget;
    regionTarget.setAttribute(pageTransitionTargetAttribute, '');
    const radius = resolveTargetRadius(regionTarget, surfaceTarget ?? candidateTarget);
    if (radius) root.style?.setProperty(pageRadiusProperty, radius);
  }

  if (effectiveVariant === 'iris') {
    const bounds = resolveRegionMetrics(effectiveScope, regionTarget);
    const { x, y, radius } = resolveIrisCoordinates(origin, bounds);
    root.style?.setProperty(pageOriginProperty, `${x}px ${y}px`);
    root.style?.setProperty(pageRevealRadiusProperty, `${radius}px`);
  }

  if (effectiveVariant === 'morph') {
    applyMorphSnapshotNames(morphScope, activeMorphSnapshots);
  }

  const transition = document.startViewTransition(
    effectiveVariant === 'morph'
      ? async () => {
          await runUpdate();
          if (!superseded()) {
            applyMorphSnapshotNames(morphScope, activeMorphSnapshots);
          }
        }
      : runUpdate,
  );
  activeViewTransition = transition;

  if (heightOwner && beforeResizeHeight !== null && transition.ready) {
    void transition.ready.then(
      () => {
        if (superseded()) return;
        const resizeAnimation = animateStageResize(
          heightOwner,
          beforeResizeHeight,
          root,
          effectiveVariant,
        );
        if (resizeAnimation) activeFallbackAnimations.push(resizeAnimation);
      },
      () => undefined,
    );
  }

  return transition.finished.finally(() => {
    if (superseded()) return;
    if (activeViewTransition === transition) activeViewTransition = undefined;
    for (const animation of activeFallbackAnimations) {
      animation.cancel();
    }
    activeFallbackAnimations = [];
    clearPageTransitionAttributes(root);
  });
}
