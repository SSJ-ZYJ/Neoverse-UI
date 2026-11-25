import { afterEach, expect, test } from 'bun:test';
import { Window } from 'happy-dom';

import {
  isWholePageTransitionVariant,
  pageTransitionAttribute,
  pageTransitionBackgroundAttribute,
  pageTransitionContentAttribute,
  pageTransitionDirectionAttribute,
  pageTransitionDirections,
  pageTransitionMorphAttribute,
  pageTransitionScopeAttribute,
  pageTransitionSnapshotName,
  pageTransitionTargetAttribute,
  pageTransitionVariants,
  startViewTransition,
  stopViewTransition,
  supportsViewTransition,
  toMorphSnapshotName,
  viewTransitionAttribute,
  wholePageTransitionVariants,
} from './index.js';

const originals = {
  document: globalThis.document,
  getComputedStyle: globalThis.getComputedStyle,
  window: globalThis.window,
};

const flushMicrotasks = () =>
  Promise.resolve()
    .then(() => Promise.resolve())
    .then(() => Promise.resolve());

afterEach(() => {
  stopViewTransition();
  Object.assign(globalThis, originals);
});

function createRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function setupBrowser(
  options: {
    reducedMotion?: boolean;
    registerProperty?: boolean;
    withViewTransition?: boolean;
    rtl?: boolean;
  } = {},
) {
  const dom = new Window({ url: 'http://localhost/', width: 1440, height: 900 });
  const root = dom.document.documentElement;
  if (options.rtl) root.setAttribute('dir', 'rtl');

  const transitions: Array<{
    finished: Promise<void>;
    resolve: () => void;
    skipped: boolean;
    skipTransition: () => void;
  }> = [];

  if (options.withViewTransition !== false) {
    (dom.document as unknown as { startViewTransition: unknown }).startViewTransition = (
      update: () => Promise<void> | void,
    ) => {
      void update();
      const { promise, resolve } = Promise.withResolvers<void>();
      const entry = {
        finished: promise,
        resolve,
        skipped: false,
        skipTransition() {
          this.skipped = true;
          resolve();
        },
      };
      transitions.push(entry);
      return entry;
    };
  }

  const windowStub = dom as unknown as Record<string, unknown>;
  Object.defineProperty(windowStub, 'CSS', {
    configurable: true,
    value: options.registerProperty === false ? {} : { registerProperty: () => undefined },
  });
  windowStub.matchMedia = (query: string) => ({
    matches: Boolean(options.reducedMotion) && query === '(prefers-reduced-motion: reduce)',
  });

  Object.assign(globalThis, {
    document: dom.document,
    getComputedStyle: dom.getComputedStyle.bind(dom),
    window: dom,
  });

  return { dom, root: root as unknown as HTMLElement, transitions };
}

test('exposes the enriched page transition presets, directions, and attributes', () => {
  expect(pageTransitionVariants).toEqual([
    'fade',
    'glide',
    'slide',
    'push',
    'depth',
    'veil',
    'curtain',
    'iris',
    'morph',
    'dissolve',
  ]);
  expect(pageTransitionDirections).toEqual(['forward', 'backward', 'up', 'down']);
  expect(pageTransitionAttribute).toBe('data-neoverse-page-transition');
  expect(pageTransitionDirectionAttribute).toBe('data-neoverse-page-direction');
  expect(pageTransitionScopeAttribute).toBe('data-neoverse-page-scope');
  expect(pageTransitionBackgroundAttribute).toBe('data-neoverse-page-background');
  expect(pageTransitionContentAttribute).toBe('data-neoverse-page-content');
  expect(pageTransitionMorphAttribute).toBe('data-neoverse-page-morph');
  expect(pageTransitionTargetAttribute).toBe('data-neoverse-page-target');
  expect(pageTransitionSnapshotName).toBe('nv-page');
  expect(toMorphSnapshotName(' Stage Figure ')).toBe('nv-morph-stage-figure');
  expect(wholePageTransitionVariants).toEqual(['slide', 'push', 'curtain', 'iris', 'dissolve']);
  expect(isWholePageTransitionVariant('morph')).toBe(false);
  expect(isWholePageTransitionVariant('glide')).toBe(false);
  expect(isWholePageTransitionVariant('push')).toBe(true);
});

test('supportsViewTransition reports true only when the browser exposes startViewTransition', () => {
  expect(supportsViewTransition()).toBe(false);
  setupBrowser({ withViewTransition: false });
  expect(supportsViewTransition()).toBe(false);
  setupBrowser({ withViewTransition: true });
  expect(supportsViewTransition()).toBe(true);
});

test('sets and cleans up preset, direction, and document scope attributes', async () => {
  const { root, transitions } = setupBrowser();

  let applied = false;
  const pending = startViewTransition(
    () => {
      applied = true;
    },
    { variant: 'push', direction: 'backward' },
  );
  expect(applied).toBe(true);

  expect(root.hasAttribute(viewTransitionAttribute)).toBe(true);
  expect(root.getAttribute(pageTransitionAttribute)).toBe('push');
  expect(root.getAttribute(pageTransitionDirectionAttribute)).toBe('backward');
  expect(root.getAttribute(pageTransitionScopeAttribute)).toBe('document');

  transitions[0]?.resolve();
  await pending;

  expect(root.hasAttribute(viewTransitionAttribute)).toBe(false);
  expect(root.hasAttribute(pageTransitionAttribute)).toBe(false);
  expect(root.hasAttribute(pageTransitionDirectionAttribute)).toBe(false);
  expect(root.hasAttribute(pageTransitionScopeAttribute)).toBe(false);
});

test('scopes transitions to a target container with radius and iris origin coordinates', async () => {
  const { dom, root, transitions } = setupBrowser({ registerProperty: true });
  const stage = dom.document.createElement('section') as unknown as HTMLElement;
  stage.style.borderRadius = '16px';
  stage.getClientRects = () => [createRect(100, 80, 400, 300)] as never;
  stage.getBoundingClientRect = () => createRect(100, 80, 400, 300);

  const button = dom.document.createElement('button') as unknown as HTMLElement;
  button.getBoundingClientRect = () => createRect(140, 110, 40, 20);
  stage.append(button as never);
  dom.document.body.append(stage as never);

  const pending = startViewTransition(() => undefined, {
    variant: 'iris',
    direction: 'forward',
    target: stage,
    origin: button,
  });

  expect(root.getAttribute(pageTransitionScopeAttribute)).toBe('region');
  expect(root.getAttribute(pageTransitionAttribute)).toBe('iris');
  expect(stage.hasAttribute(pageTransitionTargetAttribute)).toBe(true);
  expect(root.style.getPropertyValue('--neoverse-page-transition-radius')).toBe('16px');
  expect(root.style.getPropertyValue('--neoverse-page-origin')).toBe('60px 40px');
  expect(root.style.getPropertyValue('--neoverse-page-reveal-radius')).toBe('429px');

  transitions[0]?.resolve();
  await pending;

  expect(stage.hasAttribute(pageTransitionTargetAttribute)).toBe(false);
  expect(root.style.getPropertyValue('--neoverse-page-transition-radius')).toBe('');
  expect(root.style.getPropertyValue('--neoverse-page-origin')).toBe('');
  expect(root.style.getPropertyValue('--neoverse-page-reveal-radius')).toBe('');
});

test('degrades mask presets cleanly when CSS.registerProperty is unavailable', async () => {
  const { root, transitions } = setupBrowser({ registerProperty: false });

  const curtainPending = startViewTransition(() => undefined, { variant: 'curtain' });
  expect(root.getAttribute(pageTransitionAttribute)).toBe('glide');
  transitions[0]?.resolve();
  await curtainPending;

  const irisPending = startViewTransition(() => undefined, { variant: 'iris' });
  expect(root.getAttribute(pageTransitionAttribute)).toBe('depth');
  transitions[1]?.resolve();
  await irisPending;
});

test('runs a non-sticky WAAPI fallback on region targets without startViewTransition', async () => {
  const { dom } = setupBrowser({ withViewTransition: false });
  const stage = dom.document.createElement('div') as unknown as HTMLElement;
  stage.getClientRects = () => [createRect(0, 0, 320, 200)] as never;
  stage.getBoundingClientRect = () => createRect(0, 0, 320, 200);
  dom.document.body.append(stage as never);

  const recorded: Array<{
    frames: Keyframe[];
    options: KeyframeAnimationOptions;
    canceled: boolean;
  }> = [];
  const resolvers: Array<() => void> = [];

  (stage as unknown as { animate: unknown }).animate = (
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
  ) => {
    const { promise, resolve } = Promise.withResolvers<void>();
    const entry = { frames, options, canceled: false };
    recorded.push(entry);
    resolvers.push(resolve);
    return {
      finished: promise,
      cancel() {
        entry.canceled = true;
        resolve();
      },
    };
  };

  let updated = 0;
  const first = startViewTransition(
    () => {
      updated += 1;
    },
    { variant: 'veil', target: stage },
  );
  await flushMicrotasks();
  expect(updated).toBe(1);
  expect(recorded).toHaveLength(1);
  expect(recorded[0]?.options.fill).toBe('none');
  expect(recorded[0]?.frames[0]).toMatchObject({ opacity: 0, filter: 'blur(8px)' });

  const second = startViewTransition(
    () => {
      updated += 1;
    },
    { variant: 'curtain', direction: 'forward', target: stage },
  );
  await flushMicrotasks();
  expect(recorded[0]?.canceled).toBe(true);
  expect(recorded).toHaveLength(2);
  expect(recorded[1]?.frames[0]).toEqual({ clipPath: 'inset(0% 100% 0% 0%)' });

  resolvers[1]?.();
  await Promise.all([first, second]);
});

test('variant none and stopViewTransition bypass and cancel transitions cleanly', async () => {
  const { dom, root, transitions } = setupBrowser();
  const stage = dom.document.createElement('div') as unknown as HTMLElement;
  stage.getClientRects = () => [createRect(0, 0, 300, 180)] as never;
  dom.document.body.append(stage as never);

  const running = startViewTransition(() => undefined, { variant: 'slide', target: stage });
  expect(stage.hasAttribute(pageTransitionTargetAttribute)).toBe(true);

  stopViewTransition();
  expect(transitions[0]?.skipped).toBe(true);
  expect(stage.hasAttribute(pageTransitionTargetAttribute)).toBe(false);
  expect(root.hasAttribute(viewTransitionAttribute)).toBe(false);
  await running;

  let ran = false;
  await startViewTransition(
    () => {
      ran = true;
    },
    { variant: 'none', target: stage },
  );
  expect(ran).toBe(true);
  expect(transitions).toHaveLength(1);
});

test('keeps shared backgrounds still by targeting content slots unless whole-page or surface mode is chosen', async () => {
  const { dom, root, transitions } = setupBrowser();
  const stage = dom.document.createElement('section') as unknown as HTMLElement;
  stage.style.borderRadius = '20px';
  stage.getClientRects = () => [createRect(0, 0, 480, 320)] as never;
  const content = dom.document.createElement('div') as unknown as HTMLElement;
  content.setAttribute(pageTransitionContentAttribute, '');
  content.getClientRects = () => [createRect(0, 0, 480, 320)] as never;
  stage.append(content as never);
  dom.document.body.append(stage as never);

  const sharedPending = startViewTransition(() => undefined, {
    variant: 'glide',
    target: stage,
    contentTarget: content,
  });
  expect(root.getAttribute(pageTransitionBackgroundAttribute)).toBe('shared');
  expect(root.getAttribute(pageTransitionScopeAttribute)).toBe('region');
  expect(content.hasAttribute(pageTransitionTargetAttribute)).toBe(true);
  expect(stage.hasAttribute(pageTransitionTargetAttribute)).toBe(false);
  expect(root.style.getPropertyValue('--neoverse-page-transition-radius')).toBe('20px');
  transitions[0]?.resolve();
  await sharedPending;
  expect(content.hasAttribute(pageTransitionTargetAttribute)).toBe(false);

  const wholePagePending = startViewTransition(() => undefined, {
    variant: 'push',
    target: stage,
    contentTarget: content,
  });
  expect(root.getAttribute(pageTransitionBackgroundAttribute)).toBe('surface');
  expect(stage.hasAttribute(pageTransitionTargetAttribute)).toBe(true);
  expect(content.hasAttribute(pageTransitionTargetAttribute)).toBe(false);
  transitions[1]?.resolve();
  await wholePagePending;

  const distinctSurfacePending = startViewTransition(() => undefined, {
    variant: 'glide',
    target: stage,
    contentTarget: content,
    background: 'surface',
  });
  expect(root.getAttribute(pageTransitionBackgroundAttribute)).toBe('surface');
  expect(stage.hasAttribute(pageTransitionTargetAttribute)).toBe(true);
  expect(content.hasAttribute(pageTransitionTargetAttribute)).toBe(false);
  transitions[2]?.resolve();
  await distinctSurfacePending;
});

test('morph assigns matched view-transition names, deduplicates keys, and cleans up after settle', async () => {
  const { dom, root, transitions } = setupBrowser();
  const content = dom.document.createElement('div') as unknown as HTMLElement;
  content.setAttribute(pageTransitionContentAttribute, '');
  content.getClientRects = () => [createRect(0, 0, 480, 320)] as never;

  const oldHero = dom.document.createElement('div') as unknown as HTMLElement;
  oldHero.setAttribute(pageTransitionMorphAttribute, 'Stage Figure');
  oldHero.getClientRects = () => [createRect(20, 20, 120, 80)] as never;
  const dupHero = dom.document.createElement('div') as unknown as HTMLElement;
  dupHero.setAttribute(pageTransitionMorphAttribute, 'stage-figure');
  dupHero.getClientRects = () => [createRect(40, 20, 60, 40)] as never;
  content.append(oldHero as never, dupHero as never);
  dom.document.body.append(content as never);

  let newHero: HTMLElement | undefined;
  const pending = startViewTransition(
    () => {
      oldHero.remove();
      dupHero.remove();
      newHero = dom.document.createElement('div') as unknown as HTMLElement;
      newHero.setAttribute(pageTransitionMorphAttribute, 'stage-figure');
      newHero.getClientRects = () => [createRect(240, 40, 180, 90)] as never;
      content.append(newHero as never);
    },
    { variant: 'morph', contentTarget: content },
  );

  expect(root.getAttribute(pageTransitionAttribute)).toBe('morph');
  expect(root.getAttribute(pageTransitionBackgroundAttribute)).toBe('shared');
  await flushMicrotasks();
  expect(newHero?.style.getPropertyValue('view-transition-name')).toBe('nv-morph-stage-figure');
  expect(dupHero.style.getPropertyValue('view-transition-name')).toBe('');

  transitions[0]?.resolve();
  await pending;
  expect(newHero?.style.getPropertyValue('view-transition-name')).toBe('');
  expect(root.hasAttribute(pageTransitionAttribute)).toBe(false);
});

test('morph falls back to non-sticky WAAPI FLIP transforms without View Transitions', async () => {
  const { dom } = setupBrowser({ withViewTransition: false });
  const stage = dom.document.createElement('div') as unknown as HTMLElement;
  stage.setAttribute(pageTransitionContentAttribute, '');
  stage.getClientRects = () => [createRect(0, 0, 400, 240)] as never;
  dom.document.body.append(stage as never);

  const recorded: Array<{ frames: Keyframe[]; options: KeyframeAnimationOptions }> = [];
  const resolvers: Array<() => void> = [];
  let currentRect = createRect(200, 40, 100, 60);

  const box = dom.document.createElement('div') as unknown as HTMLElement;
  box.setAttribute(pageTransitionMorphAttribute, 'figure');
  box.getClientRects = () => [currentRect] as never;
  box.getBoundingClientRect = () => currentRect;
  (box as unknown as { animate: unknown }).animate = (
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
  ) => {
    const { promise, resolve } = Promise.withResolvers<void>();
    recorded.push({ frames, options });
    resolvers.push(resolve);
    return { finished: promise, cancel: resolve };
  };
  stage.append(box as never);

  const pending = startViewTransition(
    () => {
      currentRect = createRect(40, 60, 200, 120);
    },
    { variant: 'morph', contentTarget: stage },
  );
  await flushMicrotasks();

  expect(recorded).toHaveLength(1);
  expect(recorded[0]?.options.fill).toBe('none');
  expect(recorded[0]?.frames[0]).toMatchObject({
    transformOrigin: 'top left',
    transform: 'translate3d(160px, -20px, 0) scale(0.5, 0.5)',
  });

  resolvers[0]?.();
  await pending;
});

test('smoothly animates resizeTarget height across page height changes on ready', async () => {
  const { dom, transitions } = setupBrowser();
  const { promise: readyPromise, resolve: resolveReady } = Promise.withResolvers<void>();
  (transitions as unknown[]).length = 0;
  const origStart = (dom.document as unknown as { startViewTransition: unknown })
    .startViewTransition as (cb: () => void) => Record<string, unknown>;
  (dom.document as unknown as { startViewTransition: unknown }).startViewTransition = (
    cb: () => void,
  ) => {
    const entry = origStart(cb);
    entry.ready = readyPromise;
    return entry;
  };

  let height = 180;
  const stage = dom.document.createElement('div') as unknown as HTMLElement;
  stage.getClientRects = () => [createRect(0, 0, 480, height)] as never;
  stage.getBoundingClientRect = () => createRect(0, 0, 480, height);
  const recorded: Keyframe[][] = [];
  (stage as unknown as { animate: unknown }).animate = (frames: Keyframe[]) => {
    recorded.push(frames);
    return { finished: Promise.resolve(), cancel: () => undefined };
  };
  dom.document.body.append(stage as never);

  const pending = startViewTransition(
    () => {
      height = 240;
    },
    { variant: 'morph', resizeTarget: stage },
  );
  resolveReady();
  await flushMicrotasks();

  expect(recorded).toHaveLength(1);
  expect(recorded[0]).toEqual([
    { height: '180px', overflow: 'clip' },
    { height: '240px', overflow: 'clip' },
  ]);

  (transitions[0] as { resolve: () => void })?.resolve();
  await pending;
});

test('distinct surface transitions keep outgoing layers opaque and start incoming layers without gap delay', async () => {
  const transitionCss = await Bun.file(new URL('./page-transition.css', import.meta.url)).text();
  const revealsCss = await Bun.file(new URL('./page-reveals.css', import.meta.url)).text();

  expect(transitionCss).toContain(
    ":root[data-neoverse-page-background='surface'][data-neoverse-page-transition='fade']::view-transition-old(",
  );
  expect(transitionCss).toContain(
    ":root[data-neoverse-page-background='surface'][data-neoverse-page-transition='glide']::view-transition-new(",
  );
  expect(transitionCss).toContain('0ms both;');
  expect(transitionCss).toContain('@keyframes nv-page-surface-glide-out');
  expect(revealsCss).not.toMatch(/@keyframes nv-page-backdrop-clear\s*\{[^}]*opacity:\s*0\s*;/);
});
