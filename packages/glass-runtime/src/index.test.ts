import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { collectOccluders, createGlassRenderer, glassRendererAttribute } from './index';
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
  ONE: number;
  ONE_MINUS_SRC_ALPHA: number;
  TEXTURE0: number;
  TEXTURE_2D: number;
  TEXTURE_MIN_FILTER: number;
  TEXTURE_MAG_FILTER: number;
  TEXTURE_WRAP_S: number;
  TEXTURE_WRAP_T: number;
  LINEAR: number;
  CLAMP_TO_EDGE: number;
  RGBA: number;
  UNSIGNED_BYTE: number;
  activeTexture: ReturnType<typeof vi.fn>;
  bindTexture: ReturnType<typeof vi.fn>;
  createTexture: ReturnType<typeof vi.fn>;
  deleteTexture: ReturnType<typeof vi.fn>;
  texParameteri: ReturnType<typeof vi.fn>;
  texImage2D: ReturnType<typeof vi.fn>;
  uniform1i: ReturnType<typeof vi.fn>;
  SCISSOR_TEST: number;
  STATIC_DRAW: number;
  TRIANGLE_STRIP: number;
  VERTEX_SHADER: number;
  attachShader: ReturnType<typeof vi.fn>;
  bindBuffer: ReturnType<typeof vi.fn>;
  blendFunc: ReturnType<typeof vi.fn>;
  blendFuncSeparate: ReturnType<typeof vi.fn>;
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
  uniform4fv: ReturnType<typeof vi.fn>;
  uniform1fv: ReturnType<typeof vi.fn>;
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
    ONE: 1,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    TEXTURE0: 0x84c0,
    TEXTURE_2D: 0x0de1,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    LINEAR: 0x2601,
    CLAMP_TO_EDGE: 0x812f,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    activeTexture: vi.fn(),
    bindTexture: vi.fn(),
    createTexture: vi.fn(() => ({})),
    deleteTexture: vi.fn(),
    texParameteri: vi.fn(),
    texImage2D: vi.fn(),
    uniform1i: vi.fn(),
    SCISSOR_TEST: 0x0c11,
    STATIC_DRAW: 0x88e4,
    TRIANGLE_STRIP: 0x0005,
    VERTEX_SHADER: 0x8b31,
    attachShader: vi.fn(),
    bindBuffer: vi.fn(),
    blendFunc: vi.fn(),
    blendFuncSeparate: vi.fn(),
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
    uniform4fv: vi.fn(),
    uniform1fv: vi.fn(),
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
    document.documentElement.style.removeProperty('--neoverse-color-edge-light');
    document.documentElement.style.removeProperty('color-scheme');
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

  it('leaves CSS-selected surfaces on the library edge field', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = 'material-glass-elevated';
    glass.dataset.neoverseGlassEdgePass = 'css';
    setRect(glass, {});
    document.body.append(glass);

    const renderer = createTestRenderer();
    renderer.mount();

    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it.each(['ui-card', 'ui-surface'])('keeps %s on the established WebGL edge pass', (className) => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const glass = document.createElement('article');
    glass.className = `${className} material-glass-elevated`;
    setRect(glass, {});
    document.body.append(glass);

    createTestRenderer().mount();

    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    expect(
      document.querySelector<HTMLCanvasElement>('[data-neoverse-glass-renderer-canvas]')?.style
        .mixBlendMode,
    ).toBe('');
  });

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

  it('leaves button-owned edge fields out of the shared WebGL pass by default', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const button = document.createElement('button');
    button.className = 'ui-button material-glass-subtle';
    setRect(button, { width: 100, height: 32 });
    document.body.append(button);

    const renderer = createTestRenderer();
    renderer.mount();

    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it('allows an explicitly opted-in button to use the shared WebGL edge pass', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const button = document.createElement('button');
    button.className = 'ui-button material-glass-subtle';
    button.dataset.neoverseGlassEdgePassActive = 'webgl';
    setRect(button, { width: 100, height: 32 });
    document.body.append(button);

    const renderer = createTestRenderer();
    renderer.mount();

    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
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

  it('preserves translucent CSS color tokens in WebGL uniforms', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    document.documentElement.style.setProperty(
      '--neoverse-color-edge-light',
      'rgb(255 255 255 / 13%)',
    );
    const glass = document.createElement('article');
    glass.className = 'material-glass-elevated';
    glass.style.setProperty(
      '--neoverse-material-edge-refraction-carrier',
      'rgb(255 255 255 / 6.47%)',
    );
    setRect(glass, { width: 100, height: 60 });
    document.body.append(glass);

    const renderer = createTestRenderer();
    renderer.mount();

    const edgeLightCall = gl.uniform3f.mock.calls
      .filter(([location]) => location?.name === 'u_edge_light')
      .at(-1);
    const carrierCall = gl.uniform3f.mock.calls
      .filter(([location]) => location?.name === 'u_carrier')
      .at(-1);
    expect(edgeLightCall?.[1]).toBeCloseTo(0.13, 3);
    expect(edgeLightCall?.[2]).toBeCloseTo(0.13, 3);
    expect(edgeLightCall?.[3]).toBeCloseTo(0.13, 3);
    expect(carrierCall?.[1]).toBeCloseTo(0.0647, 3);
    expect(carrierCall?.[2]).toBeCloseTo(0.0647, 3);
    expect(carrierCall?.[3]).toBeCloseTo(0.0647, 3);
  });

  it.each([
    ['light', 1],
    ['dark', 0],
    ['normal', -1],
  ] as const)('uses the %s color scheme independently of edge tint', (scheme, expected) => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    document.documentElement.style.setProperty('color-scheme', scheme);
    document.documentElement.style.setProperty(
      '--neoverse-color-edge-light',
      'rgb(116 186 229 / 48%)',
    );
    const glass = document.createElement('article');
    glass.className = 'material-glass-elevated';
    glass.style.setProperty('--neoverse-material-edge-refraction-opacity', '0.22');
    setRect(glass, { width: 100, height: 60 });
    document.body.append(glass);

    const renderer = createTestRenderer();
    renderer.mount();

    expect(gl.uniform1f).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'u_light_surface' }),
      expected,
    );
  });

  it('keeps the CSS fallback when no WebGL context is available', () => {
    installCanvasContext();
    const renderer = createTestRenderer();
    renderer.mount();

    expect(document.querySelector('[data-neoverse-glass-renderer-canvas]')).toBeNull();
    expect(document.documentElement.hasAttribute(glassRendererAttribute)).toBe(false);
    renderer.destroy();
  });

  it('deduplicates renderers, draws independent nested Glass, and ignores hidden surfaces', () => {
    const gl = createFakeGl();
    installCanvasContext({ webgl2: gl });
    const outer = document.createElement('article');
    outer.className = 'material-glass-immersive';
    setRect(outer, { width: 300, height: 200 });
    const nested = document.createElement('div');
    nested.className = 'material-glass-subtle';
    setRect(nested, { width: 100, height: 80 });
    const inherited = document.createElement('div');
    inherited.className = 'material-glass-subtle';
    inherited.dataset.neoverseGlassNesting = 'inherit';
    setRect(inherited, { width: 100, height: 80 });
    const controlGroup = document.createElement('div');
    controlGroup.className = 'ui-segmented-control material-glass-subtle';
    setRect(controlGroup, { width: 100, height: 32 });
    const control = document.createElement('button');
    control.className = 'ui-button material-glass-subtle';
    setRect(control, { width: 100, height: 32 });
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
    outer.append(nested, inherited, controlGroup, control, hidden, zero, offscreen);
    document.body.append(outer);

    const first = createTestRenderer();
    const second = createTestRenderer();
    first.mount();
    second.mount();

    expect(document.querySelectorAll('[data-neoverse-glass-renderer-canvas]')).toHaveLength(1);
    // Only independent surface planes use the shared renderer. Segmented
    // controls and buttons retain their component-owned local edge fields.
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
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

  it('preserves the established chromatic edge-refraction field', () => {
    expect(glassFragmentShader).toContain('uniform vec3 u_primary;');
    expect(glassFragmentShader).toContain('uniform vec3 u_secondary;');
    expect(glassFragmentShader).toContain('uniform vec3 u_tertiary;');
    expect(glassFragmentShader).toContain(
      'vec3 refractedBase = mix(u_primary, u_secondary, 0.48 + (bottomRightScatter * 0.2));',
    );
    expect(glassFragmentShader).toContain(
      'float chromaticVisibility = mix(1.0, 1.34, lightSurface);',
    );
  });

  it('keeps the opposing rounded corners connected in the directional edge field', () => {
    const directionalAlpha = glassFragmentShader.match(/float directionalAlpha =([\s\S]*?);/)?.[0];
    const opposingCornerCoefficient = Number.parseFloat(
      directionalAlpha?.match(/opposingCornerCatch \* ([\d.]+)/)?.[1] ?? '0',
    );

    expect(directionalAlpha).toContain('opposingCornerCatch');
    expect(opposingCornerCoefficient).toBeGreaterThanOrEqual(0.24);
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
    gl.clear.mockClear();
    frames.shift()?.(32);
    expect(gl.clear).toHaveBeenCalledWith(gl.COLOR_BUFFER_BIT);
    expect(gl.drawArrays).not.toHaveBeenCalled();
    expect(frames).toHaveLength(0);
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
