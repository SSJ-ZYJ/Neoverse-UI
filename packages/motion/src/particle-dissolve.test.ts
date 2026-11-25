import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from 'bun:test';
import { Window } from 'happy-dom';

import {
  createParticleDissolve,
  particleDissolvePresets,
  prewarmParticleDissolve,
  supportsParticleCapture,
  supportsParticleDissolve,
} from './particles/particle-dissolve.js';

const uniforms = [
  'uContent',
  'uRes',
  'uGrid',
  'uAnchor',
  'uDensity',
  'uSpread',
  'uGravity',
  'uSwirl',
  'uProgress',
  'uSize',
  'uDpr',
  'uTime',
  'uDark',
] as const;

interface GlState {
  cleared: number;
  contextLost: boolean;
  deleted: number;
  drawCalls: number;
  flushCalls: number;
  programs: number;
  textures: number;
  uniformValues: Map<string, number | [number, number]>;
  viewports: Array<[number, number]>;
}

interface FakeDomState {
  capture: {
    drawElementImage: boolean;
    failPaint: boolean;
    paintMode: 'manual' | 'microtask';
  };
  webgl: boolean;
  webglThrows: boolean;
}

interface Dust2dState {
  clips: number;
  fills: number;
  texts: number;
  captures: number;
}

const dom = new Window({ url: 'http://localhost/' });
const state: FakeDomState = {
  capture: { drawElementImage: false, failPaint: false, paintMode: 'microtask' },
  webgl: true,
  webglThrows: false,
};
const glByCanvas = new Map<HTMLCanvasElement, GlState>();
const dustByCanvas = new Map<HTMLCanvasElement, Dust2dState>();
const frames: Array<((now: number) => void) | undefined> = [];
const originals = {
  document: globalThis.document,
  getComputedStyle: globalThis.getComputedStyle,
  HTMLCanvasElement: globalThis.HTMLCanvasElement,
  HTMLElement: globalThis.HTMLElement,
  Node: globalThis.Node,
  window: globalThis.window,
};
let nextFrameId = 0;

function createFakeGl(): { gl: WebGL2RenderingContext; state: GlState } {
  const constants = {
    ACTIVE_UNIFORMS: 1,
    CLAMP_TO_EDGE: 2,
    COLOR_BUFFER_BIT: 4,
    COMPILE_STATUS: 8,
    FRAGMENT_SHADER: 16,
    LINEAR: 32,
    LINK_STATUS: 64,
    ONE: 128,
    ONE_MINUS_SRC_ALPHA: 256,
    POINTS: 512,
    RGBA: 1024,
    SRC_ALPHA: 2048,
    TEXTURE0: 4096,
    TEXTURE_2D: 8192,
    UNSIGNED_BYTE: 16384,
    VERTEX_SHADER: 32768,
  };
  const glState: GlState = {
    cleared: 0,
    contextLost: false,
    deleted: 0,
    drawCalls: 0,
    flushCalls: 0,
    programs: 0,
    textures: 0,
    uniformValues: new Map(),
    viewports: [],
  };

  const gl = {
    ...constants,
    activeTexture: () => undefined,
    attachShader: () => undefined,
    bindTexture: () => undefined,
    bindVertexArray: () => undefined,
    blendFuncSeparate: () => undefined,
    clear: () => {
      glState.cleared += 1;
    },
    clearColor: () => undefined,
    compileShader: () => undefined,
    createProgram: () => {
      glState.programs += 1;
      return {};
    },
    createShader: () => ({}),
    createTexture: () => {
      glState.textures += 1;
      return {};
    },
    createVertexArray: () => ({}),
    deleteProgram: () => {
      glState.deleted += 1;
    },
    deleteShader: () => {
      glState.deleted += 1;
    },
    deleteTexture: () => {
      glState.deleted += 1;
    },
    deleteVertexArray: () => {
      glState.deleted += 1;
    },
    drawArrays: () => {
      glState.drawCalls += 1;
    },
    enable: () => undefined,
    flush: () => {
      glState.flushCalls += 1;
    },
    getActiveUniform: (_program: unknown, index: number) => ({
      name: uniforms[index] ?? '',
    }),
    getExtension: (name: string) =>
      name === 'WEBGL_lose_context'
        ? {
            loseContext: () => {
              glState.contextLost = true;
            },
          }
        : null,
    getProgramParameter: (_program: unknown, parameter: number) =>
      parameter === constants.LINK_STATUS ? true : uniforms.length,
    getShaderParameter: () => true,
    getUniformLocation: (_program: unknown, name: string) => ({ name }),
    isContextLost: () => glState.contextLost,
    linkProgram: () => undefined,
    shaderSource: () => undefined,
    texImage2D: () => undefined,
    texParameteri: () => undefined,
    uniform1f: (location: { name: string }, value: number) => {
      glState.uniformValues.set(location.name, value);
    },
    uniform1i: (location: { name: string }, value: number) => {
      glState.uniformValues.set(location.name, value);
    },
    uniform2f: (location: { name: string }, x: number, y: number) => {
      glState.uniformValues.set(location.name, [x, y]);
    },
    useProgram: () => undefined,
    viewport: (x: number, y: number) => {
      glState.viewports.push([x, y]);
    },
  };

  return { gl: gl as unknown as WebGL2RenderingContext, state: glState };
}

function createFakeDustContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dust: Dust2dState = { captures: 0, clips: 0, fills: 0, texts: 0 };
  dustByCanvas.set(canvas, dust);
  const context = {
    beginPath: () => undefined,
    clip: () => {
      dust.clips += 1;
    },
    fill: () => {
      dust.fills += 1;
    },
    fillRect: () => {
      dust.fills += 1;
    },
    fillStyle: '',
    fillText: () => {
      dust.texts += 1;
    },
    font: '',
    globalAlpha: 1,
    rect: () => undefined,
    reset: () => undefined,
    restore: () => undefined,
    roundRect: () => undefined,
    save: () => undefined,
    scale: () => undefined,
    textAlign: 'left',
    textBaseline: 'alphabetic',
    drawElementImage: state.capture.drawElementImage
      ? () => {
          dust.captures += 1;
          if (state.capture.failPaint) throw new Error('capture failed');
          return undefined;
        }
      : undefined,
  };
  return context as unknown as CanvasRenderingContext2D;
}

function installCanvasApi(): void {
  const prototype = dom.HTMLCanvasElement.prototype as unknown as {
    getContext: (kind: string, options?: unknown) => unknown;
    requestPaint: () => void;
  };

  prototype.getContext = function getContext(this: HTMLCanvasElement, kind: string): unknown {
    if (kind === '2d') return createFakeDustContext(this);
    if (kind === 'webgl2') {
      if (state.webglThrows) throw new Error('WebGL is unavailable');
      if (!state.webgl) return null;
      const created = createFakeGl();
      glByCanvas.set(this, created.state);
      return created.gl;
    }
    return null;
  };

  prototype.requestPaint = function requestPaint(this: HTMLCanvasElement): void {
    const paint = () => {
      (this as HTMLCanvasElement & { onpaint?: (() => void) | null }).onpaint?.();
    };
    if (state.capture.paintMode === 'microtask') queueMicrotask(paint);
  };
}

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as never;
}

function mediaQuery(matches: boolean): MediaQueryList {
  return {
    addEventListener: () => undefined,
    addListener: () => undefined,
    dispatchEvent: () => true,
    matches,
    media: '',
    onchange: null,
    removeEventListener: () => undefined,
    removeListener: () => undefined,
  } as unknown as MediaQueryList;
}

function createSource(options: { connected?: boolean; captureText?: string } = {}): HTMLElement {
  const source = dom.document.createElement('div');
  source.style.backgroundColor = 'rgb(10, 20, 30)';
  source.style.color = 'rgb(240, 240, 240)';
  source.textContent = options.captureText ?? 'Leaving panel';
  source.getBoundingClientRect = () => rect(20, 30, 240, 120) as never;
  if (options.connected !== false) dom.document.body.append(source as never);
  return source as unknown as HTMLElement;
}

function runNextFrame(now: number): void {
  const frame = frames.shift();
  if (frame === undefined) throw new Error('No animation frame was scheduled');
  frame(now);
}

function flushMicrotasks(): Promise<void> {
  return Promise.resolve().then(() => Promise.resolve());
}

beforeAll(() => {
  Object.assign(globalThis, {
    document: dom.document,
    getComputedStyle: dom.getComputedStyle.bind(dom),
    HTMLCanvasElement: dom.HTMLCanvasElement,
    HTMLElement: dom.HTMLElement,
    Node: dom.Node,
    window: dom,
  });
  installCanvasApi();
  const browser = dom as unknown as {
    cancelAnimationFrame: () => void;
    matchMedia: (query: string) => MediaQueryList;
    requestAnimationFrame: (callback: (now: number) => void) => number;
  };
  browser.matchMedia = () => mediaQuery(false);
  browser.requestAnimationFrame = (callback) => {
    nextFrameId += 1;
    frames.push(callback);
    return nextFrameId;
  };
  browser.cancelAnimationFrame = () => undefined;
});

beforeEach(() => {
  state.capture = { drawElementImage: false, failPaint: false, paintMode: 'microtask' };
  state.webgl = true;
  state.webglThrows = false;
  frames.length = 0;
  dustByCanvas.clear();
  dom.document.body.replaceChildren();
});

afterEach(() => {
  dom.document.body.replaceChildren();
});

afterAll(() => {
  Object.assign(globalThis, originals);
});

test('exposes the shared particle presets with the documented hierarchy', () => {
  expect(particleDissolvePresets.high).toEqual({
    density: 1.75,
    gravity: -0.18,
    size: 1.5,
    spread: 180,
    swirl: 28,
  });
  expect(particleDissolvePresets.medium).toEqual({
    density: 2.25,
    gravity: -0.12,
    size: 1.35,
    spread: 118,
    swirl: 17,
  });
});

test('feature detection requires WebGL2 and the HTML-in-Canvas capture pair', () => {
  expect(supportsParticleDissolve()).toBe(true);
  expect(supportsParticleCapture()).toBe(false);

  state.capture.drawElementImage = true;
  expect(supportsParticleCapture()).toBe(true);

  state.webgl = false;
  expect(supportsParticleDissolve()).toBe(false);
  state.webglThrows = true;
  expect(supportsParticleDissolve()).toBe(false);
  expect(supportsParticleCapture()).toBe(true);
  state.capture.drawElementImage = false;
  expect(supportsParticleCapture()).toBe(false);
});

test('returns null without a document, reduced motion, a detached source or WebGL2', () => {
  const source = createSource({ connected: false });
  expect(createParticleDissolve({ source })).toBeNull();

  dom.document.body.append(source as never);
  const browser = dom as unknown as { matchMedia: (query: string) => MediaQueryList };
  browser.matchMedia = () => mediaQuery(true);
  expect(createParticleDissolve({ source })).toBeNull();
  browser.matchMedia = () => mediaQuery(false);

  state.webgl = false;
  expect(createParticleDissolve({ source })).toBeNull();
});

test('synthetic dust paints a silhouette and runs a playable WebGL lifecycle', async () => {
  const source = createSource();
  const handle = createParticleDissolve({ source, mode: 'synthetic', durationMs: 100 });
  expect(handle).not.toBeNull();
  if (handle === null) return;

  expect(handle.debug()).toEqual({
    destroyed: false,
    drawCalls: 0,
    durationMs: 100,
    playing: false,
    progress: 0,
    textureReady: true,
  });
  const glState = glByCanvas.get(handle.canvas);
  expect(glState?.textures).toBe(1);
  expect(glState?.programs).toBe(1);

  handle.play();
  expect(frames).toHaveLength(1);
  runNextFrame(performance.now() + 50);
  expect(handle.debug().drawCalls).toBe(1);
  expect(handle.debug().progress).toBeCloseTo(0.5, 1);
  expect(glState?.drawCalls).toBe(1);
  expect(glState?.uniformValues.get('uProgress')).toBeCloseTo(0.5, 1);
  expect(glState?.uniformValues.get('uDark')).toBe(0);
  await expect(handle.firstFrame).resolves.toBe(true);

  runNextFrame(performance.now() + 500);
  expect(handle.debug()).toMatchObject({ drawCalls: 2, progress: 1 });
  await expect(handle.settled).resolves.toBe(true);

  handle.play();
  expect(frames).toHaveLength(0);

  handle.destroy();
  expect(handle.debug().destroyed).toBe(true);
  expect(handle.canvas.isConnected).toBe(false);
  handle.destroy();
});

test('the synthetic dust texture paints boxes and glyphs when content is measurable', () => {
  const source = createSource({ captureText: 'Mass' });
  const child = dom.document.createElement('span');
  child.textContent = 'Mass';
  child.style.backgroundColor = 'rgb(200, 100, 50)';
  child.getBoundingClientRect = () => rect(40, 60, 80, 20) as never;
  source.append(child as never);

  const handle = createParticleDissolve({ source, mode: 'synthetic' });
  expect(handle).not.toBeNull();
  if (handle === null) return;

  const dust = [...dustByCanvas.values()].find((entry) => entry.fills > 0);
  expect(dust?.fills).toBeGreaterThan(0);
  handle.destroy();
});

test('capture mode waits for paint, strips excluded nodes and fades the clone geometry', async () => {
  state.capture.drawElementImage = true;
  const source = createSource({ captureText: 'Captured' });
  const video = dom.document.createElement('video');
  source.append(video as never);

  const handle = createParticleDissolve({ source, mode: 'capture', durationMs: 80 });
  expect(handle).not.toBeNull();
  if (handle === null) return;
  expect(handle.debug().textureReady).toBe(false);

  const captureCanvas = [...dustByCanvas.entries()].find(
    ([canvas, dust]) => dust.captures === 0 && canvas.className === 'nv-particle-source',
  )?.[0];
  const clone = captureCanvas?.firstElementChild as HTMLElement | null;
  expect(clone?.getAttribute('data-neoverse-particle-capture')).toBe('');
  expect(clone?.getAttribute('drawable')).toBe('');
  expect(clone?.getAttribute('aria-hidden')).toBe('true');
  expect(clone?.style.width).toBe('240px');
  expect(clone?.querySelector('video')).toBeNull();

  handle.play();
  await flushMicrotasks();
  expect(handle.debug().textureReady).toBe(true);

  const dust = captureCanvas === undefined ? undefined : dustByCanvas.get(captureCanvas);
  expect(dust?.captures).toBe(1);
  expect(frames).toHaveLength(1);
  runNextFrame(performance.now() + 81);
  await expect(handle.firstFrame).resolves.toBe(true);
  await expect(handle.settled).resolves.toBe(true);
  handle.destroy();
});

test('capture mode fails closed without the capture pair and on paint failure', async () => {
  const source = createSource();
  expect(createParticleDissolve({ source, mode: 'capture' })).toBeNull();

  state.capture.drawElementImage = true;
  state.capture.failPaint = true;
  const handle = createParticleDissolve({ source, mode: 'capture' });
  expect(handle).not.toBeNull();
  if (handle === null) return;

  handle.play();
  await flushMicrotasks();
  expect(handle.debug().textureReady).toBe(false);
  await expect(handle.firstFrame).resolves.toBe(false);
  await expect(handle.settled).resolves.toBe(false);
  expect(frames).toHaveLength(0);
  handle.destroy();
});

test('destroy before paint cancels the pending capture and resolves both signals false', async () => {
  state.capture.drawElementImage = true;
  state.capture.paintMode = 'manual';
  const source = createSource();
  const handle = createParticleDissolve({ source, mode: 'capture' });
  expect(handle).not.toBeNull();
  if (handle === null) return;

  handle.destroy();
  expect(handle.debug()).toMatchObject({ destroyed: true, textureReady: false });
  await expect(handle.firstFrame).resolves.toBe(false);
  await expect(handle.settled).resolves.toBe(false);
  expect([...dustByCanvas.values()].some((dust) => dust.captures > 0)).toBe(false);
});

test('one shared renderer serves sequential dissolves and a second live dissolve owns its own canvas', () => {
  const firstSource = createSource();
  const first = createParticleDissolve({ source: firstSource, mode: 'synthetic' });
  expect(first).not.toBeNull();
  if (first === null) return;

  const second = createParticleDissolve({ source: firstSource, mode: 'synthetic' });
  expect(second).not.toBeNull();
  if (second === null) {
    first.destroy();
    return;
  }
  expect(second.canvas).not.toBe(first.canvas);

  second.destroy();
  first.destroy();

  const reused = createParticleDissolve({ source: firstSource, mode: 'synthetic' });
  expect(reused?.canvas).toBe(first.canvas);
  reused?.destroy();
});

test('prewarm reuses the idle renderer and recreates it after WebGL context loss', () => {
  prewarmParticleDissolve();
  const source = createSource();
  const first = createParticleDissolve({ source, mode: 'synthetic' });
  expect(first).not.toBeNull();
  if (first === null) return;
  const firstCanvas = first.canvas;
  first.destroy();

  const glState = glByCanvas.get(firstCanvas);
  if (glState === undefined) throw new Error('The shared renderer must own a WebGL context');
  glState.contextLost = true;

  const second = createParticleDissolve({ source, mode: 'synthetic' });
  expect(second).not.toBeNull();
  expect(second?.canvas).not.toBe(firstCanvas);
  second?.destroy();
});
