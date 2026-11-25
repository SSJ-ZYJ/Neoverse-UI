import { describe, expect, it, vi } from 'vitest';
import { createFakeGl, installCanvasContext } from './fake-webgl.test-support';
import {
  createTestRenderer,
  flushMutations,
  installFrameQueue,
  installReducedTransparencyMedia,
  registerGlassRendererSuiteHooks,
  setRect,
} from './runtime.test-support';

describe('Glass renderer suspension and frame throttling', () => {
  registerGlassRendererSuiteHooks();

  it('deduplicates scheduled frames when input leaves the scene unchanged', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    const frames: Array<(time: number) => void> = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback as (time: number) => void);
      return frames.length;
    });
    const renderer = createTestRenderer();
    renderer.mount();

    window.dispatchEvent(new Event('scroll'));
    frames.shift()?.(0);
    expect(gl.drawArrays).toHaveBeenCalled();
    gl.drawArrays.mockClear();

    for (let index = 0; index < 2; index += 1) {
      glass.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
      frames.shift()?.(0);
    }
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it('keeps a scroll repaint the frame cap deferred instead of dropping it', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, { left: 20, top: 200 });
    document.body.append(glass);
    const frames: Array<(time: number) => void> = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback as (time: number) => void);
      return frames.length;
    });
    const renderer = createTestRenderer();
    renderer.mount();
    frames.length = 0;

    window.dispatchEvent(new Event('scroll'));
    frames.shift()?.(1000);
    expect(gl.drawArrays).toHaveBeenCalled();

    // The last scroll event of a gesture can land inside the 16 ms cap window.
    // Defer that frame, never discard it: a discarded request leaves the fixed
    // canvas painting the previous offset, so the rim stays misaligned.
    gl.uniform4f.mockClear();
    setRect(glass, { left: 20, top: 120 });
    window.dispatchEvent(new Event('scroll'));
    frames.shift()?.(1008);
    expect(frames, 'a capped scroll frame stays scheduled').not.toHaveLength(0);

    frames.shift()?.(1024);
    expect(gl.uniform4f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_rect' }),
      20,
      120,
      240,
      120,
    );
    expect(frames, 'a resting scene stops reserving frames').toHaveLength(0);
  });

  it('does not repaint or schedule frames when an unrelated container without glass scrolls', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, { left: 20, top: 200 });
    document.body.append(glass);

    const plainContainer = document.createElement('div');
    plainContainer.className = 'plain-scroll-container';
    const child = document.createElement('p');
    child.textContent = 'content';
    plainContainer.append(child);
    document.body.append(plainContainer);

    const frames: Array<(time: number) => void> = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback as (time: number) => void);
      return frames.length;
    });

    const renderer = createTestRenderer();
    renderer.mount();
    frames.length = 0;
    gl.drawArrays.mockClear();

    plainContainer.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(0);
    expect(gl.drawArrays).not.toHaveBeenCalled();

    // When the container contains a glass surface, scrolling it must repaint.
    plainContainer.append(glass);
    plainContainer.dispatchEvent(new Event('scroll'));
    expect(frames).not.toHaveLength(0);
  });

  it('caps repaints on high-refresh displays instead of rendering every RAF', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    const frames: Array<(time: number) => void> = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback as (time: number) => void);
      return frames.length;
    });
    const renderer = createTestRenderer();
    renderer.mount();
    gl.clear.mockClear();

    let timestamp = 1000;
    for (let index = 0; index < 20; index += 1) {
      window.dispatchEvent(new Event('scroll'));
      frames.shift()?.(timestamp);
      timestamp += 3;
    }

    // 20 frames at ~333 Hz should produce at most a handful of 60 Hz repaints.
    expect(gl.clear.mock.calls.length).toBeGreaterThan(0);
    expect(gl.clear.mock.calls.length).toBeLessThanOrEqual(5);
  });

  it('leaves selection indicator motion to CSS instead of repainting the scene', async () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const dock = document.createElement('nav');
    dock.className = 'material-glass-elevated';
    const shared = document.createElement('span');
    shared.className = 'ui-control-surface__indicator';
    const marker = document.createElement('span');
    marker.className = 'ui-navigation-item__indicator';
    dock.append(shared, marker);
    document.body.append(dock);
    setRect(dock, {});
    const frames = installFrameQueue();
    const renderer = createTestRenderer();
    renderer.mount();
    gl.drawArrays.mockClear();

    for (const indicator of [shared, marker]) {
      const flight = new Event('transitionrun', { bubbles: true });
      Object.defineProperty(flight, 'propertyName', { value: 'transform' });
      indicator.dispatchEvent(flight);
      indicator.setAttribute('style', 'transform: translate(50px, 0px)');
    }
    await flushMutations();
    frames.flush(16);
    expect(frames.size()).toBe(0);
    expect(gl.drawArrays).not.toHaveBeenCalled();

    // The surface itself stays on the tracked animation path.
    const surfaceFlight = new Event('transitionrun', { bubbles: true });
    Object.defineProperty(surfaceFlight, 'propertyName', { value: 'transform' });
    dock.dispatchEvent(surfaceFlight);
    expect(frames.size()).toBe(1);
  });

  it('suspend retains the painted frame and resume repaints the settled scene once', async () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-elevated';
    setRect(glass, { left: 20 });
    document.body.append(glass);
    const frames = installFrameQueue();
    // happy-dom has no elementsFromPoint; the renderer treats its absence as
    // "no occluders", so install a counting probe for this contract.
    const hitTest = vi.fn((): Element[] => []);
    Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: hitTest });
    const renderer = createTestRenderer();
    renderer.mount();
    gl.drawArrays.mockClear();
    gl.clear.mockClear();
    hitTest.mockClear();

    renderer.suspend();
    setRect(glass, { left: 300 });
    glass.setAttribute('data-theme', 'dark');
    window.dispatchEvent(new Event('scroll'));
    await flushMutations();
    frames.flush(16);
    expect(frames.size()).toBe(0);
    expect(gl.clear).not.toHaveBeenCalled();
    expect(gl.drawArrays).not.toHaveBeenCalled();
    expect(hitTest).not.toHaveBeenCalled();

    renderer.resume();
    expect(gl.clear).toHaveBeenCalledTimes(1);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    expect(hitTest).toHaveBeenCalled();
    expect(gl.uniform4f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_rect' }),
      300,
      0,
      240,
      120,
    );
    Reflect.deleteProperty(document, 'elementsFromPoint');
  });

  it('suspend before mount defers the first paint until resume', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    const renderer = createTestRenderer();
    renderer.suspend();
    renderer.mount();
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    expect(gl.drawArrays).not.toHaveBeenCalled();
    renderer.resume();
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });

  it('explicit refresh still repaints while suspended', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    const renderer = createTestRenderer();
    renderer.mount();
    renderer.suspend();
    gl.drawArrays.mockClear();
    setRect(glass, { left: 90 });
    renderer.refresh();
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    renderer.resume();
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  });

  it('resume without suspension and repeated suspend stay idempotent', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    const renderer = createTestRenderer();
    renderer.mount();
    gl.drawArrays.mockClear();
    renderer.resume();
    expect(gl.drawArrays).not.toHaveBeenCalled();
    renderer.suspend();
    renderer.suspend();
    renderer.resume();
    renderer.resume();
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });

  it('suspend withdraws a scheduled frame and destroy clears the suspension', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    const frames = installFrameQueue();
    const renderer = createTestRenderer();
    renderer.mount();
    window.dispatchEvent(new Event('scroll'));
    expect(frames.size()).toBe(1);
    renderer.suspend();
    expect(frames.size()).toBe(0);
    gl.drawArrays.mockClear();
    frames.flush(16);
    expect(gl.drawArrays).not.toHaveBeenCalled();
    renderer.destroy();
    renderer.mount();
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });

  it('reduced transparency releases the canvas even while suspended', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);
    const transparency = installReducedTransparencyMedia(false);
    const renderer = createTestRenderer();
    renderer.mount();
    renderer.suspend();
    gl.drawArrays.mockClear();

    transparency.setReduced(true);
    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBeNull();
    renderer.resume();
    expect(gl.drawArrays).not.toHaveBeenCalled();

    transparency.setReduced(false);
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });
});
