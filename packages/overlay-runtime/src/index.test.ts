import { expect, test } from 'bun:test';
import {
  acquireNativeScrollbarHiding,
  hideAnchoredOverlay,
  positionAnchoredOverlay,
  resolveAnchoredPosition,
  resolveOverlayViewportLayoutBounds,
} from './index';

const viewport = { width: 1200, height: 800 };

test('submenus use viewport layout bounds when a fallback panel has a transformed containing block', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'getComputedStyle');
  const zoom = 1.25;
  const style = {
    left: '63px',
    zoom: String(zoom),
    fontSize: '16px',
    scale: '0.96',
    translate: '0px 8px',
    transformOrigin: '64px 0px',
  };
  const panel = {
    parentElement: null,
    offsetWidth: 128,
    offsetHeight: 200,
    getBoundingClientRect: () => ({
      left: 207 + 64 * (1 - Number(style.scale)) * zoom,
      top: 497 + 8 * zoom,
    }),
  } as unknown as HTMLElement;
  try {
    Object.defineProperty(globalThis, 'getComputedStyle', {
      configurable: true,
      value: () => style,
    });
    expect(resolveOverlayViewportLayoutBounds(panel)).toEqual({
      left: 207,
      right: 367,
      top: 497,
      bottom: 747,
    });
  } finally {
    if (original) Object.defineProperty(globalThis, 'getComputedStyle', original);
    else Reflect.deleteProperty(globalThis, 'getComputedStyle');
  }
});

test('fallback containing-block correction preserves its own entrance scale and translate', () => {
  const saved = ['window', 'document', 'getComputedStyle'].map(
    (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const,
  );
  const values = new Map<string, string>();
  const zoom = 1.5;
  const parentOffset = { left: 100, top: 50 };
  const style = {
    zoom: String(zoom),
    fontSize: '16px',
    scale: '0.97',
    translate: '0px 8px',
    transformOrigin: '200px 0px',
    getPropertyValue: () => '8px',
  };
  const overlay = {
    parentElement: null,
    classList: { contains: () => true },
    offsetWidth: 400,
    offsetHeight: 80,
    dataset: {},
    style: { setProperty: (name: string, value: string) => values.set(name, value) },
    getBoundingClientRect: () => ({
      left:
        Number.parseFloat(values.get('--left') ?? '0') * zoom +
        parentOffset.left +
        200 * (1 - Number(style.scale)) * zoom,
      top:
        Number.parseFloat(values.get('--top') ?? '0') * zoom +
        parentOffset.top +
        Number.parseFloat(style.translate.split(' ')[1] ?? '0') * zoom,
    }),
  } as unknown as HTMLElement;
  const trigger = {
    getBoundingClientRect: () => ({
      top: 100,
      bottom: 140,
      left: 200,
      right: 300,
      width: 100,
      height: 40,
    }),
  } as unknown as HTMLElement;
  try {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { innerWidth: 1200, innerHeight: 800 },
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { documentElement: {} },
    });
    Object.defineProperty(globalThis, 'getComputedStyle', {
      configurable: true,
      value: () => style,
    });
    const options = {
      trigger,
      overlay,
      gapVariable: '--gap',
      leftVariable: '--left',
      topVariable: '--top',
      fallbackOpenClass: 'open',
    };
    positionAnchoredOverlay(options);
    expect(Number.parseFloat(values.get('--left') ?? '')).toBeCloseTo(
      (200 - parentOffset.left) / zoom,
    );
    expect(Number.parseFloat(values.get('--top') ?? '')).toBeCloseTo(
      (152 - parentOffset.top) / zoom,
    );
    style.scale = '1';
    style.translate = '0px';
    expect(overlay.getBoundingClientRect().left).toBeCloseTo(200);
    expect(overlay.getBoundingClientRect().top).toBeCloseTo(152);
  } finally {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});

test('clamps to the nominal layout viewport instead of the expanded document overflow', () => {
  const saved = ['window', 'document', 'getComputedStyle'].map(
    (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const,
  );
  const values = new Map<string, string>();
  const style = {
    zoom: '1',
    fontSize: '16px',
    scale: 'none',
    translate: 'none',
    transformOrigin: '0px 0px',
    getPropertyValue: () => '8px',
  };
  // Mobile emulation widens `innerWidth` to the document's scrollable overflow,
  // so a panel that escapes the right edge would grow the value meant to clamp it.
  const overlay = {
    parentElement: null,
    classList: { contains: () => true },
    offsetWidth: 200,
    offsetHeight: 100,
    dataset: {},
    style: { setProperty: (name: string, value: string) => values.set(name, value) },
    getBoundingClientRect: () => {
      const left = Number.parseFloat(values.get('--left') ?? '0');
      const top = Number.parseFloat(values.get('--top') ?? '0');
      return { left, top, right: left + 200, bottom: top + 100 };
    },
  } as unknown as HTMLElement;
  const trigger = {
    getBoundingClientRect: () => ({
      top: 100,
      bottom: 140,
      left: 700,
      right: 800,
      width: 100,
      height: 40,
    }),
  } as unknown as HTMLElement;
  try {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { innerWidth: 838, innerHeight: 600 },
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { documentElement: { clientWidth: 800, clientHeight: 600 } },
    });
    Object.defineProperty(globalThis, 'getComputedStyle', {
      configurable: true,
      value: () => style,
    });
    positionAnchoredOverlay({
      trigger,
      overlay,
      gapVariable: '--gap',
      leftVariable: '--left',
      topVariable: '--top',
      fallbackOpenClass: 'open',
    });
    // 800 - 200 - 8, not 838 - 200 - 8. The panel must not sit under the edge
    // that its own overflow created.
    expect(Number.parseFloat(values.get('--left') ?? '')).toBeCloseTo(592);
    expect(Number.parseFloat(values.get('--top') ?? '')).toBeCloseTo(148);
  } finally {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});

test('keeps a bottom-start overlay aligned to the trigger when space is available', () => {
  expect(
    resolveAnchoredPosition({
      trigger: { top: 100, right: 340, bottom: 140, left: 240, width: 100, height: 40 },
      overlayWidth: 240,
      overlayHeight: 180,
      viewport,
      gap: 8,
    }),
  ).toEqual({ left: 240, top: 148, opensAbove: false });
});

test('flips auto placement above when the lower viewport cannot fit the overlay', () => {
  expect(
    resolveAnchoredPosition({
      trigger: { top: 700, right: 340, bottom: 740, left: 240, width: 100, height: 40 },
      overlayWidth: 240,
      overlayHeight: 220,
      viewport,
      gap: 8,
    }),
  ).toEqual({ left: 240, top: 472, opensAbove: true });
});

test('bottom-end placement aligns to the trigger end edge and clamps to the viewport', () => {
  expect(
    resolveAnchoredPosition({
      trigger: { top: 120, right: 1180, bottom: 160, left: 1080, width: 100, height: 40 },
      overlayWidth: 260,
      overlayHeight: 160,
      viewport,
      gap: 12,
      placement: 'bottom-end',
    }),
  ).toEqual({ left: 920, top: 172, opensAbove: false });
});

test('clamps an oversized overlay to the viewport gap instead of producing negative coordinates', () => {
  expect(
    resolveAnchoredPosition({
      trigger: { top: 120, right: 180, bottom: 160, left: 80, width: 100, height: 40 },
      overlayWidth: 1400,
      overlayHeight: 900,
      viewport,
      gap: 12,
    }),
  ).toEqual({ left: 12, top: 12, opensAbove: false });
});

test('keeps explicit bottom placement below even when auto placement would flip', () => {
  expect(
    resolveAnchoredPosition({
      trigger: { top: 700, right: 340, bottom: 740, left: 240, width: 100, height: 40 },
      overlayWidth: 240,
      overlayHeight: 220,
      viewport,
      gap: 8,
      placement: 'bottom-start',
    }),
  ).toEqual({ left: 240, top: 572, opensAbove: false });
});

test('supports centered, top, left and right anchored placements with viewport clamping', () => {
  const trigger = { top: 300, right: 500, bottom: 340, left: 400, width: 100, height: 40 };
  expect(
    resolveAnchoredPosition({
      trigger,
      overlayWidth: 200,
      overlayHeight: 120,
      viewport,
      gap: 8,
      placement: 'top-start',
    }),
  ).toEqual({ left: 400, top: 172, opensAbove: true });

  expect(
    resolveAnchoredPosition({
      trigger,
      overlayWidth: 200,
      overlayHeight: 120,
      viewport,
      gap: 8,
      placement: 'top',
    }),
  ).toEqual({ left: 350, top: 172, opensAbove: true });

  expect(
    resolveAnchoredPosition({
      trigger,
      overlayWidth: 200,
      overlayHeight: 120,
      viewport,
      gap: 8,
      placement: 'bottom',
    }),
  ).toEqual({ left: 350, top: 348, opensAbove: false });

  expect(
    resolveAnchoredPosition({
      trigger,
      overlayWidth: 200,
      overlayHeight: 120,
      viewport,
      gap: 8,
      placement: 'right-start',
    }),
  ).toEqual({ left: 508, top: 300, opensAbove: false });

  expect(
    resolveAnchoredPosition({
      trigger,
      overlayWidth: 200,
      overlayHeight: 120,
      viewport,
      gap: 8,
      placement: 'left-end',
    }),
  ).toEqual({ left: 192, top: 220, opensAbove: false });
});

test('positions a point-anchored overlay from the cursor and flips above when needed', () => {
  const saved = ['window', 'document', 'getComputedStyle'].map(
    (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const,
  );
  const values = new Map<string, string>();
  const style = {
    zoom: '1',
    fontSize: '16px',
    scale: 'none',
    translate: 'none',
    transformOrigin: '0px 0px',
    getPropertyValue: () => '8px',
  };
  const overlay = {
    parentElement: null,
    classList: { contains: () => true },
    offsetWidth: 200,
    offsetHeight: 100,
    dataset: {},
    style: { setProperty: (name: string, value: string) => values.set(name, value) },
    // A laid-out fallback panel reports the position its custom properties ask for.
    getBoundingClientRect: () => {
      const left = Number.parseFloat(values.get('--left') ?? '0');
      const top = Number.parseFloat(values.get('--top') ?? '0');
      return { left, top, right: left + 200, bottom: top + 100, width: 200, height: 100 };
    },
  } as unknown as HTMLElement;
  try {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { innerWidth: 1200, innerHeight: 800 },
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { documentElement: { clientWidth: 1200, clientHeight: 800 } },
    });
    Object.defineProperty(globalThis, 'getComputedStyle', {
      configurable: true,
      value: () => style,
    });

    const options = {
      overlay,
      gapVariable: '--gap',
      leftVariable: '--left',
      topVariable: '--top',
      fallbackOpenClass: 'open',
    };

    // Cursor near the top-left: the panel opens below and to the right.
    positionAnchoredOverlay({ ...options, point: { x: 240, y: 160 } });
    expect(Number.parseFloat(values.get('--left') ?? '')).toBeCloseTo(240);
    expect(Number.parseFloat(values.get('--top') ?? '')).toBeCloseTo(168);
    expect(overlay.dataset.neoverseOverlaySide).toBe('bottom');

    // Cursor near the bottom edge: auto placement flips the panel above it.
    values.clear();
    positionAnchoredOverlay({ ...options, point: { x: 240, y: 760 } });
    expect(Number.parseFloat(values.get('--top') ?? '')).toBeCloseTo(652);
    expect(overlay.dataset.neoverseOverlaySide).toBe('top');

    // Cursor near the right edge: the panel clamps inside the viewport gap.
    values.clear();
    positionAnchoredOverlay({ ...options, point: { x: 1180, y: 100 } });
    expect(Number.parseFloat(values.get('--left') ?? '')).toBeCloseTo(992);
  } finally {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});

type FakeClassList = {
  add: (name: string) => void;
  contains: (name: string) => boolean;
  has: (name: string) => boolean;
  remove: (name: string) => void;
};

function fakeClassList(): FakeClassList {
  const values = new Set<string>();
  return {
    add: (name) => values.add(name),
    contains: (name) => values.has(name),
    has: (name) => values.has(name),
    remove: (name) => values.delete(name),
  };
}

function withScrollbarDocument(
  run: (root: { classList: FakeClassList }, body: { classList: FakeClassList }) => void,
): void {
  const root = { classList: fakeClassList() };
  const body = { classList: fakeClassList() };
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement: root, body },
  });
  try {
    run(root, body);
  } finally {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else Reflect.deleteProperty(globalThis, 'document');
  }
}

test('native scrollbar hiding is reference-counted across overlapping owners', () => {
  withScrollbarDocument((root, body) => {
    const releaseFirst = acquireNativeScrollbarHiding();
    const releaseSecond = acquireNativeScrollbarHiding();

    expect(root.classList.has('ui-scrollbar-target')).toBe(true);
    expect(body.classList.has('ui-scrollbar-target')).toBe(true);

    releaseFirst();
    expect(root.classList.has('ui-scrollbar-target')).toBe(true);
    expect(body.classList.has('ui-scrollbar-target')).toBe(true);

    releaseSecond();
    expect(root.classList.has('ui-scrollbar-target')).toBe(false);
    expect(body.classList.has('ui-scrollbar-target')).toBe(false);
  });
});

test('native scrollbar hiding preserves a class the page already owned', () => {
  withScrollbarDocument((root, body) => {
    root.classList.add('ui-scrollbar-target');
    body.classList.add('ui-scrollbar-target');

    const release = acquireNativeScrollbarHiding();
    release();
    expect(root.classList.has('ui-scrollbar-target')).toBe(true);
    expect(body.classList.has('ui-scrollbar-target')).toBe(true);
  });
});

test('releasing a scrollbar owner more than once cannot drop another owner', () => {
  withScrollbarDocument((root) => {
    const releaseFirst = acquireNativeScrollbarHiding();
    const releaseSecond = acquireNativeScrollbarHiding();

    releaseFirst();
    releaseFirst();
    expect(root.classList.has('ui-scrollbar-target')).toBe(true);

    releaseSecond();
    releaseSecond();
    expect(root.classList.has('ui-scrollbar-target')).toBe(false);
  });
});

test('a closed manual overlay releases focus it still owns', () => {
  const focused = {
    focus: () => undefined,
    blur: () => {
      released = true;
    },
  };
  let released = false;
  const panel = {
    ownerDocument: { activeElement: focused },
    contains: (node: unknown) => node === focused,
    matches: () => false,
    hidePopover: () => undefined,
    classList: { remove: () => undefined },
  } as unknown as HTMLElement;
  hideAnchoredOverlay({
    manual: true,
    overlay: panel,
    gapVariable: '--gap',
    leftVariable: '--left',
    topVariable: '--top',
    fallbackOpenClass: 'is-open',
  });
  expect(released).toBe(true);
});

test('a closed manual overlay returns focus to the remembered owner', () => {
  const ownerDocument: { activeElement: unknown } = { activeElement: null };
  const owner = {
    isConnected: true,
    focus: () => {
      ownerDocument.activeElement = owner;
    },
  };
  const focused = {
    focus: () => undefined,
    blur: () => {
      throw new Error('the owner took focus');
    },
  };
  ownerDocument.activeElement = focused;
  const panel = {
    ownerDocument,
    contains: (node: unknown) => node === focused,
    matches: () => false,
    hidePopover: () => undefined,
    classList: { remove: () => undefined },
  } as unknown as HTMLElement;
  hideAnchoredOverlay({
    manual: true,
    overlay: panel,
    focusReturn: owner as unknown as HTMLElement,
    previousFocus: () => owner as unknown as HTMLElement,
    gapVariable: '--gap',
    leftVariable: '--left',
    topVariable: '--top',
    fallbackOpenClass: 'is-open',
  });
  expect(ownerDocument.activeElement).toBe(owner);
});

test('a light-dismissed overlay leaves focus to the engine', () => {
  const focused = {
    focus: () => undefined,
    blur: () => {
      throw new Error('the engine owns this close');
    },
  };
  const panel = {
    ownerDocument: { activeElement: focused },
    contains: (node: unknown) => node === focused,
    matches: () => false,
    hidePopover: () => undefined,
    classList: { remove: () => undefined },
  } as unknown as HTMLElement;
  hideAnchoredOverlay({
    overlay: panel,
    gapVariable: '--gap',
    leftVariable: '--left',
    topVariable: '--top',
    fallbackOpenClass: 'is-open',
  });
});

test('native top-layer popovers ignore ancestor CSS scale while preserving CSS zoom', () => {
  const saved = ['window', 'document', 'getComputedStyle'].map(
    (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const,
  );
  const values = new Map<string, string>();
  const stageAncestor = { parentElement: null };
  const styleByElement = new Map<unknown, Record<string, unknown>>();
  const trigger = {
    parentElement: stageAncestor,
    getBoundingClientRect: () => ({
      top: 320,
      bottom: 352,
      left: 585.5,
      right: 633.5,
      width: 48,
      height: 32,
    }),
  } as unknown as HTMLElement;
  const overlay = {
    parentElement: stageAncestor,
    showPopover: () => undefined,
    hidePopover: () => undefined,
    matches: (selector: string) => selector === ':popover-open',
    classList: { contains: () => false },
    offsetWidth: 160,
    offsetHeight: 120,
    dataset: {},
    style: { setProperty: (name: string, value: string) => values.set(name, value) },
    getBoundingClientRect: () => ({ left: 585.5, top: 360, width: 160, height: 120 }),
  } as unknown as HTMLElement;
  const stageStyle = { zoom: '1', scale: '0.38' };
  const overlayStyle = {
    zoom: '1',
    fontSize: '16px',
    scale: 'none',
    translate: 'none',
    transformOrigin: '0px 0px',
    getPropertyValue: () => '8px',
  };
  styleByElement.set(stageAncestor, stageStyle);
  styleByElement.set(overlay, overlayStyle);

  try {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { innerWidth: 1200, innerHeight: 800 },
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { documentElement: { clientWidth: 1200, clientHeight: 800 } },
    });
    Object.defineProperty(globalThis, 'getComputedStyle', {
      configurable: true,
      value: (element: unknown) => styleByElement.get(element) ?? overlayStyle,
    });

    positionAnchoredOverlay({
      trigger,
      overlay,
      gapVariable: '--gap',
      leftVariable: '--left',
      topVariable: '--top',
      inlineSizeVariable: '--inline',
      matchTriggerWidth: true,
      fallbackOpenClass: 'open',
    });

    expect(Number.parseFloat(values.get('--left') ?? '')).toBeCloseTo(585.5);
    expect(Number.parseFloat(values.get('--top') ?? '')).toBeCloseTo(360);
    expect(Number.parseFloat(values.get('--inline') ?? '')).toBeCloseTo(48);

    // When an ancestor sets CSS zoom, top-layer popovers still inherit that zoom.
    values.clear();
    stageStyle.zoom = '2';
    positionAnchoredOverlay({
      trigger,
      overlay,
      gapVariable: '--gap',
      leftVariable: '--left',
      topVariable: '--top',
      inlineSizeVariable: '--inline',
      matchTriggerWidth: true,
      fallbackOpenClass: 'open',
    });

    expect(Number.parseFloat(values.get('--left') ?? '')).toBeCloseTo(292.75);
    expect(Number.parseFloat(values.get('--top') ?? '')).toBeCloseTo(184);
    expect(Number.parseFloat(values.get('--inline') ?? '')).toBeCloseTo(24);
  } finally {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
