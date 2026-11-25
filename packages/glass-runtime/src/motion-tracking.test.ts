import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeGl, installCanvasContext } from './fake-webgl.test-support';
import { createGlassRenderer, glassRendererAttribute } from './index';
import { motionWakeEventName } from './motion-tracking';

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

const installFrameQueue = () => {
  const pending = new Map<number, FrameRequestCallback>();
  let nextId = 1;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    const id = nextId;
    nextId += 1;
    pending.set(id, callback);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
    pending.delete(id);
  });
  return {
    flush(timestamp: number) {
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) callback(timestamp);
    },
    size: () => pending.size,
  };
};

const makeMockAnimation = ({
  target,
  keyframes,
  playState = 'running',
  pending = false,
  pseudoElement = null,
  transitionProperty,
  iterations = 1,
}: {
  target: Element | null;
  keyframes: Keyframe[];
  playState?: AnimationPlayState;
  pending?: boolean;
  pseudoElement?: string | null;
  transitionProperty?: string;
  iterations?: number;
}): Animation => {
  const animation: Record<string, unknown> = {
    playState,
    pending,
    effect: {
      target,
      pseudoElement,
      getKeyframes: () => keyframes,
      getComputedTiming: () => ({ iterations }),
    },
  };
  if (transitionProperty !== undefined) {
    animation.transitionProperty = transitionProperty;
  }
  return animation as unknown as Animation;
};

const mountedRenderers: Array<ReturnType<typeof createGlassRenderer>> = [];
const createTestRenderer = (...args: Parameters<typeof createGlassRenderer>) => {
  const renderer = createGlassRenderer(...args);
  mountedRenderers.push(renderer);
  return renderer;
};

describe('Glass motion tracking', () => {
  afterEach(() => {
    for (const renderer of mountedRenderers) renderer.destroy();
    mountedRenderers.length = 0;
  });

  beforeEach(() => {
    document.documentElement.removeAttribute(glassRendererAttribute);
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('tracks WAAPI animations via document.getAnimations and neoverse-motion-start', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const badge = document.createElement('span');
    const neighbor = document.createElement('button');
    neighbor.className = 'ui-button material-glass-subtle';
    document.body.append(badge, neighbor);
    setRect(neighbor, { left: 100, top: 40, width: 48, height: 32 });

    let active = true;
    const widthAnimation = makeMockAnimation({
      target: badge,
      keyframes: [{ width: '80px' }, { width: '140px' }],
    });
    Object.defineProperty(document, 'getAnimations', {
      configurable: true,
      value: () => (active ? [widthAnimation] : []),
    });
    const frames = installFrameQueue();
    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();
    gl.uniform4f.mockClear();

    badge.dispatchEvent(new Event(motionWakeEventName, { bubbles: true }));
    expect(frames.size()).toBe(1);

    setRect(neighbor, { left: 132, top: 40, width: 48, height: 32 });
    frames.flush(1000);
    expect(gl.uniform4f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_rect' }),
      132,
      40,
      48,
      32,
    );
    expect(frames.size()).toBe(1);

    setRect(neighbor, { left: 160, top: 40, width: 48, height: 32 });
    active = false;
    frames.flush(1004);
    expect(gl.uniform4f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_rect' }),
      160,
      40,
      48,
      32,
    );
    expect(frames.size()).toBe(0);
    Reflect.deleteProperty(document, 'getAnimations');
  });

  it('repaints every 240 Hz frame during active motion while keeping scroll capped', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const card = document.createElement('article');
    card.className = 'material-glass-elevated';
    setRect(card, { left: 20, top: 20, width: 200, height: 100 });
    document.body.append(card);

    let moving = false;
    const translateAnimation = makeMockAnimation({
      target: card,
      keyframes: [{ translate: '0px 0px' }, { translate: '40px 0px' }],
    });
    Object.defineProperty(document, 'getAnimations', {
      configurable: true,
      value: () => (moving ? [translateAnimation] : []),
    });
    Object.defineProperty(card, 'getAnimations', {
      configurable: true,
      value: () => (moving ? [translateAnimation] : []),
    });

    const frames = installFrameQueue();
    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();
    gl.clear.mockClear();

    // Scroll stays capped at 15 ms.
    window.dispatchEvent(new Event('scroll'));
    frames.flush(1000);
    window.dispatchEvent(new Event('scroll'));
    frames.flush(1004);
    expect(gl.clear).toHaveBeenCalledTimes(1);
    frames.flush(1020);
    expect(gl.clear).toHaveBeenCalledTimes(2);

    // Active motion bypasses the cap and renders every 4 ms frame.
    gl.clear.mockClear();
    moving = true;
    card.dispatchEvent(new Event('transitionrun', { bubbles: true }));
    for (let index = 0; index < 5; index += 1) {
      setRect(card, { left: 20 + index * 8, top: 20, width: 200, height: 100 });
      frames.flush(1024 + index * 4);
    }
    expect(gl.clear).toHaveBeenCalledTimes(5);
    moving = false;
    frames.flush(1044);
    expect(frames.size()).toBe(0);
    Reflect.deleteProperty(document, 'getAnimations');
  });

  it('ignores infinite internal decorative animations and view-transition pseudo masks', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const button = document.createElement('button');
    button.className = 'ui-button material-glass-subtle';
    const spinner = document.createElement('svg');
    spinner.className = 'ui-loading-indicator';
    button.append(spinner);
    const slider = document.createElement('span');
    slider.className = 'ui-segmented-control__slider';
    const statusDot = document.createElement('span');
    statusDot.className = 'ui-status-indicator__dot';
    document.body.append(button, slider, statusDot);
    setRect(button, { width: 100, height: 32 });

    const animations = [
      makeMockAnimation({
        target: spinner,
        keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
        iterations: Number.POSITIVE_INFINITY,
      }),
      makeMockAnimation({
        target: statusDot,
        keyframes: [
          { opacity: 0.88, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(2)' },
        ],
        iterations: Number.POSITIVE_INFINITY,
      }),
      makeMockAnimation({
        target: slider,
        keyframes: [{ translate: '0px 0px' }, { translate: '60px 0px' }],
      }),
      makeMockAnimation({
        target: document.documentElement,
        keyframes: [{ opacity: 1 }, { opacity: 0 }],
        pseudoElement: '::view-transition-old(root)',
      }),
      makeMockAnimation({
        target: button,
        keyframes: [{ backgroundColor: 'red' }, { backgroundColor: 'blue' }],
        transitionProperty: 'background-color',
      }),
      makeMockAnimation({
        target: button,
        keyframes: [
          { '--neoverse-button-tone-color': 'red' },
          { '--neoverse-button-tone-color': 'blue' },
        ],
        transitionProperty: '--neoverse-button-tone-color',
      }),
    ];
    Object.defineProperty(document, 'getAnimations', {
      configurable: true,
      value: () => animations,
    });
    const frames = installFrameQueue();
    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();
    gl.clear.mockClear();

    spinner.dispatchEvent(new Event('animationstart', { bubbles: true }));
    slider.dispatchEvent(new Event('transitionrun', { bubbles: true }));
    button.dispatchEvent(
      Object.assign(new Event('transitionrun', { bubbles: true }), {
        propertyName: '--neoverse-button-tone-color',
      }),
    );
    frames.flush(1000);
    expect(frames.size()).toBe(0);
    expect(gl.clear).not.toHaveBeenCalled();
    Reflect.deleteProperty(document, 'getAnimations');
  });

  it('forces one settle frame after an opacity exit completes even with unchanged rect', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const card = document.createElement('article');
    card.className = 'material-glass-elevated';
    setRect(card, { left: 20, top: 20, width: 200, height: 100 });
    document.body.append(card);

    let running = true;
    const fadeAnimation = makeMockAnimation({
      target: card,
      keyframes: [{ opacity: 1 }, { opacity: 0 }],
    });
    Object.defineProperty(document, 'getAnimations', {
      configurable: true,
      value: () => (running ? [fadeAnimation] : []),
    });
    Object.defineProperty(card, 'getAnimations', {
      configurable: true,
      value: () => (running ? [fadeAnimation] : []),
    });

    const frames = installFrameQueue();
    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();
    card.dispatchEvent(new Event('transitionrun', { bubbles: true }));
    frames.flush(1000);

    // The animation ends and the final CSS computed opacity reaches 0 while rect stays identical.
    running = false;
    card.style.opacity = '0';
    gl.clear.mockClear();
    gl.drawArrays.mockClear();
    frames.flush(1016);
    expect(gl.clear).toHaveBeenCalledTimes(1);
    expect(gl.drawArrays).not.toHaveBeenCalled();
    expect(frames.size()).toBe(0);
    Reflect.deleteProperty(document, 'getAnimations');
  });

  it('repaints synchronously inside ResizeObserver callbacks without deferring to the next frame', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    let resizeCallback: ResizeObserverCallback | undefined;
    const OriginalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      public observe = vi.fn();
      public unobserve = vi.fn();
      public disconnect = vi.fn();
    } as unknown as typeof ResizeObserver;

    try {
      const card = document.createElement('article');
      card.className = 'material-glass-elevated';
      setRect(card, { left: 10, top: 20, width: 120, height: 60 });
      document.body.append(card);

      const frames = installFrameQueue();
      const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
      renderer.mount();
      gl.uniform4f.mockClear();

      setRect(card, { left: 10, top: 20, width: 180, height: 80 });
      resizeCallback?.([], {} as ResizeObserver);

      expect(gl.uniform4f).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'u_rect' }),
        10,
        20,
        180,
        80,
      );
      expect(frames.size()).toBe(0);
    } finally {
      window.ResizeObserver = OriginalResizeObserver;
    }
  });
});
