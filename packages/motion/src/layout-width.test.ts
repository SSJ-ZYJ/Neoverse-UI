import { afterEach, beforeEach, expect, test } from 'bun:test';

import { animateLayoutWidths, captureLayoutWidths } from './index.js';

type FakeGlobal = Record<string, unknown>;

interface FakeStyle {
  width: string;
  duration?: string;
  easing?: string;
}

interface FakeAnimation {
  finished: Promise<void>;
  cancel(): void;
  settle(): void;
  cancels: number;
}

function createInlineStyle(): CSSStyleDeclaration {
  const values = new Map<string, { value: string; priority: string }>();
  return {
    setProperty(name: string, value: string, priority = '') {
      values.set(name, { value, priority });
    },
    getPropertyValue: (name: string) => values.get(name)?.value ?? '',
    getPropertyPriority: (name: string) => values.get(name)?.priority ?? '',
    removeProperty: (name: string) => values.delete(name),
  } as unknown as CSSStyleDeclaration;
}

const originalGetComputedStyle = (globalThis as FakeGlobal).getComputedStyle;
const originalWindow = (globalThis as FakeGlobal).window;

interface Recording {
  keyframes: Keyframe[];
  timing: KeyframeAnimationOptions;
}

let recorded: Recording[] = [];
const elementStyles = new Map<Element, FakeStyle>();
let styleReads: string[] = [];

beforeEach(() => {
  recorded = [];
  styleReads = [];
  elementStyles.clear();
});

afterEach(() => {
  (globalThis as FakeGlobal).getComputedStyle = originalGetComputedStyle;
  (globalThis as FakeGlobal).window = originalWindow;
});

function styleDeclaration(style: FakeStyle): CSSStyleDeclaration {
  return {
    width: style.width,
    getPropertyValue: (name: string) =>
      name === '--neoverse-motion-spatial-duration'
        ? (style.duration ?? '420ms')
        : name === '--neoverse-motion-spatial-easing'
          ? (style.easing ?? 'cubic-bezier(0.16, 1, 0.3, 1)')
          : '',
  } as CSSStyleDeclaration;
}

function installStyles(): void {
  (globalThis as FakeGlobal).getComputedStyle = (element: Element) => {
    styleReads.push(element.getAttribute('data-name') ?? '?');
    const style = elementStyles.get(element);
    if (style === undefined) throw new Error('unstyled element');
    return styleDeclaration(style);
  };
}

function createElement(
  name: string,
  style: FakeStyle,
  options: { rendered?: boolean; animatable?: boolean } = {},
): { element: Element; animations: FakeAnimation[]; inlineStyle: CSSStyleDeclaration } {
  const animations: FakeAnimation[] = [];
  const inlineStyle = createInlineStyle();
  const element = {
    style: inlineStyle,
    getAttribute: (attribute: string) => (attribute === 'data-name' ? name : null),
    getClientRects: () => (options.rendered === false ? [] : [{ width: 1 }]),
    animate: (keyframes: Keyframe[], timing: KeyframeAnimationOptions) => {
      const settled = Promise.withResolvers<void>();
      const animation: FakeAnimation = {
        finished: settled.promise,
        cancels: 0,
        settle: () => settled.resolve(),
        cancel() {
          animation.cancels += 1;
          settled.reject(new DOMException('cancelled', 'AbortError'));
        },
      };
      animations.push(animation);
      recorded.push({ keyframes, timing });
      return animation as unknown as Animation;
    },
  };
  if (options.animatable === false) {
    delete (element as { animate?: unknown }).animate;
  }
  const typed = element as unknown as Element;
  elementStyles.set(typed, style);
  return { element: typed, animations, inlineStyle };
}

function setWidth(element: Element, width: string): void {
  const style = elementStyles.get(element);
  if (style === undefined) throw new Error('unstyled element');
  style.width = width;
}

test('captures only the boxes that are currently laid out', () => {
  installStyles();
  const visible = createElement('visible', { width: '120px' });
  const hidden = createElement('hidden', { width: '0px' }, { rendered: false });

  const samples = captureLayoutWidths([visible.element, hidden.element, null, undefined]);

  expect(samples).toEqual([{ element: visible.element, width: '120px' }]);
});

test('resolves every natural width before the first animation starts', () => {
  installStyles();
  const brand = createElement('brand', { width: '80px' });
  const navigation = createElement('navigation', { width: '240px' });
  const samples = captureLayoutWidths([brand.element, navigation.element]);
  styleReads = [];

  // The widths the boxes take once the content has changed.
  setWidth(brand.element, '104px');
  setWidth(navigation.element, '210px');

  animateLayoutWidths(samples);

  expect(recorded).toHaveLength(2);
  // Both endpoint reads happen before either animation mutates the grid.
  expect(styleReads).toEqual(['brand', 'navigation']);
});

test('animates changed widths on the spatial role', () => {
  installStyles();
  const box = createElement('box', { width: '100px' });
  const samples = captureLayoutWidths([box.element]);
  setWidth(box.element, '160px');

  const handle = animateLayoutWidths(samples);

  expect(recorded).toHaveLength(1);
  expect(recorded[0]?.keyframes).toEqual([{ width: '100px' }, { width: '160px' }]);
  expect(recorded[0]?.timing).toEqual({
    duration: 420,
    fill: 'both',
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  });
  expect(handle.animations).toHaveLength(1);
});

test('leaves boxes that kept their width alone', () => {
  installStyles();
  const box = createElement('box', { width: '100px' });
  const samples = captureLayoutWidths([box.element]);

  const handle = animateLayoutWidths(samples);

  expect(recorded).toHaveLength(0);
  expect(handle.animations).toHaveLength(0);
});

test('honours a custom tolerance', () => {
  installStyles();
  const box = createElement('box', { width: '100px' });
  const samples = captureLayoutWidths([box.element]);
  setWidth(box.element, '102px');

  expect(animateLayoutWidths(samples).animations).toHaveLength(1);
  expect(animateLayoutWidths(samples, { tolerance: 3 }).animations).toHaveLength(0);
});

test('skips the motion under reduced motion', () => {
  installStyles();
  (globalThis as FakeGlobal).window = {
    matchMedia: (query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' }),
  };
  const box = createElement('box', { width: '100px' });
  const samples = captureLayoutWidths([box.element]);
  setWidth(box.element, '160px');

  expect(animateLayoutWidths(samples).animations).toHaveLength(0);
  expect(recorded).toHaveLength(0);
});

test('skips boxes without a usable duration token or animation API', () => {
  installStyles();
  const still = createElement('still', { width: '100px', duration: '0ms' });
  const inert = createElement('inert', { width: '100px' }, { animatable: false });
  const samples = captureLayoutWidths([still.element, inert.element]);
  setWidth(still.element, '160px');
  setWidth(inert.element, '160px');

  expect(animateLayoutWidths(samples).animations).toHaveLength(0);
  expect(recorded).toHaveLength(0);
});

test('cancel stops every running animation', () => {
  installStyles();
  const first = createElement('first', { width: '100px' });
  const second = createElement('second', { width: '200px' });
  const samples = captureLayoutWidths([first.element, second.element]);
  setWidth(first.element, '140px');
  setWidth(second.element, '260px');

  const handle = animateLayoutWidths(samples);
  expect(handle.animations).toHaveLength(2);
  handle.cancel();

  expect(first.animations[0]?.cancels).toBeGreaterThan(0);
  expect(second.animations[0]?.cancels).toBeGreaterThan(0);
});

test('settles after the running animations are cancelled', async () => {
  installStyles();
  const box = createElement('box', { width: '100px' });
  const samples = captureLayoutWidths([box.element]);
  setWidth(box.element, '160px');

  const handle = animateLayoutWidths(samples);
  handle.cancel();

  await expect(handle.finished).resolves.toBeUndefined();
});

test('keeps expanding copy on one line and restores inline styles on cancel', () => {
  installStyles();
  const box = createElement('box', { width: '100px' });
  box.inlineStyle.setProperty('overflow', 'hidden');
  const samples = captureLayoutWidths([box.element]);
  setWidth(box.element, '160px');

  const handle = animateLayoutWidths(samples);

  expect(box.inlineStyle.getPropertyValue('white-space')).toBe('nowrap');
  expect(box.inlineStyle.getPropertyValue('overflow')).toBe('clip');

  handle.cancel();

  expect(box.inlineStyle.getPropertyValue('white-space')).toBe('');
  expect(box.inlineStyle.getPropertyValue('overflow')).toBe('hidden');
});

test('restores inline styles when the width run finishes', async () => {
  installStyles();
  const box = createElement('box', { width: '100px' });
  const samples = captureLayoutWidths([box.element]);
  setWidth(box.element, '160px');

  const handle = animateLayoutWidths(samples);
  expect(box.inlineStyle.getPropertyValue('white-space')).toBe('nowrap');
  box.animations[0]?.settle();
  await handle.finished;

  expect(box.inlineStyle.getPropertyValue('white-space')).toBe('');
  expect(box.inlineStyle.getPropertyValue('overflow')).toBe('');
});

test('does not change the wrapping of boxes that only shrink', () => {
  installStyles();
  const box = createElement('box', { width: '160px' });
  const samples = captureLayoutWidths([box.element]);
  setWidth(box.element, '100px');

  animateLayoutWidths(samples);

  expect(box.inlineStyle.getPropertyValue('white-space')).toBe('');
  expect(box.inlineStyle.getPropertyValue('overflow')).toBe('');
});
