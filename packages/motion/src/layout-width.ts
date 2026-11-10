/**
 * Width reconciliation for a group of boxes whose content changes size.
 *
 * Switching a language, theme, or label can change how much room a group of
 * boxes needs. Sampling every box before the update and animating from the
 * sampled width to the natural one keeps the whole group on one curve instead
 * of letting each box — or the grid around them — jump to its new size.
 *
 * Two phases are required because the natural width only exists after the DOM
 * has updated:
 *
 * ```ts
 * const samples = captureLayoutWidths(elements); // before the content swap
 * // …swap the content…
 * animateLayoutWidths(samples);                  // after the content swap
 * ```
 *
 * The animation uses the `spatial` role, is written as a `width` keyframe pair
 * so a running animation can be sampled again mid-flight, and releases its fill
 * as soon as it ends so the box returns to automatic sizing. Boxes that grow
 * keep their replacement copy on one line for the duration of the run; longer
 * text is clipped until the width catches up instead of wrapping and changing
 * the box height mid-animation.
 */

import { motionRoles } from './motion-tokens';
import { prefersReducedMotion } from './reduced-motion';

/** One box's rendered width, sampled before a layout-changing update. */
export interface LayoutWidthSample {
  readonly element: Element;
  readonly width: string;
}

export interface LayoutWidthOptions {
  /** Widths within this many CSS pixels count as unchanged. Defaults to `0.5`. */
  readonly tolerance?: number;
}

/** A running set of width animations for one layout group. */
export interface LayoutWidthAnimation {
  /** The animations that actually run; empty when no box changed width. */
  readonly animations: readonly Animation[];
  /** Settles once every animation has finished or been canceled. */
  readonly finished: Promise<void>;
  /** Stop the animations now; the boxes fall back to their natural widths. */
  cancel(): void;
}

const defaultTolerance = 0.5;

/**
 * Read a CSS time token. Unitless values only count when they are zero, so a
 * missing or malformed token resolves to `0` and the caller skips the motion.
 */
function readTime(value: string): number {
  const trimmed = value.trim();
  const amount = Number.parseFloat(trimmed);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  if (trimmed.endsWith('ms')) return amount;
  if (trimmed.endsWith('s')) return amount * 1000;
  return 0;
}

function computedStyleOf(element: Element): CSSStyleDeclaration | undefined {
  return typeof getComputedStyle === 'function' ? getComputedStyle(element) : undefined;
}

/**
 * Keep longer replacement copy on one line while its box grows.
 *
 * The animation starts at the old, narrower width even though the content has
 * already been replaced. Without this lock the new copy wraps inside the box,
 * raising its height and shoving the surrounding layout until the width catches
 * up — the visible "wrap then unwrap" hitch on a narrow-to-wide language switch.
 * Clipping reveals the copy as the box opens instead of painting it outside the
 * border. Only expanding boxes need the lock; it is released when the run ends
 * or is canceled, so the consumer's own inline styles are never overwritten.
 */
function lockContentWrapping(element: Element): (() => void) | undefined {
  const style = (element as HTMLElement).style;
  if (style === undefined || typeof style.setProperty !== 'function') return undefined;
  const whiteSpace = style.getPropertyValue('white-space');
  const whiteSpacePriority = style.getPropertyPriority('white-space');
  const overflow = style.getPropertyValue('overflow');
  const overflowPriority = style.getPropertyPriority('overflow');
  style.setProperty('white-space', 'nowrap');
  style.setProperty('overflow', 'clip');
  return () => {
    if (whiteSpace === '') style.removeProperty('white-space');
    else style.setProperty('white-space', whiteSpace, whiteSpacePriority);
    if (overflow === '') style.removeProperty('overflow');
    else style.setProperty('overflow', overflow, overflowPriority);
  };
}

function idle(): LayoutWidthAnimation {
  return { animations: [], finished: Promise.resolve(), cancel: () => undefined };
}

/**
 * Sample the rendered width of every box that is currently laid out.
 *
 * Elements without client rects — `display: none`, a collapsed breakpoint, or a
 * detached node — are skipped, so a box that is not on screen never becomes an
 * animation target when it appears.
 */
export function captureLayoutWidths(
  elements: Iterable<Element | null | undefined>,
): LayoutWidthSample[] {
  const samples: LayoutWidthSample[] = [];
  for (const element of elements) {
    if (element === null || element === undefined) continue;
    if (element.getClientRects().length === 0) continue;
    const style = computedStyleOf(element);
    if (style === undefined) continue;
    samples.push({ element, width: style.width });
  }
  return samples;
}

/**
 * Animate every sampled box from its captured width to its current width.
 *
 * All natural endpoints are resolved before the first animation starts:
 * animating one box changes the surrounding grid, which would otherwise skew
 * the endpoint read for the boxes that follow. A box whose width did not change
 * (within `tolerance`) is left alone, and the whole call is a no-op under
 * reduced motion or without the Web Animations API.
 *
 * Calling this again while a previous run is live continues from the frame that
 * run reached, because the captured width is read from the animated style.
 */
export function animateLayoutWidths(
  samples: readonly LayoutWidthSample[],
  options: LayoutWidthOptions = {},
): LayoutWidthAnimation {
  if (samples.length === 0 || prefersReducedMotion()) return idle();
  const tolerance = options.tolerance ?? defaultTolerance;
  const targets: {
    element: Element;
    from: string;
    to: string;
    duration: number;
    easing: string;
  }[] = [];
  for (const { element, width } of samples) {
    const style = computedStyleOf(element);
    if (style === undefined) continue;
    targets.push({
      element,
      from: width,
      to: style.width,
      duration: readTime(style.getPropertyValue(motionRoles.spatial.duration)),
      easing: style.getPropertyValue(motionRoles.spatial.easing).trim(),
    });
  }

  const pending: {
    element: Element;
    from: string;
    to: string;
    duration: number;
    easing: string;
    expanding: boolean;
    restore: (() => void) | undefined;
  }[] = [];
  for (const { element, from, to, duration, easing } of targets) {
    if (typeof element.animate !== 'function') continue;
    const delta = Number.parseFloat(to) - Number.parseFloat(from);
    if (!Number.isFinite(delta) || Math.abs(delta) < tolerance) continue;
    if (duration <= 0) continue;
    pending.push({ element, from, to, duration, easing, expanding: delta > 0, restore: undefined });
  }

  if (pending.length === 0) return idle();

  // Lock every expanding box before the first animation changes the grid, so no
  // box briefly lays out its new copy at a width it is about to grow out of.
  for (const target of pending) {
    if (target.expanding) target.restore = lockContentWrapping(target.element);
  }

  const animations: Animation[] = [];
  const releases: Array<(() => void) | undefined> = [];
  for (const { element, from, to, duration, easing, restore } of pending) {
    const animation = element.animate([{ width: from }, { width: to }], {
      duration,
      fill: 'both',
      ...(easing === '' ? {} : { easing }),
    });
    const index = animations.length;
    animations.push(animation);
    /* Release the fill so the box returns to automatic sizing; the final frame
       already matches the natural width, so nothing moves when the fill drops. */
    const release = () => {
      if (releases[index] === undefined) return;
      releases[index] = undefined;
      restore?.();
      animation.cancel();
    };
    releases[index] = release;
    void animation.finished.then(release, release);
  }

  return {
    animations,
    finished: Promise.allSettled(animations.map((animation) => animation.finished)).then(
      () => undefined,
    ),
    cancel: () => {
      // Synchronous restore matters: the caller samples this same frame before
      // the DOM update, and the next run must read unmodified natural widths.
      for (const release of releases) release?.();
    },
  };
}
