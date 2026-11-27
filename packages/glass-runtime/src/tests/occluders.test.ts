import { describe, expect, it, vi } from 'vitest';
import { collectOccluders } from '../index';
import { createFakeGl, installCanvasContext } from './fake-webgl.test-support';
import {
  createTestRenderer,
  registerGlassRendererSuiteHooks,
  setRect,
} from './runtime.test-support';

describe('Glass renderer occluders', () => {
  registerGlassRendererSuiteHooks();

  it('masks a Glass edge wherever an overlay paints above the surface', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const drawer = document.createElement('aside');
    drawer.className = 'material-glass-elevated';
    setRect(drawer, { left: 0, top: 0, width: 296, height: 800 });
    const card = document.createElement('article');
    card.className = 'ui-card material-glass-elevated';
    setRect(card, { left: 200, top: 100, width: 460, height: 171 });
    document.body.append(drawer, card);
    // Hit-test like the browser: the drawer paints above the card, so points
    // inside the drawer resolve to [drawer, card] and everything else to [card].
    const withHitTest = (implementation: (x: number, y: number) => Element[]): void => {
      Reflect.defineProperty(document, 'elementsFromPoint', {
        configurable: true,
        value: implementation,
      });
    };
    withHitTest((x, y) => (x < 296 && y < 800 ? [drawer, card] : [card]));
    try {
      createTestRenderer({ maxDevicePixelRatio: 1 }).mount();

      // DOM order draws the drawer first: nothing paints above it, so its own
      // edge stays unmasked and the card's edge carries exactly one occluder.
      expect(gl.uniform1f).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'u_occluder_count' }),
        0,
      );
      expect(gl.uniform1f).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'u_occluder_count' }),
        1,
      );
      const occluderCall = gl.uniform4fv.mock.calls.find(
        ([location]) => (location as { name?: string }).name === 'u_occluders',
      );
      expect(occluderCall).toBeDefined();
      const uploaded = occluderCall?.[1] as Float32Array;
      expect([uploaded[0], uploaded[1], uploaded[2], uploaded[3]]).toEqual([0, 0, 296, 800]);
    } finally {
      Reflect.deleteProperty(document, 'elementsFromPoint');
    }
  });

  it('keeps an unoccluded Glass edge free of occluder uniforms', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-elevated';
    setRect(glass, { left: 300, top: 100 });
    document.body.append(glass);
    Reflect.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [glass],
    });
    try {
      createTestRenderer({ maxDevicePixelRatio: 1 }).mount();

      expect(gl.uniform1f).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'u_occluder_count' }),
        0,
      );
    } finally {
      Reflect.deleteProperty(document, 'elementsFromPoint');
    }
  });

  it('collects only the overlays that paint above the surface at its sample points', () => {
    const drawer = document.createElement('aside');
    const scrim = document.createElement('button');
    const card = document.createElement('article');
    const badge = document.createElement('span');
    card.append(badge);
    document.body.append(scrim, drawer, card);
    setRect(drawer, { left: 0, top: 0, width: 296, height: 800 });
    setRect(scrim, { left: 0, top: 0, width: 1100, height: 800 });
    setRect(card, { left: 300, top: 100, width: 460, height: 171 });

    const fakeDocument = {
      elementsFromPoint: (x: number, y: number): Element[] => {
        if (x < 320 && y < 800) return [scrim, drawer, card];
        if (x > 500 && y > 150 && y < 220) return [badge, card];
        return [card];
      },
    } as unknown as Document;

    const occluders = collectOccluders(card, card.getBoundingClientRect(), fakeDocument, window);

    // The center sample resolves to [badge, card]: the badge is the card's
    // own descendant and must not count as an occluder. The left sample
    // resolves under the drawer and the scrim, both fully above the card.
    expect(occluders).toHaveLength(2);
    const widths = occluders.map((occluder) => occluder.width);
    expect(widths).toContain(296);
    expect(widths).toContain(1100);
    // The larger intersection (the full-viewport scrim) is kept first so the
    // capped uniform array drops the least significant overlays first.
    expect(occluders[0]?.width).toBe(1100);
  });

  it('finds a Glass overlay crossing an edge between the fixed sample points', () => {
    const card = document.createElement('article');
    const overlay = document.createElement('aside');
    document.body.append(card, overlay);
    setRect(card, { left: 100, top: 100, width: 400, height: 600 });
    setRect(overlay, { left: 80, top: 130, width: 80, height: 60 });
    const fakeDocument = {
      elementsFromPoint: (x: number, y: number): Element[] =>
        x >= 80 && x <= 160 && y >= 130 && y <= 190 ? [overlay, card] : [card],
    } as unknown as Document;

    const occluders = collectOccluders(card, card.getBoundingClientRect(), fakeDocument, window, [
      { element: overlay, rect: overlay.getBoundingClientRect() },
    ]);
    expect(occluders).toHaveLength(1);
    expect(occluders[0]?.left).toBe(80);

    overlay.style.opacity = '0';
    expect(
      collectOccluders(card, card.getBoundingClientRect(), fakeDocument, window, [
        { element: overlay, rect: overlay.getBoundingClientRect() },
      ]),
    ).toHaveLength(0);
  });

  it('routes every occlusion probe through the supplied hit test', () => {
    const card = document.createElement('article');
    const overlay = document.createElement('aside');
    document.body.append(card, overlay);
    setRect(card, { left: 100, top: 100, width: 400, height: 600 });
    setRect(overlay, { left: 80, top: 130, width: 80, height: 60 });
    const fakeDocument = {
      elementsFromPoint: (): Element[] => {
        throw new Error('the per-frame cache must own hit testing');
      },
    } as unknown as Document;

    const probed: string[] = [];
    const occluders = collectOccluders(
      card,
      card.getBoundingClientRect(),
      fakeDocument,
      window,
      [{ element: overlay, rect: overlay.getBoundingClientRect() }],
      false,
      {
        hitTest: (x, y) => {
          probed.push(`${x},${y}`);
          return x >= 80 && x <= 160 && y >= 130 && y <= 190 ? [overlay, card] : [card];
        },
      },
    );

    expect(probed.length).toBeGreaterThan(0);
    expect(occluders).toHaveLength(1);
    expect(occluders[0]?.left).toBe(80);
  });

  it('does not let a transparent native choice input mask its visible control', () => {
    const label = document.createElement('label');
    const native = document.createElement('input');
    const control = document.createElement('span');
    native.style.opacity = '0';
    label.append(native, control);
    document.body.append(label);
    setRect(native, { left: 20, top: 30, width: 100, height: 40 });
    setRect(control, { left: 20, top: 30, width: 20, height: 20 });
    const fakeDocument = {
      elementsFromPoint: (): Element[] => [native, control, label],
    } as unknown as Document;

    expect(
      collectOccluders(control, control.getBoundingClientRect(), fakeDocument, window),
    ).toEqual([]);
    native.style.opacity = '1';
    expect(
      collectOccluders(control, control.getBoundingClientRect(), fakeDocument, window),
    ).toHaveLength(1);
  });

  it('finds a nested Glass overlay over the inside of a table grid', () => {
    const table = document.createElement('table');
    const cell = table.insertRow().insertCell();
    const overlay = document.createElement('div');
    cell.append(overlay);
    document.body.append(table);
    setRect(table, { left: 20, top: 20, width: 400, height: 300 });
    setRect(overlay, { left: 150, top: 100, width: 80, height: 60 });
    const fakeDocument = {
      elementsFromPoint: (x: number, y: number): Element[] =>
        x >= 150 && x <= 230 && y >= 100 && y <= 160 ? [overlay, cell, table] : [cell, table],
    } as unknown as Document;
    const candidates = [{ element: overlay, rect: overlay.getBoundingClientRect() }];

    expect(
      collectOccluders(table, table.getBoundingClientRect(), fakeDocument, window, candidates),
    ).toEqual([]);
    expect(
      collectOccluders(
        table,
        table.getBoundingClientRect(),
        fakeDocument,
        window,
        candidates,
        true,
      ),
    ).toHaveLength(1);
  });

  it('uses an explicitly topmost pointer-transparent overlay as an occluder', () => {
    const card = document.createElement('article');
    const overlay = document.createElement('aside');
    overlay.style.pointerEvents = 'none';
    overlay.setAttribute('data-neoverse-glass-occluder', 'topmost');
    document.body.append(card, overlay);
    setRect(card, { left: 100, top: 100, width: 400, height: 600 });
    setRect(overlay, { left: 80, top: 130, width: 80, height: 60 });
    const fakeDocument = { elementsFromPoint: (): Element[] => [card] } as unknown as Document;

    const occluders = collectOccluders(card, card.getBoundingClientRect(), fakeDocument, window, [
      { element: overlay, rect: overlay.getBoundingClientRect() },
    ]);
    expect(occluders).toHaveLength(1);
    expect(occluders[0]?.left).toBe(80);
    overlay.style.visibility = 'hidden';
    expect(
      collectOccluders(card, card.getBoundingClientRect(), fakeDocument, window, [
        { element: overlay, rect: overlay.getBoundingClientRect() },
      ]),
    ).toHaveLength(0);
    expect(
      collectOccluders(overlay, overlay.getBoundingClientRect(), fakeDocument, window, [
        { element: overlay, rect: overlay.getBoundingClientRect() },
      ]),
    ).toHaveLength(0);
  });

  it('uploads the pointer-transparent overlay mask in the real rendering path', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const card = document.createElement('article');
    card.className = 'material-glass-elevated';
    const overlay = document.createElement('aside');
    overlay.className = 'material-glass-elevated';
    overlay.style.pointerEvents = 'none';
    overlay.setAttribute('data-neoverse-glass-occluder', 'topmost');
    document.body.append(card, overlay);
    setRect(card, { left: 100, top: 100, width: 400, height: 600 });
    setRect(overlay, { left: 80, top: 130, width: 80, height: 60 });
    Reflect.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: (): Element[] => [card],
    });
    try {
      createTestRenderer({ maxDevicePixelRatio: 1 }).mount();
      expect(
        gl.uniform4fv.mock.calls.some(([location, values]) => {
          if ((location as { name?: string }).name !== 'u_occluders') return false;
          const rect = values as Float32Array;
          return rect[0] === 80 && rect[1] === 130 && rect[2] === 80 && rect[3] === 60;
        }),
      ).toBe(true);
    } finally {
      Reflect.deleteProperty(document, 'elementsFromPoint');
    }
  });

  it('retains a topmost overlay when other occluders fill the shader limit', () => {
    const card = document.createElement('article');
    const covers = Array.from({ length: 6 }, () => document.createElement('aside'));
    const topmost = document.createElement('aside');
    topmost.setAttribute('data-neoverse-glass-occluder', 'topmost');
    document.body.append(card, ...covers, topmost);
    setRect(card, { left: 100, top: 100, width: 400, height: 600 });
    for (const cover of covers) setRect(cover, { left: 200, top: 100, width: 300, height: 100 });
    setRect(topmost, { left: 80, top: 130, width: 80, height: 60 });
    const fakeDocument = {
      elementsFromPoint: (x: number, y: number): Element[] =>
        x >= 200 && y < 200 ? [...covers, card] : [card],
    } as unknown as Document;
    const occluders = collectOccluders(card, card.getBoundingClientRect(), fakeDocument, window, [
      { element: topmost, rect: topmost.getBoundingClientRect() },
    ]);
    expect(occluders).toHaveLength(6);
    expect(occluders.some((occluder) => occluder.left === 80 && occluder.width === 80)).toBe(true);
  });

  it('does not mask an edge for a Glass candidate painted underneath it', () => {
    const card = document.createElement('article');
    const underlay = document.createElement('aside');
    document.body.append(underlay, card);
    setRect(card, { left: 100, top: 100, width: 400, height: 600 });
    setRect(underlay, { left: 80, top: 130, width: 80, height: 60 });
    const fakeDocument = {
      elementsFromPoint: (): Element[] => [card, underlay],
    } as unknown as Document;

    expect(
      collectOccluders(card, card.getBoundingClientRect(), fakeDocument, window, [
        { element: underlay, rect: underlay.getBoundingClientRect() },
      ]),
    ).toHaveLength(0);
  });

  it('avoids extra hit tests for candidates away from the surface edge', () => {
    const card = document.createElement('article');
    const inner = document.createElement('aside');
    const outside = document.createElement('aside');
    document.body.append(card, inner, outside);
    setRect(card, { left: 100, top: 100, width: 400, height: 600 });
    setRect(inner, { left: 220, top: 250, width: 60, height: 60 });
    setRect(outside, { left: 600, top: 100, width: 60, height: 60 });
    const hitTest = vi.fn((): Element[] => [card]);
    const fakeDocument = { elementsFromPoint: hitTest } as unknown as Document;
    expect(
      collectOccluders(card, card.getBoundingClientRect(), fakeDocument, window, [
        { element: inner, rect: inner.getBoundingClientRect() },
        { element: outside, rect: outside.getBoundingClientRect() },
      ]),
    ).toHaveLength(0);
    expect(hitTest).toHaveBeenCalledTimes(5);
  });

  it('skips sample points that miss the surface silhouette entirely', () => {
    const other = document.createElement('div');
    const card = document.createElement('article');
    document.body.append(other, card);
    setRect(card, { left: 300, top: 100, width: 460, height: 171 });
    const fakeDocument = {
      // A rounded-corner point misses the card; slice(-1) would otherwise
      // promote unrelated stack entries to occluders.
      elementsFromPoint: (x: number): Element[] => (x < 310 ? [other] : [card]),
    } as unknown as Document;

    const occluders = collectOccluders(card, card.getBoundingClientRect(), fakeDocument, window);

    expect(occluders).toHaveLength(0);
  });

  it('clamps pill border radii on circular occluders to half the short side', () => {
    const surface = document.createElement('div');
    const badge = document.createElement('button');
    badge.style.borderRadius = '9999px';
    badge.setAttribute('data-neoverse-glass-occluder', 'topmost');
    document.body.append(surface, badge);
    setRect(surface, { left: 100, top: 100, width: 220, height: 38 });
    setRect(badge, { left: 304, top: 92, width: 24, height: 24 });
    const fakeDocument = {
      elementsFromPoint: (): Element[] => [badge, surface],
    } as unknown as Document;

    const occluders = collectOccluders(
      surface,
      surface.getBoundingClientRect(),
      fakeDocument,
      window,
      [{ element: badge, rect: badge.getBoundingClientRect() }],
    );

    expect(occluders).toHaveLength(1);
    expect(occluders[0]?.radius).toBe(12);
  });
});
