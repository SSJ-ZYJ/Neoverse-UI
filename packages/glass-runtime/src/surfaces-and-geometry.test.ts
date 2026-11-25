import { describe, expect, it, vi } from 'vitest';
import { createFakeGl, installCanvasContext } from './fake-webgl.test-support';
import {
  createTestRenderer,
  installFrameQueue,
  registerGlassRendererSuiteHooks,
  setRect,
} from './runtime.test-support';

describe('Glass renderer surfaces and geometry', () => {
  registerGlassRendererSuiteHooks();

  it.each([
    ['ui-table', 'light'],
    ['ui-table', 'dark'],
    ['prose', 'light'],
    ['prose', 'dark'],
  ])('draws a %s table outline and its actual internal borders in %s mode', (kind, theme) => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    document.documentElement.style.colorScheme = theme;
    const table = document.createElement('table');
    table.style.backdropFilter = 'blur(12px)';
    table.style.setProperty(
      '--neoverse-material-edge-refraction-opacity',
      theme === 'dark' ? '0.5' : '0.16',
    );
    if (kind === 'ui-table') table.className = 'ui-table';
    else {
      const prose = document.createElement('article');
      prose.className = 'neoverse-prose';
      prose.append(table);
      document.body.append(prose);
    }
    const row = table.insertRow();
    const first = row.insertCell();
    const second = row.insertCell();
    first.style.borderRight = '1px solid black';
    setRect(table, { left: 20, top: 30, width: 200, height: 40 });
    setRect(row, { left: 20, top: 30, width: 200, height: 40 });
    setRect(first, { left: 20, top: 30, width: 100, height: 40 });
    setRect(second, { left: 120, top: 30, width: 100, height: 40 });
    if (kind === 'ui-table') document.body.append(table);

    createTestRenderer().mount();

    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_opacity' }),
      theme === 'dark' ? 0.5 : 0.16,
    );
    expect(table.style.backdropFilter).toBe('blur(12px)');
    expect(gl.uniform4f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_rect' }),
      20,
      30,
      200,
      40,
    );
    expect(gl.uniform4f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_rect' }),
      20,
      30,
      100,
      40,
    );
  });

  it('keeps a large captioned table bottom in the shared perimeter draw', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const region = document.createElement('div');
    region.style.overflow = 'auto';
    setRect(region, { left: 20, top: 40, width: 900, height: 320 });
    const table = document.createElement('table');
    table.className = 'ui-table';
    table.style.setProperty('--neoverse-material-edge-refraction-opacity', '0.16');
    setRect(table, { left: 20, top: 40, width: 900, height: 320 });
    setRect(table.createCaption(), { left: 20, top: 40, width: 900, height: 20 });
    setRect(table.createTBody().insertRow(), { left: 20, top: 70, width: 900, height: 290 });
    region.append(table);
    document.body.append(region);

    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();
    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    expect(canvas).not.toBeNull();
    if (!canvas) return;
    setRect(canvas, { left: 0, top: 0, width: 1000, height: 500 });
    gl.scissor.mockClear();
    renderer.refresh();

    expect(gl.uniform4f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_rect' }),
      20,
      70,
      900,
      290,
    );
    expect(gl.scissor).toHaveBeenCalledWith(20, 140, 900, 5);
    expect(gl.uniform1f).toHaveBeenCalledWith(expect.objectContaining({ name: 'u_opacity' }), 0.16);
  });

  it.each([
    ['ui-card', 'light', 1],
    ['ui-card', 'dark', 0],
    ['ui-surface', 'light', 1],
    ['ui-surface', 'dark', 0],
  ])('keeps %s on the %s WebGL edge pass', (className, theme, lightSurface) => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = `${className} material-glass-elevated`;
    setRect(glass, {});
    document.body.append(glass);
    document.documentElement.style.colorScheme = theme;

    createTestRenderer().mount();

    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_light_surface' }),
      lightSurface,
    );
  });

  it('uses the fixed canvas viewport and clips each edge draw to its surface', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, { left: 30, top: 40, width: 100, height: 60 });
    document.body.append(glass);

    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();
    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    expect(canvas).not.toBeNull();
    if (canvas === null) {
      return;
    }
    setRect(canvas, { left: 10, top: 20, width: 240, height: 120 });

    renderer.refresh();

    expect(gl.viewport).toHaveBeenLastCalledWith(0, 0, 240, 120);
    const viewportUniformCalls = gl.uniform2f.mock.calls.filter(
      ([location]) => location?.name === 'u_viewport',
    );
    expect(viewportUniformCalls.at(-1)).toEqual([
      expect.objectContaining({ name: 'u_viewport' }),
      240,
      120,
    ]);
    const rectUniformCalls = gl.uniform4f.mock.calls.filter(
      ([location]) => location?.name === 'u_rect',
    );
    expect(rectUniformCalls.at(-1)).toEqual([
      expect.objectContaining({ name: 'u_rect' }),
      20,
      20,
      100,
      60,
    ]);
    expect(gl.scissor).toHaveBeenLastCalledWith(20, 40, 100, 60);
    expect(gl.disable).toHaveBeenLastCalledWith(gl.SCISSOR_TEST);
  });

  it('clips WebGL edges to overflow-clipping ancestors', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });

    const viewport = document.createElement('section');
    viewport.style.overflow = 'hidden';
    setRect(viewport, { left: 20, top: 30, width: 80, height: 50 });

    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, { left: 10, top: 20, width: 120, height: 80 });
    viewport.append(glass);
    document.body.append(viewport);

    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();
    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    expect(canvas).not.toBeNull();
    if (canvas === null) return;

    setRect(canvas, { left: 0, top: 0, width: 200, height: 150 });
    gl.scissor.mockClear();
    renderer.refresh();

    expect(gl.scissor).toHaveBeenLastCalledWith(20, 70, 80, 50);
  });

  it('keeps sibling Glass edges clipped as a shared ancestor scrolls', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const scroller = document.createElement('section');
    scroller.style.overflow = 'auto';
    setRect(scroller, { left: 20, top: 30, width: 120, height: 70 });
    const clip = document.createElement('div');
    clip.style.overflow = 'hidden';
    setRect(clip, { left: 35, top: 60, width: 110, height: 50 });
    for (const left of [25, 90]) {
      const glass = document.createElement('article');
      glass.className = 'material-glass-subtle';
      setRect(glass, { left, top: 10, width: 50, height: 120 });
      clip.append(glass);
    }
    scroller.append(clip);
    document.body.append(scroller);

    const frames = installFrameQueue();
    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();
    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    if (canvas === null) throw new Error('Missing Glass renderer canvas');
    setRect(canvas, { left: 0, top: 0, width: 200, height: 150 });

    for (const [timestamp, top, scissors] of [
      [
        1000,
        60,
        [
          [35, 50, 40, 40],
          [90, 50, 50, 40],
        ],
      ],
      [
        1030,
        45,
        [
          [35, 55, 40, 50],
          [90, 55, 50, 50],
        ],
      ],
    ] as const) {
      setRect(clip, { left: 35, top, width: 110, height: 50 });
      gl.scissor.mockClear();
      vi.mocked(scroller.getBoundingClientRect).mockClear();
      vi.mocked(clip.getBoundingClientRect).mockClear();
      scroller.dispatchEvent(new Event('scroll'));
      frames.flush(timestamp);

      expect(gl.scissor.mock.calls).toEqual(scissors);
      expect(scroller.getBoundingClientRect).toHaveBeenCalledTimes(1);
      expect(clip.getBoundingClientRect).toHaveBeenCalledTimes(1);
    }
  });

  it('extends the tooltip contour to its resolved pointer while preserving zoom and clipping', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const viewport = document.createElement('section');
    viewport.style.overflow = 'hidden';
    setRect(viewport, { left: 0, top: 0, width: 300, height: 95 });
    const tooltip = document.createElement('div');
    tooltip.className = 'material-glass-subtle';
    tooltip.setAttribute('data-neoverse-tooltip-surface', '');
    tooltip.style.cssText =
      'overflow: visible; border: 1px solid transparent; border-radius: 12px;';
    Object.defineProperty(tooltip, 'offsetWidth', { configurable: true, value: 100 });
    setRect(tooltip, { width: 150, height: 90 });
    viewport.append(tooltip);
    document.body.append(viewport);
    const computedStyle = window.getComputedStyle.bind(window);
    const arrowStyle = document.createElement('div').style;
    arrowStyle.cssText = 'display: block; left: 40px; width: 16px; height: 6px;';
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) =>
      element === tooltip && pseudo === '::after' ? arrowStyle : computedStyle(element),
    );

    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();
    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    expect(canvas).not.toBeNull();
    if (canvas === null) return;
    setRect(canvas, { width: 300, height: 150 });
    renderer.refresh();

    expect(gl.uniform3f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_pointer' }),
      -13.5,
      12,
      9,
    );
    expect(gl.uniform4f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_rect' }),
      0,
      0,
      150,
      99,
    );
    expect(gl.uniform2f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_rect_size' }),
      150,
      90,
    );
    expect(gl.uniform4f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_radii' }),
      18,
      18,
      18,
      18,
    );
    expect(gl.scissor).toHaveBeenLastCalledWith(0, 55, 150, 95);

    arrowStyle.display = 'none';
    gl.uniform3f.mockClear();
    renderer.refresh();
    expect(gl.uniform3f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_pointer' }),
      0,
      0,
      0,
    );
    expect(gl.scissor).toHaveBeenLastCalledWith(0, 60, 150, 90);
  });

  it('keeps square corners when CSS does not declare a surface radius', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, { width: 100, height: 60 });
    document.body.append(glass);

    const renderer = createTestRenderer();
    renderer.mount();

    const radiiCall = gl.uniform4f.mock.calls
      .filter(([location]) => location?.name === 'u_radii')
      .at(-1);
    expect(radiiCall).toEqual([expect.objectContaining({ name: 'u_radii' }), 0, 0, 0, 0]);
  });

  it('preserves explicitly rounded CSS corners', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    glass.style.borderRadius = '12px';
    setRect(glass, { width: 100, height: 60 });
    document.body.append(glass);

    const renderer = createTestRenderer();
    renderer.mount();

    const radiiCall = gl.uniform4f.mock.calls
      .filter(([location]) => location?.name === 'u_radii')
      .at(-1);
    expect(radiiCall).toEqual([expect.objectContaining({ name: 'u_radii' }), 12, 12, 12, 12]);
  });

  it('scales the WebGL corner radius to match CSS when a parent enlarges the control', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    glass.style.borderRadius = '12px';
    Object.defineProperty(glass, 'offsetWidth', { configurable: true, value: 100 });
    setRect(glass, { width: 150, height: 90 });
    document.body.append(glass);

    const renderer = createTestRenderer();
    renderer.mount();

    const radiiCall = gl.uniform4f.mock.calls
      .filter(([location]) => location?.name === 'u_radii')
      .at(-1);
    expect(radiiCall).toEqual([expect.objectContaining({ name: 'u_radii' }), 18, 18, 18, 18]);
  });
});
