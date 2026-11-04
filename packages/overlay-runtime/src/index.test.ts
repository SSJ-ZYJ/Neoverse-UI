import { expect, test } from 'bun:test';
import { positionAnchoredOverlay, resolveAnchoredPosition } from './index';

const viewport = { width: 1200, height: 800 };

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
