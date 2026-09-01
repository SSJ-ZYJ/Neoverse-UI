import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGlassRenderer, glassRendererAttribute } from './index';
import { glassFragmentShader } from './shader';

type FakeGl = {
  ARRAY_BUFFER: number;
  BLEND: number;
  COLOR_BUFFER_BIT: number;
  COMPILE_STATUS: number;
  FRAGMENT_SHADER: number;
  FLOAT: number;
  LINK_STATUS: number;
  SRC_ALPHA: number;
  ONE_MINUS_SRC_ALPHA: number;
  SCISSOR_TEST: number;
  STATIC_DRAW: number;
  TRIANGLE_STRIP: number;
  VERTEX_SHADER: number;
  attachShader: ReturnType<typeof vi.fn>;
  bindBuffer: ReturnType<typeof vi.fn>;
  blendFunc: ReturnType<typeof vi.fn>;
  bufferData: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  clearColor: ReturnType<typeof vi.fn>;
  compileShader: ReturnType<typeof vi.fn>;
  createBuffer: ReturnType<typeof vi.fn>;
  createProgram: ReturnType<typeof vi.fn>;
  createShader: ReturnType<typeof vi.fn>;
  deleteBuffer: ReturnType<typeof vi.fn>;
  deleteProgram: ReturnType<typeof vi.fn>;
  deleteShader: ReturnType<typeof vi.fn>;
  drawArrays: ReturnType<typeof vi.fn>;
  disable: ReturnType<typeof vi.fn>;
  enable: ReturnType<typeof vi.fn>;
  enableVertexAttribArray: ReturnType<typeof vi.fn>;
  getAttribLocation: ReturnType<typeof vi.fn>;
  getProgramParameter: ReturnType<typeof vi.fn>;
  getShaderParameter: ReturnType<typeof vi.fn>;
  getUniformLocation: ReturnType<typeof vi.fn>;
  linkProgram: ReturnType<typeof vi.fn>;
  shaderSource: ReturnType<typeof vi.fn>;
  scissor: ReturnType<typeof vi.fn>;
  uniform1f: ReturnType<typeof vi.fn>;
  uniform2f: ReturnType<typeof vi.fn>;
  uniform3f: ReturnType<typeof vi.fn>;
  uniform4f: ReturnType<typeof vi.fn>;
  useProgram: ReturnType<typeof vi.fn>;
  vertexAttribPointer: ReturnType<typeof vi.fn>;
  viewport: ReturnType<typeof vi.fn>;
};

const createFakeGl = (): FakeGl => {
  const gl = {
    ARRAY_BUFFER: 0x8892,
    BLEND: 0x0be2,
    COLOR_BUFFER_BIT: 0x4000,
    COMPILE_STATUS: 0x8b81,
    FRAGMENT_SHADER: 0x8b30,
    FLOAT: 0x1406,
    LINK_STATUS: 0x8b82,
    SRC_ALPHA: 0x0302,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    SCISSOR_TEST: 0x0c11,
    STATIC_DRAW: 0x88e4,
    TRIANGLE_STRIP: 0x0005,
    VERTEX_SHADER: 0x8b31,
    attachShader: vi.fn(),
    bindBuffer: vi.fn(),
    blendFunc: vi.fn(),
    bufferData: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    compileShader: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    createProgram: vi.fn(() => ({})),
    createShader: vi.fn(() => ({})),
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    drawArrays: vi.fn(),
    disable: vi.fn(),
    enable: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getProgramParameter: vi.fn(() => true),
    getShaderParameter: vi.fn(() => true),
    getUniformLocation: vi.fn((_, name: string) => ({ name })),
    linkProgram: vi.fn(),
    shaderSource: vi.fn(),
    scissor: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniform4f: vi.fn(),
    useProgram: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: vi.fn(),
  } satisfies FakeGl;

  return gl;
};

const installCanvasContext = (contexts: { webgl2?: FakeGl; webgl?: FakeGl } = {}): void => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((kind) => {
    if (kind === 'webgl2') {
      return (contexts.webgl2 ?? null) as never;
    }
    if (kind === 'webgl') {
      return (contexts.webgl ?? null) as never;
    }
    return null as never;
  });
};

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

const mountedRenderers: Array<ReturnType<typeof createGlassRenderer>> = [];
const createTestRenderer = (...args: Parameters<typeof createGlassRenderer>) => {
  const renderer = createGlassRenderer(...args);
  mountedRenderers.push(renderer);
  return renderer;
};

describe('Glass renderer', () => {
  afterEach(() => {
    for (const renderer of mountedRenderers) {
      renderer.destroy();
    }
    mountedRenderers.length = 0;
  });

  beforeEach(() => {
    document.documentElement.removeAttribute(glassRendererAttribute);
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('prefers WebGL2 and draws one shared canvas for top-level Glass', () => {
    const webgl2 = createFakeGl();
    const webgl = createFakeGl();
    installCanvasContext({ webgl2, webgl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-elevated';
    setRect(glass, { left: 20, top: 30 });
    document.body.append(glass);

    const renderer = createTestRenderer({ maxDevicePixelRatio: 1 });
    renderer.mount();

    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith(
      'webgl2',
      expect.objectContaining({ alpha: true }),
    );
    expect(HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalledWith(
      'webgl',
      expect.anything(),
    );
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    expect(document.documentElement.getAttribute(glassRendererAttribute)).toBe('webgl');
    expect(webgl2.drawArrays).toHaveBeenCalledTimes(1);
    expect(webgl2.getUniformLocation).toHaveBeenCalledWith(expect.anything(), 'u_pixel_ratio');
    expect(webgl2.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_pixel_ratio' }),
      1,
    );
    renderer.destroy();
  });

  it('falls back to WebGL1 when WebGL2 is unavailable', () => {
    const webgl = createFakeGl();
    installCanvasContext({ webgl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-subtle';
    setRect(glass, {});
    document.body.append(glass);

    const renderer = createTestRenderer();
    renderer.mount();

    expect(webgl.drawArrays).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    renderer.destroy();
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

  it('keeps the CSS fallback when no WebGL context is available', () => {
    installCanvasContext();
    const renderer = createTestRenderer();
    renderer.mount();

    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBeNull();
    expect(document.documentElement.hasAttribute(glassRendererAttribute)).toBe(false);
    renderer.destroy();
  });

  it('deduplicates renderers and ignores nested, hidden, and zero-sized surfaces', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const outer = document.createElement('article');
    outer.className = 'material-glass-immersive';
    setRect(outer, { width: 300, height: 200 });
    const nested = document.createElement('div');
    nested.className = 'material-glass-subtle';
    setRect(nested, { width: 100, height: 80 });
    const hidden = document.createElement('div');
    hidden.className = 'material-glass-subtle';
    hidden.style.display = 'none';
    setRect(hidden, { width: 100, height: 80 });
    const zero = document.createElement('div');
    zero.className = 'material-glass-subtle';
    setRect(zero, { width: 0, height: 0 });
    const offscreen = document.createElement('div');
    offscreen.className = 'material-glass-subtle';
    setRect(offscreen, { left: window.innerWidth + 10, top: 20, width: 100, height: 80 });
    outer.append(nested, hidden, zero, offscreen);
    document.body.append(outer);

    const first = createTestRenderer();
    const second = createTestRenderer();
    first.mount();
    second.mount();

    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    second.destroy();
    first.destroy();
  });

  it('removes a stale shared canvas before mounting a replacement runtime', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const staleCanvas = document.createElement('canvas');
    staleCanvas.setAttribute('data-neoverse-glass-renderer-canvas', 'true');
    document.body.append(staleCanvas);
    document.documentElement.setAttribute(glassRendererAttribute, 'webgl');

    const renderer = createTestRenderer();
    renderer.mount();

    expect(staleCanvas.isConnected).toBe(false);
    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    expect(gl.drawArrays).toHaveBeenCalledTimes(0);
  });

  it('removes the canvas and renderer marker on destroy', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const renderer = createTestRenderer();
    renderer.mount();

    renderer.destroy();

    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBeNull();
    expect(document.documentElement.hasAttribute(glassRendererAttribute)).toBe(false);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
  });

  it('removes the canvas and marker when the WebGL context is lost', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const renderer = createTestRenderer();
    renderer.mount();

    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas]',
    );
    canvas?.dispatchEvent(new Event('webglcontextlost'));

    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBeNull();
    expect(document.documentElement.hasAttribute(glassRendererAttribute)).toBe(false);
  });

  it('discovers the established Aurora Glass surface aliases', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const card = document.createElement('article');
    card.className = 'glass-card';
    setRect(card, { width: 320, height: 180 });
    document.body.append(card);

    const renderer = createTestRenderer();
    renderer.mount();

    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  });

  it('scales chromatic refraction for thicker edges without a white ring', () => {
    expect(glassFragmentShader).toContain('float thicknessScale');
    expect(glassFragmentShader).toContain('float chromaticStrength');
    expect(glassFragmentShader).toContain('float edgeLightCatch');
    expect(glassFragmentShader).toContain('float cornerCatch');
    expect(glassFragmentShader).toContain('uniform float u_pixel_ratio;');
    expect(glassFragmentShader).toContain(
      'vec2 pixelSize = u_rect_size / (u_viewport * u_pixel_ratio);',
    );
    expect(glassFragmentShader).toContain(
      'float antiAlias = max(max(pixelSize.x, pixelSize.y) * 0.75, 0.35);',
    );
    expect(glassFragmentShader).toContain(
      'float inside = 1.0 - smoothstep(-antiAlias, antiAlias, distance);',
    );
    expect(glassFragmentShader).toContain('float edgeMask = inside * edge;');
    expect(glassFragmentShader).toContain('#ifdef GL_FRAGMENT_PRECISION_HIGH');
    expect(glassFragmentShader).toContain(
      'float thicknessScale = clamp(0.82 + (u_edge_width * 0.55), 0.9, 1.65);',
    );
    expect(glassFragmentShader).toContain(
      'float edgeFalloff = clamp(u_softness * 0.05, 0.2, 0.42);',
    );
    expect(glassFragmentShader).toContain(
      'float chromaticStrength = clamp(0.9 + ((thicknessScale - 1.0) * 1.4), 0.9, 1.8);',
    );
    expect(glassFragmentShader).toContain(
      'float edgeLightLuminance = dot(u_edge_light, vec3(0.2126, 0.7152, 0.0722));',
    );
    expect(glassFragmentShader).toContain(
      'float lightSurface = smoothstep(0.55, 0.88, edgeLightLuminance);',
    );
    expect(glassFragmentShader).toContain(
      'float chromaticVisibility = mix(1.0, 1.34, lightSurface);',
    );
    expect(glassFragmentShader).toContain(
      'float edgeLightCatch = (0.003 + (topLeftLight * 0.012)) * (2.0 - thicknessScale) * mix(1.0, 0.24, lightSurface);',
    );
    expect(glassFragmentShader).toContain(
      'float rightRefraction = clamp(rightCatch * 0.52 * chromaticStrength * chromaticVisibility, 0.0, 0.94);',
    );
    expect(glassFragmentShader).toContain(
      'float lowerRightRefraction = rightCatch * bottomCatch * lightSurface;',
    );
    expect(glassFragmentShader).toContain('float lightAlphaGain = mix(1.0, 1.35, lightSurface);');
    expect(glassFragmentShader).toContain(
      'float alpha = edgeMask * u_opacity * directionalAlpha * thicknessScale * lightAlphaGain;',
    );
    expect(glassFragmentShader).toContain(
      'vec3 lightChromaticColor = color * vec3(0.78, 0.88, 1.0);',
    );
    expect(glassFragmentShader).toContain(
      'color = mix(color, lightChromaticColor, lightSurface * 0.72);',
    );
    expect(glassFragmentShader).toContain(
      'vec3 topLeftRefraction = mix(u_secondary, u_primary, 0.35);',
    );
    expect(glassFragmentShader).toContain(
      'mix(u_primary, u_secondary, 0.48 + (bottomRightScatter * 0.2))',
    );
    expect(glassFragmentShader).not.toContain('u_edge_light, 0.1 + (topLeftLight * 0.26)');
  });

  it('keeps low-opacity dark elevated edge catches nearly neutral', () => {
    expect(glassFragmentShader).toContain(
      'float chromaticVariantStrength = smoothstep(0.3, 0.5, u_opacity);',
    );
    expect(glassFragmentShader).toContain(
      'vec3 neutralEdgeColor = vec3(dot(color, vec3(0.2126, 0.7152, 0.0722)));',
    );
    expect(glassFragmentShader).toContain(
      'float chromaticEdgeStrength = mix(0.12, 1.0, chromaticVariantStrength);',
    );
    expect(glassFragmentShader).toContain(
      'color = mix(neutralEdgeColor, color, chromaticEdgeStrength);',
    );
  });

  it('refreshes from the window scroll event through one animation frame', () => {
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
    window.dispatchEvent(new Event('scroll'));

    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
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
});
