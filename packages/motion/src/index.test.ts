import { expect, test } from 'bun:test';

import {
  motionDistances,
  motionDurations,
  motionEasings,
  motionRoles,
  prefersReducedMotion,
  presenceClassNames,
  presenceDataAttribute,
  presenceLayerClassName,
  presenceOriginAttribute,
  presenceStagger,
  presenceTransitionName,
  presenceVariants,
  startViewTransition,
} from './index.js';

test('exposes the canonical Motion durations and easings', () => {
  expect(motionDurations).toEqual({
    fast: '140ms',
    standard: '240ms',
    expressive: '420ms',
  });
  expect(motionEasings).toEqual({
    linear: 'linear',
    standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
    emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
    accelerate: 'cubic-bezier(0.5, 0, 0.75, 0)',
  });
});

test('exposes semantic motion roles used by shared components', () => {
  expect(motionRoles).toEqual({
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
  });
});

test('exposes the shared presence contract', () => {
  expect(presenceVariants).toEqual([
    'fade',
    'rise',
    'sink',
    'pop',
    'veil',
    'slide-start',
    'slide-end',
  ]);
  expect(presenceTransitionName).toBe('nv');
  expect(presenceDataAttribute).toBe('data-neoverse-motion');
  expect(presenceOriginAttribute).toBe('data-neoverse-motion-origin');
  expect(presenceClassNames).toEqual({
    enterFrom: 'nv-enter-from',
    enterActive: 'nv-enter-active',
    enterTo: 'nv-enter-to',
    leaveFrom: 'nv-leave-from',
    leaveActive: 'nv-leave-active',
    leaveTo: 'nv-leave-to',
    move: 'nv-move',
  });
  expect(presenceLayerClassName).toBe('nv-presence');
});

test('exposes the travel distance tokens', () => {
  expect(motionDistances).toEqual({
    near: '--neoverse-motion-distance-near',
    mid: '--neoverse-motion-distance-mid',
    far: '--neoverse-motion-distance-far',
  });
});

test('stagger caps the delay so long lists never queue forever', () => {
  expect(presenceStagger(0)).toEqual({});
  expect(presenceStagger(2, { step: 40 })).toEqual({ '--neoverse-motion-enter-delay': '80ms' });
  expect(presenceStagger(50, { step: 40, max: 12 })).toEqual({
    '--neoverse-motion-enter-delay': '480ms',
  });
});

test('prefersReducedMotion reports false without a media query', () => {
  expect(prefersReducedMotion()).toBe(false);
});

test('startViewTransition applies the update when the API is unavailable', async () => {
  let applied = false;
  await startViewTransition(() => {
    applied = true;
  });
  expect(applied).toBe(true);
});

type FakeGlobal = Record<string, unknown>;

function createFakeRootElement(): {
  setAttribute: (name: string) => void;
  removeAttribute: (name: string) => void;
  hasAttribute: (name: string) => boolean;
} {
  const attributes = new Set<string>();
  return {
    setAttribute: (name) => attributes.add(name),
    removeAttribute: (name) => attributes.delete(name),
    hasAttribute: (name) => attributes.has(name),
  };
}

async function withFakeDom(
  dom: { matchMediaMatches: boolean; startViewTransition?: (...args: never[]) => unknown },
  run: (root: ReturnType<typeof createFakeRootElement>) => Promise<void> | void,
): Promise<void> {
  const globals = globalThis as FakeGlobal;
  const originalDocument = globals.document;
  const originalWindow = globals.window;
  const root = createFakeRootElement();
  const documentStub = {
    startViewTransition: dom.startViewTransition,
    documentElement: root,
    querySelector: () => null,
  };
  const windowStub = {
    matchMedia: (query: string) => ({
      matches: dom.matchMediaMatches && query === '(prefers-reduced-motion: reduce)',
    }),
  };

  globals.document = documentStub;
  globals.window = windowStub;

  try {
    await run(root);
  } finally {
    globals.document = originalDocument;
    globals.window = originalWindow;
  }
}

test('startViewTransition applies the update directly under reduced motion', async () => {
  await withFakeDom(
    {
      matchMediaMatches: true,
      startViewTransition: () => {
        throw new Error('startViewTransition must not run under reduced motion');
      },
    },
    async () => {
      let applied = false;
      await startViewTransition(() => {
        applied = true;
      });
      expect(applied).toBe(true);
    },
  );
});

test('startViewTransition scopes the transition with the view-transitioning attribute', async () => {
  await withFakeDom({ matchMediaMatches: false }, async (root) => {
    const finished = Promise.withResolvers<void>();
    const dom = globalThis as FakeGlobal;
    (dom.document as FakeGlobal).startViewTransition = (update: () => Promise<void>) => {
      void update();
      return { finished: finished.promise };
    };

    let applied = false;
    const result = startViewTransition(() => {
      applied = true;
    });
    expect(applied).toBe(true);
    expect(root.hasAttribute('data-neoverse-view-transitioning')).toBe(true);

    finished.resolve();
    await result;
    expect(root.hasAttribute('data-neoverse-view-transitioning')).toBe(false);
  });
});

test('startViewTransition interrupts the running transition when called again', async () => {
  await withFakeDom({ matchMediaMatches: false }, async (root) => {
    const dom = globalThis as FakeGlobal;
    const makeTransition = () => {
      const finished = Promise.withResolvers<void>();
      return {
        finished: finished.promise,
        resolve: () => finished.resolve(),
        skipped: false,
        skipTransition: function () {
          this.skipped = true;
          this.resolve();
        },
      };
    };
    let created = 0;
    const created2 = new Map<number, ReturnType<typeof makeTransition>>();
    (dom.document as FakeGlobal).startViewTransition = (update: () => Promise<void>) => {
      void update();
      created += 1;
      const transition = makeTransition();
      created2.set(created, transition);
      return transition;
    };

    const first = startViewTransition(() => undefined);
    const second = startViewTransition(() => undefined);
    expect(created2.get(1)?.skipped).toBe(true);

    created2.get(2)?.resolve();
    await Promise.all([first, second]);
    expect(root.hasAttribute('data-neoverse-view-transitioning')).toBe(false);
  });
});
