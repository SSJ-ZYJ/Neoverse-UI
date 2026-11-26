import { describe, expect, it, vi } from 'vitest';
import { createFakeGl, installCanvasContext } from './fake-webgl.test-support';
import { glassRendererAttribute } from './index';
import {
  createTestRenderer,
  installFrameQueue,
  registerGlassRendererSuiteHooks,
  setRect,
} from './runtime.test-support';

describe('Glass renderer lifecycle and observers', () => {
  registerGlassRendererSuiteHooks();

  it.each(['light', 'dark'])('restores %s Glass with the overlay fallback', (theme) => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    document.documentElement.style.colorScheme = theme;
    const css = window.CSS;
    vi.spyOn(css, 'supports').mockReturnValue(false);
    vi.spyOn(window, 'CSS', 'get').mockReturnValue(css);
    const renderer = createTestRenderer();
    renderer.mount();

    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    const contextLost = new Event('webglcontextlost', { cancelable: true });
    canvas?.dispatchEvent(contextLost);

    expect(contextLost.defaultPrevented).toBe(true);
    expect(canvas?.isConnected).toBe(true);
    expect(canvas?.style.display).toBe('none');
    expect(document.documentElement.hasAttribute(glassRendererAttribute)).toBe(false);

    canvas?.dispatchEvent(new Event('webglcontextrestored'));

    const restoredCanvas = document.querySelector<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    expect(restoredCanvas).not.toBeNull();
    expect(restoredCanvas).not.toBe(canvas);
    expect(restoredCanvas?.style.display).toBe('block');
    expect(restoredCanvas?.style.mixBlendMode).toBe('overlay');
    expect(document.documentElement.getAttribute(glassRendererAttribute)).toBe('webgl');
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  });

  it('can mount, destroy, and mount the same renderer again without duplicate canvases', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    const renderer = createTestRenderer();

    renderer.mount();
    renderer.mount();
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);

    renderer.destroy();
    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBeNull();

    renderer.mount();
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  });

  it('unobserves Glass elements that are removed from the renderer ownership set', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const observe = vi.fn();
    const unobserve = vi.fn();
    const disconnect = vi.fn();
    const OriginalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      public observe = observe;
      public unobserve = unobserve;
      public disconnect = disconnect;
    } as unknown as typeof ResizeObserver;

    try {
      const glass = document.createElement('article');
      glass.className = 'material-glass-subtle';
      setRect(glass, {});
      document.body.append(glass);
      const renderer = createTestRenderer();
      renderer.mount();
      expect(observe).toHaveBeenCalledWith(glass);

      glass.dataset.neoverseGlassEdgePass = 'css';
      renderer.refresh();
      expect(unobserve).toHaveBeenCalledWith(glass);
    } finally {
      window.ResizeObserver = OriginalResizeObserver;
    }
  });

  it('tracks only visible table cells with grid edges and releases them when removed', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const observe = vi.fn();
    const unobserve = vi.fn();
    const originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      public observe = observe;
      public unobserve = unobserve;
      public disconnect = vi.fn();
    } as unknown as typeof ResizeObserver;
    try {
      const table = document.createElement('table');
      table.className = 'ui-table';
      const row = table.insertRow();
      const first = row.insertCell();
      const second = row.insertCell();
      first.style.borderRight = '1px solid black';
      setRect(table, { left: 20, top: 30, width: 200, height: 40 });
      setRect(row, { left: 20, top: 30, width: 200, height: 40 });
      setRect(first, { left: 20, top: 30, width: 100, height: 40 });
      setRect(second, { left: 120, top: 30, width: 100, height: 40 });
      document.body.append(table);

      const renderer = createTestRenderer();
      renderer.mount();
      expect(observe).toHaveBeenCalledWith(table);
      expect(observe).toHaveBeenCalledWith(first);
      expect(observe).not.toHaveBeenCalledWith(second);

      first.style.borderRight = 'none';
      renderer.refresh();
      expect(unobserve).toHaveBeenCalledWith(first);
    } finally {
      window.ResizeObserver = originalResizeObserver;
    }
  });

  it('clears the last Glass edge when its auto surface becomes Solid', async () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const region = document.createElement('section');
    const card = document.createElement('article');
    card.className = 'material-auto material-glass-elevated';
    setRect(card, {});
    region.append(card);
    document.body.append(region);
    const frames = installFrameQueue();
    const renderer = createTestRenderer();
    renderer.mount();
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    gl.drawArrays.mockClear();
    gl.clear.mockClear();

    region.dataset.neoverseMaterial = 'solid';
    await vi.waitFor(() => {
      frames.flush(1000);
      expect(gl.clear).toHaveBeenCalled();
    });
    expect(gl.drawArrays).not.toHaveBeenCalled();

    card.dataset.neoverseMaterial = 'glass';
    await vi.waitFor(() => {
      frames.flush(1100);
      expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    });
  });

  it('reacts to dynamic Glass edge ownership attributes through the mutation observer', async () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const renderer = createTestRenderer();
    renderer.mount();
    gl.drawArrays.mockClear();

    glass.dataset.neoverseGlassEdgePass = 'css';
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    expect(gl.drawArrays).not.toHaveBeenCalled();

    delete glass.dataset.neoverseGlassEdgePass;
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });

  it('reacts when a nested Glass surface switches between local and inherited ownership', async () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const outer = document.createElement('article');
    outer.className = 'material-glass-elevated';
    setRect(outer, { width: 320, height: 200 });
    const nested = document.createElement('div');
    nested.className = 'material-glass-subtle';
    setRect(nested, { width: 160, height: 96 });
    outer.append(nested);
    document.body.append(outer);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const renderer = createTestRenderer();
    renderer.mount();
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);

    gl.drawArrays.mockClear();
    nested.dataset.neoverseGlassNesting = 'inherit';
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);

    gl.drawArrays.mockClear();
    delete nested.dataset.neoverseGlassNesting;
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  });

  it('coalesces repeated scroll refresh requests into one animation frame', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    const renderer = createTestRenderer();
    renderer.mount();
    gl.drawArrays.mockClear();

    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(1);

    frames.shift()?.(0);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });

  it('caps device pixel ratio and falls back to the default cap for invalid options', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(3);
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);

    const capped = createTestRenderer({ maxDevicePixelRatio: 1.5 });
    capped.mount();
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_pixel_ratio' }),
      1.5,
    );
    capped.destroy();

    gl.uniform1f.mockClear();
    const defaulted = createTestRenderer({ maxDevicePixelRatio: Number.NaN });
    defaulted.mount();
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_pixel_ratio' }),
      2,
    );
  });

  it('coalesces rapid zoom changes without losing the final canvas size and edge position', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    let viewportWidth = 640;
    let viewportHeight = 480;
    vi.spyOn(window, 'innerWidth', 'get').mockImplementation(() => viewportWidth);
    vi.spyOn(window, 'innerHeight', 'get').mockImplementation(() => viewportHeight);
    const ratio = vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(3);
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    const frames = installFrameQueue();

    const renderer = createTestRenderer();
    renderer.mount();
    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    expect(canvas?.width).toBe(1280);
    expect(canvas?.height).toBe(960);

    viewportWidth = 800;
    viewportHeight = 500;
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    frames.flush(1000);
    expect(canvas?.width).toBe(1600);
    expect(canvas?.height).toBe(1000);
    expect(gl.viewport).toHaveBeenLastCalledWith(0, 0, 1600, 1000);
    expect(gl.uniform2f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_viewport' }),
      800,
      500,
    );
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_pixel_ratio' }),
      2,
    );

    gl.clear.mockClear();
    viewportWidth = 720;
    viewportHeight = 450;
    ratio.mockReturnValue(1.5);
    setRect(glass, { left: 36, top: 24 });
    window.dispatchEvent(new Event('resize'));
    frames.flush(1008);
    expect(gl.clear).not.toHaveBeenCalled();

    frames.flush(1016);
    expect(gl.viewport).toHaveBeenLastCalledWith(0, 0, 1080, 675);
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_pixel_ratio' }),
      1.5,
    );
    expect(gl.uniform4f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_rect' }),
      36,
      24,
      240,
      120,
    );
    expect(gl.clear).toHaveBeenCalledTimes(1);
    expect(frames.size()).toBe(0);
  });
});
