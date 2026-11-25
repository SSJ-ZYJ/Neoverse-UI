import { motionDurations, motionEasings, motionRoles } from '../foundation/motion-tokens.js';
import { prefersReducedMotion } from '../foundation/reduced-motion.js';

/**
 * Height animation for one disclosure region whose content stays mounted.
 *
 * The helper owns the collapsed DOM state as well as the animation: while
 * closing it marks the region inert and aria-hidden immediately, animates the
 * rendered height to zero, then applies `hidden`. Opening removes those guards
 * before measuring the natural height. Interrupted runs continue from the
 * height currently on screen, and inline height/overflow styles are restored
 * when the run settles. Under reduced motion, or without the Web Animations
 * API, the target state is applied immediately.
 */

export interface DisclosureMotionOptions {
  /** `false` applies the target state without animating (initial mount). */
  readonly animate?: boolean;
  /** CSS time for this run; defaults to the `state` role duration. */
  readonly duration?: string;
  /** Easing for this run; defaults to the `state` role easing. */
  readonly easing?: string;
}

export interface DisclosureAnimation {
  /** Settles when the run finishes, is replaced, or is canceled. */
  readonly finished: Promise<void>;
  /** Stop now at the current rendered height; the region stays visible. */
  cancel(): void;
}

interface ActiveDisclosure {
  readonly animation: Animation;
  readonly expanded: boolean;
}

interface InlineSnapshot {
  readonly height: string;
  readonly heightPriority: string;
  readonly overflow: string;
  readonly overflowPriority: string;
}

const active = new WeakMap<HTMLElement, ActiveDisclosure>();
const inlineStates = new WeakMap<HTMLElement, InlineSnapshot>();

function settle(element: HTMLElement, expanded: boolean): void {
  const snapshot = inlineStates.get(element);
  if (snapshot !== undefined) {
    inlineStates.delete(element);
    if (snapshot.height === '') element.style.removeProperty('height');
    else element.style.setProperty('height', snapshot.height, snapshot.heightPriority);
    if (snapshot.overflow === '') element.style.removeProperty('overflow');
    else element.style.setProperty('overflow', snapshot.overflow, snapshot.overflowPriority);
  }
  if (expanded) {
    element.hidden = false;
    element.removeAttribute('inert');
    element.removeAttribute('aria-hidden');
    return;
  }
  element.hidden = true;
  element.setAttribute('inert', '');
  element.setAttribute('aria-hidden', 'true');
}

function rememberInline(element: HTMLElement): void {
  if (inlineStates.has(element)) return;
  inlineStates.set(element, {
    height: element.style.getPropertyValue('height'),
    heightPriority: element.style.getPropertyPriority('height'),
    overflow: element.style.getPropertyValue('overflow'),
    overflowPriority: element.style.getPropertyPriority('overflow'),
  });
}

function readTime(value: string): number {
  const trimmed = value.trim();
  const amount = Number.parseFloat(trimmed);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  if (trimmed.endsWith('ms')) return amount;
  if (trimmed.endsWith('s')) return amount * 1000;
  return 0;
}

function resolveTiming(
  element: HTMLElement,
  options: DisclosureMotionOptions,
): { duration: number; easing: string } {
  const style = typeof getComputedStyle === 'function' ? getComputedStyle(element) : undefined;
  const durationValue =
    options.duration ??
    style?.getPropertyValue(motionRoles.state.duration) ??
    motionDurations.standard;
  const easingValue =
    options.easing ?? style?.getPropertyValue(motionRoles.state.easing) ?? motionEasings.standard;
  return { duration: readTime(durationValue), easing: easingValue.trim() };
}

function visibleHeight(element: HTMLElement): number {
  return element.getBoundingClientRect().height;
}

const idle: DisclosureAnimation = {
  finished: Promise.resolve(),
  cancel: () => undefined,
};

/**
 * Animate a mounted disclosure region to its open or closed height.
 *
 * The caller only supplies the region and target state; the helper handles
 * `hidden`, `inert`, `aria-hidden`, natural-height measurement, interruption,
 * and inline style restoration. Call it again with the opposite target while a
 * run is live to continue from the frame currently on screen.
 */
export function animateDisclosure(
  element: HTMLElement,
  expanded: boolean,
  options: DisclosureMotionOptions = {},
): DisclosureAnimation {
  const previous = active.get(element);
  const from = previous === undefined ? undefined : visibleHeight(element);
  if (previous !== undefined) {
    active.delete(element);
    previous.animation.cancel();
  }
  const wasHidden = element.hidden;

  if (expanded) {
    element.hidden = false;
    element.removeAttribute('inert');
    element.removeAttribute('aria-hidden');
  } else if (wasHidden) {
    settle(element, false);
    return idle;
  }

  const { duration, easing } = resolveTiming(element, options);
  if (options.animate === false || duration <= 0 || typeof element.animate !== 'function') {
    settle(element, expanded);
    return idle;
  }
  if (prefersReducedMotion()) {
    settle(element, expanded);
    return idle;
  }

  if (expanded) {
    const start = from ?? (wasHidden ? 0 : visibleHeight(element));
    rememberInline(element);
    element.style.setProperty('overflow', 'hidden');
    element.style.setProperty('height', `${start}px`);
    const target = element.scrollHeight;
    if (target <= 0 || Math.abs(target - start) < 0.5) {
      settle(element, true);
      return idle;
    }
    const animation = element.animate([{ height: `${start}px` }, { height: `${target}px` }], {
      duration,
      ...(easing === '' ? {} : { easing }),
      fill: 'both',
    });
    return track(element, animation, true);
  }

  const current = from ?? visibleHeight(element);
  rememberInline(element);
  element.style.setProperty('height', `${current}px`);
  element.style.setProperty('overflow', 'hidden');
  element.setAttribute('inert', '');
  element.setAttribute('aria-hidden', 'true');
  if (current <= 0) {
    settle(element, false);
    return idle;
  }
  const animation = element.animate([{ height: `${current}px` }, { height: '0px' }], {
    duration,
    ...(easing === '' ? {} : { easing }),
    fill: 'both',
  });
  return track(element, animation, false);
}

function track(element: HTMLElement, animation: Animation, expanded: boolean): DisclosureAnimation {
  const record: ActiveDisclosure = { animation, expanded };
  active.set(element, record);
  const finished = animation.finished.then(
    () => {
      if (active.get(element) !== record) return;
      active.delete(element);
      settle(element, expanded);
      // Release the fill; the settled inline styles already match the final frame.
      animation.cancel();
    },
    () => undefined,
  );
  return {
    finished,
    cancel() {
      if (active.get(element) !== record) return;
      active.delete(element);
      animation.cancel();
    },
  };
}
