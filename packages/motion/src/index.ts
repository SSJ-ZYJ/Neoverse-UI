/**
 * @neoverse-ui/motion — the single motion contract for Neoverse UI.
 *
 * Everything animated in the library resolves to the tokens and the presence
 * engine shipped here (`@neoverse-ui/motion/css`). Components never hardcode
 * durations, easings, or keyframes for presence: they declare *which* role or
 * preset they need, and this package decides how it moves.
 */

import { createParticleDissolve, type ParticleDissolveHandle } from './particle-dissolve';
import { prefersReducedMotion } from './reduced-motion';

export const motionDurations = {
  fast: '140ms',
  standard: '240ms',
  expressive: '420ms',
} as const;

export const motionEasings = {
  linear: 'linear',
  standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
  accelerate: 'cubic-bezier(0.5, 0, 0.75, 0)',
} as const;

export const motionDistances = {
  near: '--neoverse-motion-distance-near',
  mid: '--neoverse-motion-distance-mid',
  far: '--neoverse-motion-distance-far',
} as const;

export const motionRoles = {
  feedback: {
    duration: '--neoverse-motion-feedback-duration',
    easing: '--neoverse-motion-feedback-easing',
  },
  state: {
    duration: '--neoverse-motion-state-duration',
    easing: '--neoverse-motion-state-easing',
  },
  spatial: {
    duration: '--neoverse-motion-spatial-duration',
    easing: '--neoverse-motion-spatial-easing',
  },
  enter: {
    duration: '--neoverse-motion-enter-duration',
    easing: '--neoverse-motion-enter-easing',
  },
  exit: {
    duration: '--neoverse-motion-exit-duration',
    easing: '--neoverse-motion-exit-easing',
  },
} as const;

/**
 * Presence presets. Each value maps 1:1 to a CSS variant defined by the
 * presence engine (`[data-neoverse-motion='<variant>']`):
 *
 * - `fade`        dissolve in place
 * - `rise`        arrive from below / return downward
 * - `sink`        arrive from above / return upward
 * - `pop`         grow from the origin edge (popovers, spinners, checks)
 * - `veil`        de-blur into focus (glass surfaces materializing)
 * - `slide-start` arrive from the inline start edge
 * - `slide-end`   arrive from the inline end edge
 */
export const presenceVariants = [
  'fade',
  'rise',
  'sink',
  'pop',
  'veil',
  'slide-start',
  'slide-end',
] as const;

export type PresenceVariant = (typeof presenceVariants)[number];

export type MotionDuration = keyof typeof motionDurations;
export type MotionEasing = keyof typeof motionEasings;
export type MotionDistance = keyof typeof motionDistances;
export type MotionRole = keyof typeof motionRoles;

export type PresenceOrigin = 'top' | 'bottom' | 'start' | 'end';

/** Vue `<Transition>` / `<TransitionGroup name>` value bound to the engine. */
export const presenceTransitionName = 'nv';

/** Attribute selecting the presence preset on the transitioning element. */
export const presenceDataAttribute = 'data-neoverse-motion';

/** Attribute pointing the growth origin at the edge that launched the element. */
export const presenceOriginAttribute = 'data-neoverse-motion-origin';

/** Class names applied by the presence engine; adapters never invent their own. */
export const presenceClassNames = {
  enterFrom: 'nv-enter-from',
  enterActive: 'nv-enter-active',
  enterTo: 'nv-enter-to',
  leaveFrom: 'nv-leave-from',
  leaveActive: 'nv-leave-active',
  leaveTo: 'nv-leave-to',
  move: 'nv-move',
} as const;

/** Attribute enabling zero-JS enter/exit on top-layer popover surfaces. */
export const presenceLayerClassName = 'nv-presence';

/**
 * Class for mount-time entrances: the element plays its preset the moment it
 * is first rendered (spinner swap, check marks, tooltips), no adapter needed.
 */
export const presenceAppearClassName = 'nv-appear';

/**
 * Class for animation-driven exits (React presence): add it while waiting for
 * animationend, then unmount. Declared after the appear class in CSS so it
 * wins when both are present.
 */
export const presenceVanishClassName = 'nv-vanish';

/** Attribute set on `<html>` while a startViewTransition() capture is live. */
export const viewTransitionAttribute = 'data-neoverse-view-transitioning';

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
 * Which choreography startViewTransition should run:
 * - `true` (default): auto — WebGL capture → WebGL synthetic dust → crossfade.
 * - `'capture'` / `'synthetic'`: force one WebGL texture source.
 * - `'crossfade'`: force the plain View Transition crossfade (no particles).
 * - `false`: no choreography — a plain DOM update.
 */
export type ParticlePipelinePreference = boolean | 'capture' | 'synthetic' | 'crossfade';

export type {
  ParticleDissolveDebugState,
  ParticleDissolveHandle,
  ParticleDissolveMode,
  ParticleDissolveOptions,
  ParticleDissolvePreset,
  ParticleDissolvePresetName,
} from './particle-dissolve';
export {
  createParticleDissolve,
  particleDissolvePresets,
  prewarmParticleDissolve,
  supportsParticleCapture,
  supportsParticleDissolve,
} from './particle-dissolve';
export { prefersReducedMotion } from './reduced-motion';

export interface ViewTransitionOptions {
  /** Skip the animation entirely under prefers-reduced-motion (DOM update still runs). */
  respectReducedMotion?: boolean;
  /** Which choreography to run; see {@link ParticlePipelinePreference}. */
  particle?: ParticlePipelinePreference;
  /** Element captured into particles; defaults to the [data-neoverse-dissolve] element. */
  dissolveSource?: HTMLElement | null;
}

/** The view transition currently animating for this document, if any. */
let activeViewTransition: ViewTransition | undefined;
/** The particle dissolve currently on screen, if any. */
let activeParticleDissolve: ParticleDissolveHandle | undefined;
/** The incoming region currently fading beneath the active dissolve. */
let activeIncomingElement: HTMLElement | undefined;
let restoreIncomingDelay: (() => void) | undefined;

const particleEnterDelayProperty = '--neoverse-motion-particle-enter-delay';

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

function cancelActiveChoreography(root: HTMLElement): void {
  activeParticleDissolve?.destroy();
  activeParticleDissolve = undefined;
  activeViewTransition?.skipTransition();
  activeViewTransition = undefined;
  clearActiveIncoming();
  root.removeAttribute(particleTransitionAttribute);
  root.removeAttribute(viewTransitionAttribute);
}

/** How long to wait for the particle capture before falling back; cloning and
 * first-painting a large region can take real time on slower machines. */
const firstFrameTimeoutMs = 2000;
/** Let the final particle frame clear before an interrupted page starts fading in. */
const particleHandoffBufferMs = 32;

/** Monotonic counter; only the newest startViewTransition call owns the screen. */
let transitionRequest = 0;

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

/**
 * Run a DOM update so the change reads as one continuous shot instead of a
 * hard cut. Resolves once the choreography finishes; a plain update runs when
 * the API or motion is unavailable.
 *
 * Choreography, in order of preference:
 * 1. WebGL particle dissolve — the leaving region is captured through the
 *    official HTML-in-Canvas API (or synthesized as theme-colored dust) and
 *    erodes into fine dust while the update swaps content underneath and the
 *    incoming region fades in late, or after the remaining particles on retry.
 * 2. Crossfade — without WebGL2 the View Transition's own crossfade runs,
 *    timed by the spatial role.
 *
 * Interruption: a visible particle dissolve keeps its canvas and progress;
 * the newest page fades in after the remaining particles clear. Pending
 * captures and crossfades are canceled, so rapid navigation never queues.
 * The overlay is pointer-transparent while the old page is dissolving.
 *
 * Shared elements stay put by giving them `view-transition-name` in CSS —
 * from-where-it-was to-where-it-goes is then handled by the browser.
 */
export async function startViewTransition(
  update: () => void | Promise<void>,
  options: ViewTransitionOptions = {},
): Promise<void> {
  const { respectReducedMotion = true, particle = true, dissolveSource } = options;

  const runUpdate = (): Promise<void> => Promise.resolve(update()).then(() => undefined);

  if (typeof document === 'undefined') {
    return runUpdate();
  }

  const root = document.documentElement;
  const request = ++transitionRequest;
  /* Only the newest request owns cleanup. Older callers may still be awaiting
     the shared dissolve, but they must not remove the new page's entrance or
     the particle layer after an interruption. */
  const superseded = (): boolean => request !== transitionRequest;

  if (respectReducedMotion && prefersReducedMotion()) {
    cancelActiveChoreography(root);
    return runUpdate();
  }

  if (particle === false) {
    cancelActiveChoreography(root);
    return runUpdate();
  }

  const source =
    dissolveSource ??
    (document.querySelector(`[${dissolveSourceAttribute}]`) as HTMLElement | null);
  const findIncoming = (previousSources: Set<Element>): HTMLElement | undefined => {
    const currentSources = [...document.querySelectorAll(`[${dissolveSourceAttribute}]`)];
    return (
      currentSources.find(
        (element): element is HTMLElement =>
          element instanceof HTMLElement && !previousSources.has(element),
      ) ??
      (source?.isConnected ? source : undefined) ??
      currentSources.find((element): element is HTMLElement => element instanceof HTMLElement)
    );
  };

  /* A visible dissolve already owns the particle layer. Keep its canvas and
     progress when another page update arrives; only replace the incoming
     content and restart that content's fade from opacity 0. */
  const runningParticle = activeParticleDissolve;
  if (
    particle !== 'crossfade' &&
    runningParticle !== undefined &&
    !runningParticle.debug().destroyed &&
    root.hasAttribute(particleTransitionAttribute)
  ) {
    activeViewTransition?.skipTransition();
    activeViewTransition = undefined;
    const previousSources = new Set(document.querySelectorAll(`[${dissolveSourceAttribute}]`));
    try {
      await runUpdate();
      if (superseded()) return;

      const incoming = findIncoming(previousSources);
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
    return;
  }

  /* Starting a fresh pipeline (or switching to crossfade) cancels the prior
     one. A captured, visible particle dissolve took the reuse path above. */
  cancelActiveChoreography(root);

  if (particle !== 'crossfade' && source !== null) {
    const handle = createParticleDissolve({
      source,
      mode: particle === 'capture' || particle === 'synthetic' ? particle : 'auto',
    });
    if (handle !== null) {
      activeParticleDissolve = handle;
      /* Show the captured frame first, start the dissolve, and only then
         swap the DOM underneath — the overlay covers the swap with the old
         region still on screen. A capture that never paints (broken engine)
         times out into the CSS fallback instead of swallowing the click.
         The transitioning attribute is set only after the capture is
         confirmed: the capture clone carries data-neoverse-dissolve too,
         and the attribute would let the incoming-enter animation freeze
         the clone at opacity 0 — an empty texture. */
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
        if (activeParticleDissolve === handle) {
          activeParticleDissolve = undefined;
        }
        return;
      }
      if (captured) {
        root.setAttribute(particleTransitionAttribute, '');
        try {
          /* Prefer a newly mounted source, but fade the original region if the
             framework reused its dissolve root for the new page content. */
          const previousSources = new Set(
            document.querySelectorAll(`[${dissolveSourceAttribute}]`),
          );
          await runUpdate();
          if (superseded()) return;

          const incoming = findIncoming(previousSources);
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
            if (activeParticleDissolve === handle) {
              activeParticleDissolve = undefined;
            }
            root.removeAttribute(particleTransitionAttribute);
          }
        }
        return;
      }
      handle.destroy();
      if (activeParticleDissolve === handle) {
        activeParticleDissolve = undefined;
      }
    }
  }

  if (superseded()) {
    return;
  }

  if (typeof document.startViewTransition !== 'function') {
    return runUpdate();
  }

  /* Terminal fallback: the View Transition's own crossfade, timed by the
     spatial role through the engine CSS. */
  root.setAttribute(viewTransitionAttribute, '');
  const transition = document.startViewTransition(runUpdate);
  activeViewTransition = transition;

  return transition.finished.finally(() => {
    if (superseded()) {
      return;
    }
    if (activeViewTransition === transition) {
      activeViewTransition = undefined;
    }
    root.removeAttribute(viewTransitionAttribute);
  });
}

/**
 * Stagger helper for `<TransitionGroup>` lists. Bind the returned style map
 * with the child's index so siblings enter in a wave while exits stay
 * immediate (exiting should never feel queued).
 */
export function presenceStagger(index: number, options: { step?: number; max?: number } = {}) {
  const { step = 40, max = 12 } = options;
  const delay = Math.min(Math.max(index, 0), max) * step;

  return delay === 0 ? {} : ({ '--neoverse-motion-enter-delay': `${delay}ms` } as const);
}
