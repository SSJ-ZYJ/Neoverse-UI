import { createParticleDissolve, type ParticleDissolveHandle } from './particle-dissolve.js';

/** Attribute marking the element the WebGL particle dissolve captures. */
export const dissolveSourceAttribute = 'data-neoverse-dissolve';

/**
 * Attribute the engine sets on the freshly mounted region after the DOM
 * update; only it plays the delayed incoming entrance.
 */
export const incomingAttribute = 'data-neoverse-motion-incoming';

/** Attribute set on `<html>` while the WebGL particle dissolve is on screen. */
export const particleTransitionAttribute = 'data-neoverse-particle-transitioning';

/** Class of the fullscreen WebGL overlay canvas; always pointer-transparent. */
export const particleCanvasClassName = 'nv-particle-canvas';

/**
 * Which pipeline `dissolve` should run:
 * - `true` (default): auto — WebGL capture -> WebGL synthetic dust -> fade.
 * - `'capture'` / `'synthetic'`: force one WebGL texture source.
 * - `'crossfade'`: force the standard `fade` View Transition (no particles).
 * - `false`: no choreography — a plain DOM update.
 */
export type ParticlePipelinePreference = boolean | 'capture' | 'synthetic' | 'crossfade';

const particleEnterDelayProperty = '--neoverse-motion-particle-enter-delay';
const firstFrameTimeoutMs = 2000;
const particleHandoffBufferMs = 32;

let activeParticleDissolve: ParticleDissolveHandle | undefined;
let activeIncomingElement: HTMLElement | undefined;
let restoreIncomingDelay: (() => void) | undefined;

function clearActiveIncoming(): void {
  activeIncomingElement?.removeAttribute(incomingAttribute);
  restoreIncomingDelay?.();
  activeIncomingElement = undefined;
  restoreIncomingDelay = undefined;
}

function setActiveIncoming(element: HTMLElement, delayMs?: number): void {
  clearActiveIncoming();
  if (delayMs !== undefined) {
    const previousValue = element.style.getPropertyValue(particleEnterDelayProperty);
    const previousPriority = element.style.getPropertyPriority(particleEnterDelayProperty);
    element.style.setProperty(particleEnterDelayProperty, `${Math.max(0, delayMs)}ms`);
    restoreIncomingDelay = () => {
      if (previousValue) {
        element.style.setProperty(particleEnterDelayProperty, previousValue, previousPriority);
      } else {
        element.style.removeProperty(particleEnterDelayProperty);
      }
    };
  }
  element.setAttribute(incomingAttribute, '');
  activeIncomingElement = element;
}

async function waitForElementAnimations(element: Element): Promise<void> {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

  const animations = element
    .getAnimations()
    .filter((animation) => animation.playState !== 'finished');
  if (animations.length === 0) return;

  await Promise.allSettled(animations.map((animation) => animation.finished));
}

function findIncomingSource(
  previousSources: Set<Element>,
  fallbackSource: HTMLElement | null,
): HTMLElement | undefined {
  const currentSources =
    typeof document.querySelectorAll === 'function'
      ? [...document.querySelectorAll(`[${dissolveSourceAttribute}]`)]
      : [];
  return (
    currentSources.find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && !previousSources.has(element),
    ) ??
    (fallbackSource?.isConnected ? fallbackSource : undefined) ??
    currentSources.find((element): element is HTMLElement => element instanceof HTMLElement)
  );
}

export function clearActiveParticleDissolve(root: HTMLElement): void {
  activeParticleDissolve?.destroy();
  activeParticleDissolve = undefined;
  clearActiveIncoming();
  root.removeAttribute(particleTransitionAttribute);
}

export function hasReusableParticleDissolve(root: HTMLElement): boolean {
  return (
    activeParticleDissolve !== undefined &&
    !activeParticleDissolve.debug().destroyed &&
    root.hasAttribute(particleTransitionAttribute)
  );
}

export async function reuseActiveParticleDissolve(
  root: HTMLElement,
  source: HTMLElement | null,
  runUpdate: () => Promise<void>,
  superseded: () => boolean,
): Promise<void> {
  const runningParticle = activeParticleDissolve;
  if (runningParticle === undefined) return;
  const previousSources = new Set(document.querySelectorAll(`[${dissolveSourceAttribute}]`));
  try {
    await runUpdate();
    if (superseded()) return;

    const incoming = findIncomingSource(previousSources, source);
    if (incoming !== undefined) {
      const { durationMs, progress } = runningParticle.debug();
      const remainingMs = Math.max(0, durationMs * (1 - progress));
      setActiveIncoming(incoming, Math.ceil(remainingMs + particleHandoffBufferMs));
    }
    const incomingSettled =
      incoming === undefined ? Promise.resolve() : waitForElementAnimations(incoming);
    await Promise.all([runningParticle.settled, incomingSettled]);
  } finally {
    if (!superseded() && activeParticleDissolve === runningParticle) {
      clearActiveIncoming();
      runningParticle.destroy();
      activeParticleDissolve = undefined;
      root.removeAttribute(particleTransitionAttribute);
    }
  }
}

export async function runFreshParticleDissolve(
  root: HTMLElement,
  source: HTMLElement,
  particle: ParticlePipelinePreference,
  runUpdate: () => Promise<void>,
  superseded: () => boolean,
): Promise<boolean> {
  const handle = createParticleDissolve({
    source,
    mode: particle === 'capture' || particle === 'synthetic' ? particle : 'auto',
  });
  if (handle === null) return false;

  activeParticleDissolve = handle;
  document.body.append(handle.canvas);
  handle.play();
  const captured = await Promise.race([
    handle.firstFrame,
    new Promise<false>((resolve) => {
      window.setTimeout(() => resolve(false), firstFrameTimeoutMs);
    }),
  ]);
  if (superseded()) {
    handle.destroy();
    if (activeParticleDissolve === handle) activeParticleDissolve = undefined;
    return true;
  }
  if (!captured) {
    handle.destroy();
    if (activeParticleDissolve === handle) activeParticleDissolve = undefined;
    return false;
  }

  root.setAttribute(particleTransitionAttribute, '');
  try {
    const previousSources = new Set(document.querySelectorAll(`[${dissolveSourceAttribute}]`));
    await runUpdate();
    if (superseded()) return true;

    const incoming = findIncomingSource(previousSources, source);
    if (incoming !== undefined) {
      setActiveIncoming(incoming);
    }
    const incomingSettled =
      incoming === undefined ? Promise.resolve() : waitForElementAnimations(incoming);
    await Promise.all([handle.settled, incomingSettled]);
  } finally {
    if (!superseded()) {
      clearActiveIncoming();
      handle.destroy();
      if (activeParticleDissolve === handle) activeParticleDissolve = undefined;
      root.removeAttribute(particleTransitionAttribute);
    }
  }
  return true;
}
