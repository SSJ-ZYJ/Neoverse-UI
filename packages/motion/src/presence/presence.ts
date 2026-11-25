/**
 * Presence presets. Each value maps 1:1 to a CSS variant defined by the
 * presence engine (`[data-neoverse-motion='<variant>']`):
 *
 * - `fade`        dissolve in place
 * - `rise`        arrive from below / return downward
 * - `sink`        arrive from above / return upward
 * - `pop`         grow from the origin edge (popovers, spinners, checks)
 * - `veil`        de-blur into focus (glass surfaces materializing)
 * - `bloom`       grow out of a blurred field (soft materialize)
 * - `haze`        pull focus out of a heavier fog, slower and without travel
 * - `sway`        land slightly tilted, then settle upright
 * - `spring`      short travel on a curve that passes its endpoint once
 * - `slide-start` arrive from the inline start edge
 * - `slide-end`   arrive from the inline end edge
 */
export const presenceVariants = [
  'fade',
  'rise',
  'sink',
  'pop',
  'veil',
  'bloom',
  'haze',
  'sway',
  'spring',
  'slide-start',
  'slide-end',
] as const;

export type PresenceVariant = (typeof presenceVariants)[number];

/**
 * Declared fallback profiles, selected with `data-neoverse-motion-fallback`
 * on any ancestor of the transitioning elements:
 *
 * - `no-filter`  skip the blur passes; blur presets keep their arrival through
 *                scale instead. Applied automatically when the engine cannot
 *                blur, and available as an opt-out for low-power devices.
 * - `fade-only`  reproduce an engine without individual transform properties:
 *                every preset collapses to its opacity change.
 */
export const presenceFallbacks = ['no-filter', 'fade-only'] as const;

export type PresenceFallback = (typeof presenceFallbacks)[number];

/** Attribute selecting a fallback profile on an ancestor element. */
export const presenceFallbackAttribute = 'data-neoverse-motion-fallback';

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

/** Attribute pinning an open top-layer surface to its presence enter frame. */
export const presenceReplayAttribute = 'data-neoverse-motion-replay';

const presenceReplayFrames = new WeakMap<HTMLElement, number>();

/**
 * Replay the shared presence entrance on an already-open top-layer surface.
 * `@starting-style` only seeds the first rendered frame, so content swaps and
 * touch opens pin the enter frame for one frame before releasing it into the
 * same enter transition; the exit transition stays owned by `.nv-presence`.
 */
export function replayPresence(element: HTMLElement): void {
  const view = element.ownerDocument.defaultView;
  if (view === null) return;

  const pending = presenceReplayFrames.get(element);
  if (pending !== undefined) view.cancelAnimationFrame(pending);
  element.setAttribute(presenceReplayAttribute, 'from');
  // Releasing the pin in this task would collapse both style states into one
  // recalculation and no transition would start.
  void element.offsetWidth;
  const frame = view.requestAnimationFrame(() => {
    presenceReplayFrames.delete(element);
    element.removeAttribute(presenceReplayAttribute);
  });
  presenceReplayFrames.set(element, frame);
}

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
