import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeGl, installCanvasContext } from './fake-webgl.test-support';
import { createGlassRenderer, glassRendererAttribute } from './index';

const setRect = (element: HTMLElement, rect: Partial<DOMRect>): void => {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    bottom: (rect.top ?? 0) + (rect.height ?? 120),
    height: rect.height ?? 120,
    left: rect.left ?? 0,
    right: (rect.left ?? 0) + (rect.width ?? 240),
    top: rect.top ?? 0,
    width: rect.width ?? 240,
    x: rect.left ?? 0,
    y: rect.top ?? 0,
    toJSON: () => ({}),
  });
};

const setOffsetBox = (element: HTMLElement, width: number, height: number): void => {
  Object.defineProperty(element, 'offsetWidth', { configurable: true, value: width });
  Object.defineProperty(element, 'offsetHeight', { configurable: true, value: height });
};

const mountedRenderers: Array<ReturnType<typeof createGlassRenderer>> = [];
const createTestRenderer = (...args: Parameters<typeof createGlassRenderer>) => {
  const renderer = createGlassRenderer(...args);
  mountedRenderers.push(renderer);
  return renderer;
};

describe('Glass surface geometry and top-layer exclusion', () => {
  afterEach(() => {
    for (const renderer of mountedRenderers) renderer.destroy();
    mountedRenderers.length = 0;
  });

  beforeEach(() => {
    document.documentElement.removeAttribute(glassRendererAttribute);
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('uploads rotated basis and uninflated local box instead of an inflated AABB', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const card = document.createElement('article');
    card.className = 'material-glass-elevated';
    card.style.rotate = '-3deg';
    card.style.scale = '0.96';
    setOffsetBox(card, 300, 120);
    // Exact AABB of a 300x120 box rotated -3deg and scaled 0.96 around (250, 160).
    const rad = (-3 * Math.PI) / 180;
    const c = Math.abs(Math.cos(rad)) * 0.96;
    const s = Math.abs(Math.sin(rad)) * 0.96;
    const aabbW = 300 * c + 120 * s;
    const aabbH = 300 * s + 120 * c;
    setRect(card, {
      left: 250 - aabbW / 2,
      top: 160 - aabbH / 2,
      width: aabbW,
      height: aabbH,
    });
    document.body.append(card);

    createTestRenderer({ maxDevicePixelRatio: 1 }).mount();

    const sizeCall = gl.uniform2f.mock.calls
      .filter(([location]) => location?.name === 'u_rect_size')
      .at(-1);
    expect(sizeCall?.[1]).toBeCloseTo(288, 1);
    expect(sizeCall?.[2]).toBeCloseTo(115.2, 1);

    const basisCall = gl.uniform4f.mock.calls
      .filter(([location]) => location?.name === 'u_basis')
      .at(-1);
    expect(basisCall?.[1]).toBeCloseTo(Math.cos(rad), 4);
    expect(basisCall?.[2]).toBeCloseTo(Math.sin(rad), 4);
    expect(basisCall?.[3]).toBeCloseTo(-Math.sin(rad), 4);
    expect(basisCall?.[4]).toBeCloseTo(Math.cos(rad), 4);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });

  it('keeps a rounded button aligned when magnifying a fractional-width border box', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const stage = document.createElement('div');
    stage.style.scale = '4';
    const button = document.createElement('button');
    button.className = 'ui-button material-glass-subtle';
    button.style.borderRadius = '8px';
    // A 48.5px layout width rounds up through offsetWidth, but not on screen.
    setOffsetBox(button, 49, 32);
    setRect(button, { left: 12.5, top: 20.25, width: 194, height: 128 });
    stage.append(button);
    document.body.append(stage);

    createTestRenderer({ maxDevicePixelRatio: 1 }).mount();

    expect(gl.uniform4f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_radii' }),
      32,
      32,
      32,
      32,
    );
  });

  it('supports percentage border-radius and CSS §4.5 proportional radius clamping', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const circle = document.createElement('div');
    circle.className = 'material-glass-subtle';
    circle.style.borderRadius = '50%';
    setRect(circle, { width: 200, height: 200 });
    document.body.append(circle);

    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();
    expect(
      gl.uniform4f.mock.calls.filter(([location]) => location?.name === 'u_radii').at(-1),
    ).toEqual([expect.objectContaining({ name: 'u_radii' }), 100, 100, 100, 100]);

    circle.remove();
    const uneven = document.createElement('div');
    uneven.className = 'material-glass-subtle';
    uneven.style.borderRadius = '80px 80px 0px 0px';
    setRect(uneven, { width: 100, height: 40 });
    document.body.append(uneven);
    renderer.refresh();

    // top = 160 (100/160 = 0.625), left = 80 (40/80 = 0.5), right = 80 (40/80 = 0.5)
    // => factor = 0.5 => tr=40, br=0, bl=0, tl=40.
    expect(
      gl.uniform4f.mock.calls.filter(([location]) => location?.name === 'u_radii').at(-1),
    ).toEqual([expect.objectContaining({ name: 'u_radii' }), 40, 0, 0, 40]);
  });

  it('attenuates WebGL edge opacity under filter blur and restores it when blur clears', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const card = document.createElement('article');
    card.className = 'material-glass-elevated';
    card.style.setProperty('--neoverse-material-edge-refraction-opacity', '0.5');
    card.style.filter = 'blur(8px)';
    setRect(card, { width: 200, height: 100 });
    document.body.append(card);

    const renderer = createTestRenderer();
    renderer.mount();
    const blurredOpacity = gl.uniform1f.mock.calls
      .filter(([location]) => location?.name === 'u_opacity')
      .at(-1)?.[1];
    expect(blurredOpacity).toBeCloseTo(0.5 / (1 + 8 * 0.5), 4);

    card.style.filter = 'blur(0px)';
    renderer.refresh();
    const sharpOpacity = gl.uniform1f.mock.calls
      .filter(([location]) => location?.name === 'u_opacity')
      .at(-1)?.[1];
    expect(sharpOpacity).toBeCloseTo(0.5, 4);
  });

  it('excludes native top-layer elements and descendants while keeping them as occluders', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const card = document.createElement('article');
    card.className = 'material-glass-elevated';
    setRect(card, { left: 40, top: 40, width: 300, height: 200 });

    const modal = document.createElement('dialog');
    modal.open = true;
    modal.style.display = 'block';
    modal.className = 'material-glass-elevated';
    const childButton = document.createElement('button');
    childButton.className = 'ui-button material-glass-subtle';
    modal.append(childButton);
    setRect(modal, { left: 60, top: 60, width: 200, height: 140 });
    setRect(childButton, { left: 80, top: 90, width: 100, height: 32 });
    // Simulate a top-layer leaving state via CSS `overlay: auto` (supported even in happy-dom).
    modal.style.setProperty('overlay', 'auto');

    const fallbackPopover = document.createElement('div');
    fallbackPopover.className =
      'ui-overlay-panel material-glass-elevated ui-overlay-panel--fallback-open';
    setRect(fallbackPopover, { left: 400, top: 40, width: 180, height: 100 });

    document.body.append(card, modal, fallbackPopover);
    Reflect.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [modal, card],
    });
    try {
      createTestRenderer({ maxDevicePixelRatio: 1 }).mount();

      // Only the document-layer card and non-top-layer fallback popover are drawn (2 draws).
      expect(gl.drawArrays).toHaveBeenCalledTimes(2);
      // The top-layer modal still occludes the underlying card.
      expect(gl.uniform1f).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'u_occluder_count' }),
        1,
      );
    } finally {
      Reflect.deleteProperty(document, 'elementsFromPoint');
    }
  });

  it('does not clip position:fixed glass surfaces against ordinary overflow:hidden ancestors', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const clipWrapper = document.createElement('div');
    clipWrapper.style.overflow = 'hidden';
    setRect(clipWrapper, { left: 0, top: 0, width: 100, height: 100 });

    const toast = document.createElement('div');
    toast.className = 'ui-toast material-glass-elevated';
    toast.style.position = 'fixed';
    setRect(toast, { left: 200, top: 200, width: 180, height: 40 });
    clipWrapper.append(toast);
    document.body.append(clipWrapper);

    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();
    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    if (!canvas) throw new Error('Missing Glass canvas');
    setRect(canvas, { left: 0, top: 0, width: 800, height: 600 });
    gl.drawArrays.mockClear();
    gl.scissor.mockClear();

    renderer.refresh();
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    expect(gl.scissor).toHaveBeenLastCalledWith(200, 360, 180, 40);
  });
});
