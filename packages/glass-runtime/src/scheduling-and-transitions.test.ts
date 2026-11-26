import { describe, expect, it, vi } from 'vitest';
import { createFakeGl, installCanvasContext } from './fake-webgl.test-support';
import { glassRendererAttribute } from './index';
import {
  createTestRenderer,
  installReducedTransparencyMedia,
  registerGlassRendererSuiteHooks,
  setRect,
} from './runtime.test-support';

describe('Glass renderer transitions, mutations and reduced transparency', () => {
  registerGlassRendererSuiteHooks();

  it('discovers the established Aurora Glass surface alias', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const surface = document.createElement('article');
    surface.className = 'material-glass-subtle';
    setRect(surface, { width: 320, height: 180 });
    document.body.append(surface);

    const renderer = createTestRenderer();
    renderer.mount();

    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });

  it('tracks moving glass during CSS transitions and stops repainting when they finish', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const page = document.createElement('section');
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    page.append(glass);
    document.body.append(page);
    setRect(glass, { left: 20 });
    let running = true;
    Object.defineProperty(page, 'getAnimations', {
      value: () => (running ? [{ playState: 'running' }] : []),
    });
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    const renderer = createTestRenderer();
    renderer.mount();
    page.dispatchEvent(new Event('transitionrun', { bubbles: true }));
    expect(frames.length).toBe(1);
    frames.shift()?.(0);
    setRect(glass, { left: 80 });
    gl.uniform4f.mockClear();
    frames.shift()?.(16);
    expect(gl.uniform4f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_rect' }),
      80,
      0,
      240,
      120,
    );
    running = false;
    glass.remove();
    gl.drawArrays.mockClear();
    frames.shift()?.(32);
    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBeNull();
    expect(gl.drawArrays).not.toHaveBeenCalled();
    expect(frames).toHaveLength(0);
  });

  it('ignores color-only theme transitions instead of scheduling edge repaints', () => {
    installCanvasContext({ webgl2: createFakeGl() });
    const page = document.createElement('section');
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    page.append(glass);
    document.body.append(page);
    setRect(glass, { left: 20 });
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    const renderer = createTestRenderer();
    renderer.mount();

    for (const property of [
      'color',
      'background-color',
      'border-top-color',
      'border-left-color',
      'box-shadow',
      'text-shadow',
      'outline-color',
    ]) {
      for (const type of ['transitionrun', 'transitionend']) {
        const event = new Event(type, { bubbles: true });
        Object.defineProperty(event, 'propertyName', { value: property });
        page.dispatchEvent(event);
      }
    }

    expect(frames).toHaveLength(0);
    renderer.destroy();
  });

  it('still tracks geometry-bearing transitions', () => {
    installCanvasContext({ webgl2: createFakeGl() });
    const page = document.createElement('section');
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    page.append(glass);
    document.body.append(page);
    setRect(glass, { left: 20 });
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    const renderer = createTestRenderer();
    renderer.mount();

    for (const property of ['transform', 'width', 'opacity', '--neoverse-color-edge-light']) {
      const event = new Event('transitionrun', { bubbles: true });
      Object.defineProperty(event, 'propertyName', { value: property });
      page.dispatchEvent(event);
    }

    expect(frames).toHaveLength(1);
    renderer.destroy();
  });

  it('fades glass edges with the surface and its ancestors, including fully hidden pages', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const page = document.createElement('section');
    const glass = document.createElement('article');
    glass.className = 'material-glass-elevated';
    glass.style.opacity = '0.5';
    page.style.opacity = '0.5';
    page.append(glass);
    document.body.append(page);
    setRect(glass, {});
    const renderer = createTestRenderer();
    renderer.mount();
    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_opacity' }),
      0.125,
    );
    page.style.opacity = '0';
    gl.drawArrays.mockClear();
    renderer.refresh();
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it('refreshes after a Glass DOM mutation through the document realm observer', async () => {
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
    glass.classList.add('is-updated');
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  });

  it('does not mount while reduced transparency is active', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn(() => ({
      matches: true,
      media: '(prefers-reduced-transparency: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;

    const renderer = createTestRenderer();
    renderer.mount();

    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBeNull();
    expect(gl.drawArrays).not.toHaveBeenCalled();
    window.matchMedia = originalMatchMedia;
    renderer.destroy();
  });

  it('releases and restores one shared canvas when reduced transparency changes', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);

    const transparency = installReducedTransparencyMedia(false);
    const scheduledFrames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      scheduledFrames.push(callback);
      return scheduledFrames.length;
    });
    const cancelFrame = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);

    const renderer = createTestRenderer();
    renderer.mount();
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    expect(transparency.listeners.size).toBe(1);

    window.dispatchEvent(new Event('scroll'));
    expect(scheduledFrames).toHaveLength(1);
    transparency.setReduced(true);
    expect(cancelFrame).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBeNull();
    expect(document.documentElement.hasAttribute(glassRendererAttribute)).toBe(false);

    transparency.setReduced(false);
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    expect(document.documentElement.getAttribute(glassRendererAttribute)).toBe('webgl');
    expect(gl.createProgram).toHaveBeenCalledTimes(2);
    expect(transparency.listeners.size).toBe(1);

    renderer.destroy();
    expect(transparency.listeners.size).toBe(0);
    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBeNull();
  });

  it('deduplicates explicit non-forced refreshes without recreating the shader program', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-elevated';
    setRect(glass, {});
    document.body.append(glass);

    const renderer = createTestRenderer();
    renderer.mount();
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    renderer.refresh(false);
    renderer.refresh(false);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);

    renderer.refresh(true);
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
    expect(gl.createProgram).toHaveBeenCalledTimes(1);
  });

  it('ignores decorative style mutations outside every Glass surface', async () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    const decoration = document.createElement('span');
    document.body.append(glass, decoration);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const renderer = createTestRenderer();
    renderer.mount();
    gl.drawArrays.mockClear();

    decoration.style.opacity = '0.5';
    decoration.classList.add('is-typing');
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it('still repaints for style mutations on a Glass surface and its descendants', async () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    const inner = document.createElement('span');
    glass.append(inner);
    document.body.append(glass);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const renderer = createTestRenderer();
    renderer.mount();
    gl.drawArrays.mockClear();

    inner.style.opacity = '0.5';
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    expect(gl.drawArrays).toHaveBeenCalled();

    gl.drawArrays.mockClear();
    glass.style.borderRadius = '12px';
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    expect(gl.drawArrays).toHaveBeenCalled();
  });

  it('still repaints for global theme attribute mutations', async () => {
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

    document.documentElement.dataset.theme = 'dark';
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

    expect(gl.drawArrays).toHaveBeenCalled();
    delete document.documentElement.dataset.theme;
  });
});
