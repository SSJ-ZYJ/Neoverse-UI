import { prefersReducedMotion } from '../foundation/reduced-motion.js';

type Point = { x: number; y: number };
type Slot = Point & { width: number; height: number };

type Flight = { animation: Animation; head: Point; tail: Point };
type CaretState = { slot: Slot; text: string; trail?: HTMLElement; flight: Flight | null };

const carets = new WeakMap<HTMLElement, CaretState>();
const steps = 12;

const curve = Array.from({ length: steps + 1 }, (_, step) => {
  const remaining = 1 - step / steps;
  return { head: 1 - remaining ** 5, tail: 1 - remaining ** 2.5 };
});

function interpolate(from: Point, to: Point, amount: number): Point {
  return { x: from.x + (to.x - from.x) * amount, y: from.y + (to.y - from.y) * amount };
}

// Resume at the same point on the piecewise-linear curve that the browser paints.
function sample(edge: 'head' | 'tail', time: number): number {
  const index = time * steps;
  const step = Math.floor(index);
  const start = curve[step]?.[edge] ?? 1;
  return start + ((curve[step + 1]?.[edge] ?? 1) - start) * (index - step);
}

function ribbon(head: Point, tail: Point, { width, height }: Slot): string {
  const left = head.x <= tail.x ? head : tail;
  const right = left === head ? tail : head;
  const top = head.y <= tail.y ? head : tail;
  const bottom = top === head ? tail : head;
  // The outline joins two upright bars, including when they have the same column.
  return `polygon(${top.x}px ${top.y}px, ${top.x + width}px ${top.y}px, ${right.x + width}px ${right.y}px, ${right.x + width}px ${right.y + height}px, ${bottom.x + width}px ${bottom.y + height}px, ${bottom.x}px ${bottom.y + height}px, ${left.x}px ${left.y + height}px, ${left.x}px ${left.y}px)`;
}

function durationFor(glyph: HTMLElement, travel: number): number {
  const raw = getComputedStyle(glyph)
    .getPropertyValue('--neoverse-motion-caret-glide-duration')
    .trim();
  const token = Number.parseFloat(raw) * (raw.endsWith('ms') ? 1 : 1000);
  const cap = Number.isFinite(token) && token > 0 ? token : 200;
  return Math.min(cap, Math.max(80, travel * 1.8));
}

function stopFlight(glyph: HTMLElement, state: CaretState): void {
  if (!state.flight || !state.trail) return;
  state.flight.animation.cancel();
  state.flight = null;
  state.trail.hidden = true;
  glyph.removeAttribute('data-neoverse-caret-moving');
}

/** Stretch the mirrored form caret toward its latest insertion slot */
export function syncCaretFlight(
  glyph: HTMLElement | null | undefined,
  text: string,
  reset: boolean,
): void {
  const frame = glyph?.closest<HTMLElement>('.ui-input-caret, .ui-textarea-caret');
  if (!glyph || !frame) return;
  const origin = frame.getBoundingClientRect();
  const box = glyph.getBoundingClientRect();
  const slot = {
    x: box.left - origin.left,
    y: box.top - origin.top,
    width: box.width,
    height: box.height,
  };
  const state = carets.get(glyph);
  if (!state) {
    carets.set(glyph, { slot, text, flight: null });
    return;
  }
  const previous = state.slot;
  const edited = state.text !== text;
  state.slot = slot;
  state.text = text;
  if (reset || edited || slot.width === 0 || prefersReducedMotion()) {
    stopFlight(glyph, state);
    return;
  }
  if (Math.hypot(slot.x - previous.x, slot.y - previous.y) <= 0.5) return;

  const active = state.flight;
  const time = active?.animation.effect?.getComputedTiming().progress ?? 0;
  const head = active ? interpolate(active.head, previous, sample('head', time)) : previous;
  const tail = active ? interpolate(active.tail, previous, sample('tail', time)) : previous;
  const travel = Math.max(
    Math.hypot(head.x - slot.x, head.y - slot.y),
    Math.hypot(tail.x - slot.x, tail.y - slot.y),
  );
  if (travel <= 0.5) {
    stopFlight(glyph, state);
    return;
  }

  let trail = state.trail;
  if (!trail) {
    trail = glyph.ownerDocument.createElement('span');
    trail.className = 'ui-caret-flight';
    state.trail = trail;
    frame.append(trail);
  }
  const frames = curve.map((progress, step) => ({
    offset: step / steps,
    clipPath: ribbon(
      interpolate(head, slot, progress.head),
      interpolate(tail, slot, progress.tail),
      slot,
    ),
  }));
  active?.animation.cancel();
  trail.hidden = false;
  const animation = trail.animate(frames, { duration: durationFor(glyph, travel), fill: 'both' });
  state.flight = { animation, head, tail };
  glyph.setAttribute('data-neoverse-caret-moving', '');
  animation.onfinish = () => {
    if (state.flight?.animation === animation) stopFlight(glyph, state);
  };
}
