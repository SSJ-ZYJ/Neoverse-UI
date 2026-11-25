import { afterEach, beforeEach, expect, test } from 'bun:test';

import { animateDisclosure } from './index.js';

type FakeGlobal = Record<string, unknown>;

interface Recording {
  readonly keyframes: Keyframe[];
  readonly timing: KeyframeAnimationOptions;
}

interface FakeAnimation {
  readonly finished: Promise<void>;
  cancel(): void;
  settle(): void;
}

interface FakeElement {
  hidden: boolean;
  readonly scrollHeight: number;
  readonly style: CSSStyleDeclaration;
  readonly attributes: Set<string>;
  rectHeight: number;
  readonly animations: FakeAnimation[];
  readonly getBoundingClientRect: () => { height: number };
  readonly animate: (keyframes: Keyframe[], timing: KeyframeAnimationOptions) => Animation;
  readonly setAttribute: (name: string, value?: string) => void;
  readonly removeAttribute: (name: string) => void;
  readonly getAttribute: (name: string) => string | null;
}

let recorded: Recording[] = [];
const originalGetComputedStyle = (globalThis as FakeGlobal).getComputedStyle;
const originalWindow = (globalThis as FakeGlobal).window;

beforeEach(() => {
  recorded = [];
});

afterEach(() => {
  (globalThis as FakeGlobal).getComputedStyle = originalGetComputedStyle;
  (globalThis as FakeGlobal).window = originalWindow;
});

function installTiming(overrides: { duration?: string; easing?: string } = {}): void {
  (globalThis as FakeGlobal).getComputedStyle = () =>
    ({
      getPropertyValue: (name: string) =>
        name === '--neoverse-motion-state-duration'
          ? (overrides.duration ?? '240ms')
          : name === '--neoverse-motion-state-easing'
            ? (overrides.easing ?? 'cubic-bezier(0.22, 1, 0.36, 1)')
            : '',
    }) as CSSStyleDeclaration;
  (globalThis as FakeGlobal).window = {
    matchMedia: () => ({ matches: false }),
  };
}

function createElement(
  options: { hidden?: boolean; height?: number; inlineHeight?: string } = {},
): {
  element: HTMLElement;
  fake: FakeElement;
} {
  const attributes = new Set<string>();
  const value = new Map<string, string>();
  const fake: FakeElement = {
    hidden: options.hidden ?? false,
    scrollHeight: options.height ?? 120,
    rectHeight: options.height ?? 120,
    attributes,
    animations: [],
    style: {
      getPropertyValue: (name: string) => value.get(name) ?? '',
      getPropertyPriority: () => '',
      setProperty: (name: string, next: string) => value.set(name, next),
      removeProperty: (name: string) => value.delete(name),
    } as unknown as CSSStyleDeclaration,
    getBoundingClientRect: () => ({ height: fake.hidden ? 0 : fake.rectHeight }),
    animate: (keyframes: Keyframe[], timing: KeyframeAnimationOptions) => {
      const settled = Promise.withResolvers<void>();
      const animation: FakeAnimation = {
        finished: settled.promise,
        settle: () => settled.resolve(),
        cancel: () => settled.reject(new DOMException('canceled', 'AbortError')),
      };
      fake.animations.push(animation);
      recorded.push({ keyframes, timing });
      return animation as unknown as Animation;
    },
    setAttribute: (name: string, next = '') => {
      attributes.add(name);
      if (name === 'hidden') fake.hidden = true;
      if (name === 'aria-hidden') attributes.add(name);
      value.set(`attr:${name}`, next);
    },
    removeAttribute: (name: string) => {
      attributes.delete(name);
      value.delete(`attr:${name}`);
      if (name === 'hidden') fake.hidden = false;
    },
    getAttribute: (name: string) =>
      attributes.has(name) ? (value.get(`attr:${name}`) ?? '') : null,
  };
  if (options.hidden === true) attributes.add('hidden');
  if (options.inlineHeight !== undefined) value.set('height', options.inlineHeight);
  return { element: fake as unknown as HTMLElement, fake };
}

test('expands from zero to the natural height and releases its inline styles', async () => {
  installTiming();
  const { element, fake } = createElement({ hidden: true, height: 120 });
  const animation = animateDisclosure(element, true);

  expect(fake.hidden).toBe(false);
  expect(recorded).toHaveLength(1);
  expect(recorded[0]?.keyframes).toEqual([{ height: '0px' }, { height: '120px' }]);
  expect(recorded[0]?.timing).toMatchObject({
    duration: 240,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    fill: 'both',
  });

  fake.animations[0]?.settle();
  await animation.finished;
  expect(fake.style.getPropertyValue('height')).toBe('');
  expect(fake.style.getPropertyValue('overflow')).toBe('');
  expect(fake.hidden).toBe(false);
  expect(fake.getAttribute('inert')).toBeNull();
  expect(fake.getAttribute('aria-hidden')).toBeNull();
});

test('collapses from the rendered height, then hides and guards the region', async () => {
  installTiming();
  const { element, fake } = createElement({ height: 88 });
  const animation = animateDisclosure(element, false);

  expect(recorded[0]?.keyframes).toEqual([{ height: '88px' }, { height: '0px' }]);
  expect(fake.getAttribute('inert')).toBe('');
  expect(fake.getAttribute('aria-hidden')).toBe('true');
  expect(fake.hidden).toBe(false);

  fake.animations[0]?.settle();
  await animation.finished;
  expect(fake.hidden).toBe(true);
  expect(fake.style.getPropertyValue('height')).toBe('');
  expect(fake.style.getPropertyValue('overflow')).toBe('');
});

test('continues an interrupted run from the height currently on screen', () => {
  installTiming();
  const { element, fake } = createElement({ hidden: true, height: 120 });
  animateDisclosure(element, true);
  fake.rectHeight = 42;
  animateDisclosure(element, false);

  expect(recorded[1]?.keyframes).toEqual([{ height: '42px' }, { height: '0px' }]);
});

test('applies the target state immediately without motion', () => {
  installTiming();
  const { element, fake } = createElement({ height: 80 });
  const animation = animateDisclosure(element, false, { animate: false });

  expect(recorded).toHaveLength(0);
  expect(fake.hidden).toBe(true);
  expect(animation.finished).toBeInstanceOf(Promise);
});

test('collapses instantly when reduced motion is requested', async () => {
  installTiming();
  (globalThis as FakeGlobal).window = {
    matchMedia: () => ({ matches: true }),
  };
  const { element, fake } = createElement({ height: 80 });
  await animateDisclosure(element, false).finished;

  expect(recorded).toHaveLength(0);
  expect(fake.hidden).toBe(true);
});

test('restores the inline height the consumer already set', async () => {
  installTiming();
  const { element, fake } = createElement({ height: 60, inlineHeight: '12rem' });
  const animation = animateDisclosure(element, false);
  fake.animations[0]?.settle();
  await animation.finished;

  expect(fake.style.getPropertyValue('height')).toBe('12rem');
});
