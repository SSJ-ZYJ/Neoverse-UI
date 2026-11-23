import { expect, test } from 'bun:test';

import { slideCaret } from './caret-motion.js';

type FakeGlyph = Record<string, string>;

function createGlyph(
  left: number,
  bar = 6,
): {
  glyph: HTMLElement;
  state: FakeGlyph;
  writes: Array<{ property: string; value: string }>;
  reflows: () => number;
} {
  const style: Record<string, string> = {};
  const writes: Array<{ property: string; value: string }> = [];
  const trackedStyle = new Proxy(style, {
    set(target, property, value) {
      if (typeof property === 'string') {
        writes.push({ property, value: String(value) });
      }
      Reflect.set(target, property, value);
      return true;
    },
  });
  let reflows = 0;
  const glyph = {
    getBoundingClientRect: () => ({ left, width: bar }),
    get offsetWidth() {
      reflows += 1;
      return 100;
    },
    style: trackedStyle,
  };
  return {
    glyph: glyph as unknown as HTMLElement,
    state: style,
    writes,
    reflows: () => reflows,
  };
}

function withMotionTokens(token: string, run: (timers: Array<() => void>) => void): void {
  const originalStyle = globalThis.getComputedStyle;
  const originalTimer = globalThis.setTimeout;
  const originalClearTimer = globalThis.clearTimeout;
  const timers: Array<() => void> = [];
  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    value: () => ({ getPropertyValue: () => token }),
  });
  Object.defineProperty(globalThis, 'setTimeout', {
    configurable: true,
    value: (callback: () => void) => {
      timers.push(callback);
      return timers.length;
    },
  });
  Object.defineProperty(globalThis, 'clearTimeout', {
    configurable: true,
    value: () => undefined,
  });
  try {
    run(timers);
  } finally {
    Object.defineProperty(globalThis, 'getComputedStyle', {
      configurable: true,
      value: originalStyle,
    });
    Object.defineProperty(globalThis, 'setTimeout', {
      configurable: true,
      value: originalTimer,
    });
    Object.defineProperty(globalThis, 'clearTimeout', {
      configurable: true,
      value: originalClearTimer,
    });
  }
}

test('the first sample records the glyph position without animating', () => {
  const { glyph, state } = createGlyph(120);
  expect(slideCaret(glyph, null, 'hello', false)).toBe(120);
  expect(state.transform).toBe('');
  expect(state.width).toBe('');
  expect(state.transitionDuration).toBe('');
});

test('a travelled caret glides from the previous position without stretching', () => {
  withMotionTokens('200ms', (timers) => {
    const { glyph, state, writes, reflows } = createGlyph(140);
    slideCaret(glyph, null, 'hello', false);
    expect(slideCaret(glyph, 100, 'hello', false)).toBe(140);
    expect(state.width).toBe('');
    expect(state.transform).toBe('');
    expect(state.transitionDuration).toBe('110ms');
    expect(state.animationName).toBe('none');
    expect(reflows()).toBe(1);
    expect(timers).toHaveLength(1);
    expect(writes).toContainEqual({ property: 'transform', value: 'translateX(-40px)' });
    expect(writes.some(({ property, value }) => property === 'width' && value !== '')).toBe(false);

    timers[0]?.();
    expect(state.animationName).toBe('');
  });
});

test('small movements and unchanged text stay in the shared transition path', () => {
  const { glyph, state } = createGlyph(100);
  slideCaret(glyph, null, 'same', false);
  slideCaret(glyph, 100.2, 'same', false);
  expect(state.width).toBe('');
  expect(state.transitionDuration).toBe('');
});

test('edited text and scroll jumps never leave a trailing caret', () => {
  const { glyph, state } = createGlyph(140);
  slideCaret(glyph, null, 'before', false);
  slideCaret(glyph, 100, 'after', false);
  expect(state.transform).toBe('');
  expect(state.transitionDuration).toBe('');

  const scrolled = createGlyph(300);
  slideCaret(scrolled.glyph, null, 'same', false);
  slideCaret(scrolled.glyph, 100, 'same', true);
  expect(scrolled.state.transform).toBe('');
  expect(scrolled.state.transitionDuration).toBe('');
});

test('the token caps long travel and falls back when the duration is invalid', () => {
  withMotionTokens('120ms', () => {
    const capped = createGlyph(940);
    slideCaret(capped.glyph, null, 'same', false);
    slideCaret(capped.glyph, 100, 'same', false);
    expect(capped.state.transitionDuration).toBe('120ms');
  });

  withMotionTokens('', () => {
    const fallback = createGlyph(940);
    slideCaret(fallback.glyph, null, 'same', false);
    slideCaret(fallback.glyph, 100, 'same', false);
    expect(fallback.state.transitionDuration).toBe('320ms');
  });
});

test('a missing glyph is a no-op', () => {
  expect(slideCaret(null, 100, 'text', false)).toBeNull();
  expect(slideCaret(undefined, 100, 'text', false)).toBeNull();
});
