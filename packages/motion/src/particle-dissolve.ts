// WebGL particle dissolve — the shared page-change choreography.
// A sanitized clone of the leaving region is rasterized through the official
// HTML-in-Canvas capture (layoutsubtree + drawElementImage) when available;
// otherwise a DOM-measured silhouette mask feeds the same WebGL2 point-sprite
// pass. Both paths erode the page into particles that sample the source and
// drift away on a smoke plume. Browsers without WebGL2 use the CSS choreography.

import { prefersReducedMotion } from './reduced-motion';

export interface ParticleDissolvePreset {
  /** Grid spacing in CSS pixels; smaller = denser dust. */
  density: number;
  /** Particle radius in CSS pixels. */
  size: number;
  /** Travel distance of the plume, in CSS pixels. */
  spread: number;
  /** Vertical pull; negative = the dust rises. */
  gravity: number;
  /** Lateral turbulence amplitude, in CSS pixels. */
  swirl: number;
}

/** The shared choreography: a fine dust layer that follows content edges.
 * 1.75px sampling keeps text silhouettes readable without carpeting the
 * whole surface in dots. */
export const particleDissolvePresets = {
  high: {
    density: 1.75,
    gravity: -0.18,
    size: 1.5,
    spread: 180,
    swirl: 28,
  },
  medium: {
    density: 2.25,
    gravity: -0.12,
    size: 1.35,
    spread: 118,
    swirl: 17,
  },
} as const;

/* One shared spacing adjustment keeps capture and synthetic textures at the
   same reduced particle density across every preset and viewport size. */
const PARTICLE_SPACING_SCALE = 1.1;

export type ParticleDissolvePresetName = keyof typeof particleDissolvePresets;

export type ParticleDissolveMode = 'auto' | 'capture' | 'synthetic';

export interface ParticleDissolveOptions {
  /** Element captured and dissolved. Must be attached to the document. */
  source: HTMLElement;
  preset?: ParticleDissolvePresetName;
  /** Total dissolve duration in milliseconds. Defaults to the particle token. */
  durationMs?: number;
  /**
   * Texture source. `auto` (default) captures the element when the browser
   * implements HTML-in-Canvas and falls back to synthetic dust otherwise;
   * `capture` and `synthetic` force one pipeline (preview/校准用).
   */
  mode?: ParticleDissolveMode;
}

export interface ParticleDissolveDebugState {
  progress: number;
  drawCalls: number;
  playing: boolean;
  textureReady: boolean;
  destroyed: boolean;
  durationMs: number;
}

export interface ParticleDissolveHandle {
  canvas: HTMLCanvasElement;
  /** Resolves true once the first frame is on screen (safe to swap the DOM). */
  firstFrame: Promise<boolean>;
  /** Resolves true once the dissolve finished playing. */
  settled: Promise<boolean>;
  play: () => void;
  destroy: () => void;
  /** Live state for debugging and tests. */
  debug: () => ParticleDissolveDebugState;
}

type PaintableCanvas = HTMLCanvasElement & {
  onpaint?: (() => void) | null;
  requestPaint?: () => void;
};

type ElementImageContext = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, x: number, y: number) => DOMMatrix | undefined;
};

const CAPTURE_EXCLUDE_SELECTOR =
  'canvas, video, audio, iframe, script, object, embed, .nv-particle-canvas, .nv-particle-source';
const TRANSPARENT_PIXEL = new Uint8Array([0, 0, 0, 0]);
const HASH = `
float hash (vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}`;

const DISSOLVE_VERT = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec2 uGrid;
uniform vec2 uAnchor;
uniform float uDensity;
uniform float uSpread;
uniform float uGravity;
uniform float uSwirl;
uniform float uProgress;
uniform float uSize;
uniform float uDpr;
uniform float uTime;
out vec2 vCenter;
out float vSize;
out float vAlpha;
${HASH}
void main () {
  float fid = float(gl_VertexID);
  vec2 cell = vec2(mod(fid, uGrid.x), floor(fid / uGrid.x));
  float h1 = hash(cell);
  float h2 = hash(cell + vec2(1.7, 9.1));
  float h3 = hash(cell + vec2(5.5, 2.9));
  float h4 = hash(cell + vec2(8.4, 4.2));
  float h5 = hash(cell + vec2(3.2, 7.8));
  float h6 = hash(cell + vec2(9.7, 1.3));
  vec2 home = (cell + vec2(h5, h6)) * uDensity;
  vec2 dir = normalize(vec2(h2 - 0.5, h3 - 0.5) + vec2(1e-4, 0.0));
  vec2 anchorDelta = home - uAnchor;
  float reach = 0.16 + 0.84 * pow(h4, 2.2);
  // Rise immediately, then bend progressively like a smooth smoke plume.
  float lift = 1.0 - pow(1.0 - uProgress, 2.0);
  float sweep = uProgress * uProgress * uProgress;
  vec2 smoke = vec2(
    -uSpread * sweep,
    -uSpread * (0.55 * lift + 0.2 * sweep)
  ) * reach;
  smoke += dir * uSpread * 0.12 * sweep * (0.4 + 0.6 * h4);
  smoke.y += uGravity * uSpread * lift * (0.25 + 0.75 * h4);
  vec2 pos = uAnchor + anchorDelta * (1.0 + 0.025 * sweep) + smoke;
  vec2 tangent = normalize(vec2(-max(sweep, 0.05), -max(lift * 0.75, 0.05)));
  vec2 perp = vec2(-tangent.y, tangent.x);
  pos += perp * (h2 - 0.5) * 2.0 * uSwirl * sin(lift * 3.14159);
  float amp = lift * (uSpread * 0.02 + 1.2);
  pos += vec2(
    sin(uTime * (4.0 + 5.0 * h2) + h3 * 40.0),
    cos(uTime * (3.5 + 5.5 * h3) + h2 * 40.0)
  ) * amp;
  float breakup = smoothstep(0.08, 0.42, uProgress);
  vCenter = home;
  vSize = mix(uSize * 1.15, uSize, breakup);
  /* Each particle's weight jitters with its own hash so the field reads as
     drifting dust with density variation instead of a solid carpet. */
  vAlpha = (1.0 - smoothstep(0.28 + h1 * 0.14, 0.96, uProgress)) * (0.55 + 0.45 * h1);
  gl_Position = vec4(
    pos.x / uRes.x * 2.0 - 1.0,
    1.0 - pos.y / uRes.y * 2.0,
    0.0,
    1.0
  );
  gl_PointSize = max(vSize * uDpr, 1.0);
}`;

const DISSOLVE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uContent;
uniform vec2 uRes;
uniform float uDark;
in vec2 vCenter;
in float vSize;
in float vAlpha;
out vec4 outColor;
void main () {
  vec2 offset = gl_PointCoord - 0.5;
  vec2 uv = clamp((vCenter + offset * vSize) / uRes, 0.0, 1.0);
  vec4 tex = texture(uContent, uv);
  float circle = 1.0 - smoothstep(0.25, 0.5, length(offset));
  /* Dark themes must glow: a particle sampling a dark page pixel would sink
     into the dark backdrop. Lift by luminance — dark source pixels move far
     toward a light tint, already-bright ink keeps most of its own tone — so
     the field stays legible while retaining color variation. Light themes
     only need a small push toward their deep ink. */
  float lum = dot(tex.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 contrastTarget = uDark > 0.5 ? vec3(0.94) : vec3(0.04, 0.11, 0.2);
  float lift = uDark > 0.5 ? mix(0.72, 0.32, lum) : 0.24;
  vec3 particleColor = mix(tex.rgb, contrastTarget, lift);
  /* Lift translucent fills (glass tints, antialiased glyph edges) enough to
     read, but keep solid content dominant; barely-there pixels are dropped so
     the field follows content mass instead of carpeting every empty pixel. */
  float alpha = min(pow(tex.a, 0.85) * 1.1, 1.0) * vAlpha * circle;
  if (alpha < 0.08) discard;
  outColor = vec4(particleColor, alpha);
}`;

interface ParticleRenderer {
  canvas: HTMLCanvasElement;
  fragment: WebGLShader;
  gl: WebGL2RenderingContext;
  inUse: boolean;
  program: WebGLProgram;
  texture: WebGLTexture;
  uniforms: Record<string, WebGLUniformLocation>;
  vao: WebGLVertexArrayObject;
  vertex: WebGLShader;
}

let sharedRenderer: ParticleRenderer | null = null;

/**
 * Feature-detect the particle dissolve in this browser: a WebGL2 context is
 * the only hard requirement (the texture comes from the HTML-in-Canvas
 * capture when available, or from the synthetic dust field otherwise).
 */
export function supportsParticleDissolve(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    const supported = gl !== null;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return supported;
  } catch {
    return false;
  }
}

/**
 * Feature-detect the official HTML-in-Canvas capture specifically; without it
 * the particle dissolve still runs, but on the synthetic dust texture.
 */
export function supportsParticleCapture(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const probe = document.createElement('canvas') as PaintableCanvas;
    const context = probe.getContext('2d') as ElementImageContext | null;
    return (
      typeof context?.drawElementImage === 'function' && typeof probe.requestPaint === 'function'
    );
  } catch {
    return false;
  }
}

function prefersDarkColorScheme(): boolean {
  const root = document.documentElement;
  const explicit = root.dataset.theme;
  if (explicit === 'dark') return true;
  if (explicit === 'light') return false;
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function createRenderer(): ParticleRenderer | null {
  const canvas = document.createElement('canvas');
  canvas.className = 'nv-particle-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    stencil: false,
  });
  if (!gl || gl.isContextLost()) {
    canvas.remove();
    return null;
  }

  const vertex = compileShader(gl, gl.VERTEX_SHADER, DISSOLVE_VERT);
  const fragment = vertex === null ? null : compileShader(gl, gl.FRAGMENT_SHADER, DISSOLVE_FRAG);
  if (vertex === null || fragment === null) {
    if (vertex !== null) gl.deleteShader(vertex);
    if (fragment !== null) gl.deleteShader(fragment);
    canvas.remove();
    return null;
  }

  const program = gl.createProgram();
  if (program === null) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    canvas.remove();
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    canvas.remove();
    return null;
  }

  const vao = gl.createVertexArray();
  const texture = gl.createTexture();
  if (vao === null || texture === null) {
    if (vao !== null) gl.deleteVertexArray(vao);
    if (texture !== null) gl.deleteTexture(texture);
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    canvas.remove();
    return null;
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, TRANSPARENT_PIXEL);

  return {
    canvas,
    fragment,
    gl,
    inUse: false,
    program,
    texture,
    uniforms: readUniforms(gl, program),
    vao,
    vertex,
  };
}

function destroyRenderer(renderer: ParticleRenderer): void {
  renderer.canvas.remove();
  renderer.gl.deleteTexture(renderer.texture);
  renderer.gl.deleteVertexArray(renderer.vao);
  renderer.gl.deleteProgram(renderer.program);
  renderer.gl.deleteShader(renderer.vertex);
  renderer.gl.deleteShader(renderer.fragment);
}

function acquireRenderer(): ParticleRenderer | null {
  if (sharedRenderer?.gl.isContextLost()) {
    destroyRenderer(sharedRenderer);
    sharedRenderer = null;
  }
  if (sharedRenderer === null) {
    sharedRenderer = createRenderer();
  }
  if (sharedRenderer !== null && !sharedRenderer.inUse) {
    sharedRenderer.inUse = true;
    return sharedRenderer;
  }

  const renderer = createRenderer();
  if (renderer !== null) renderer.inUse = true;
  return renderer;
}

function releaseRenderer(renderer: ParticleRenderer): void {
  const { gl, texture } = renderer;
  renderer.canvas.remove();
  if (renderer !== sharedRenderer) {
    destroyRenderer(renderer);
    return;
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, TRANSPARENT_PIXEL);
  gl.viewport(0, 0, renderer.canvas.width, renderer.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  renderer.inUse = false;
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (shader === null) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function readUniforms(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): Record<string, WebGLUniformLocation> {
  const uniforms: Record<string, WebGLUniformLocation> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index += 1) {
    const info = gl.getActiveUniform(program, index);
    if (info === null) continue;
    const location = gl.getUniformLocation(program, info.name);
    if (location !== null) uniforms[info.name] = location;
  }
  return uniforms;
}

function readParticleDurationMs(defaultMs: number): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--neoverse-motion-particle-duration')
    .trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return defaultMs;
  /* 'ms' must be tested first: it also ends with 's'. */
  if (raw.endsWith('ms')) return value;
  if (raw.endsWith('s')) return value * 1000;
  return value;
}

interface DustBox {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  alpha: number;
  color: string;
}

interface DustGlyph {
  text: string;
  x: number;
  y: number;
  height: number;
  fontSize: number;
  font: string;
  alpha: number;
  color: string;
}

interface DustSilhouette {
  boxes: DustBox[];
  glyphs: DustGlyph[];
}

const DUST_BOX_LIMIT = 260;
const DUST_TEXT_GLYPH_LIMIT = 3_000;

function hasDirectText(element: Element): boolean {
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0) {
      return true;
    }
  }
  return false;
}

function isPaintedSurface(style: CSSStyleDeclaration): boolean {
  return (
    (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') ||
    style.backgroundImage !== 'none'
  );
}

function visibleSourceBand(sourceRect: DOMRect): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const left = Math.max(sourceRect.left, 0);
  const top = Math.max(sourceRect.top, 0);
  const right = Math.min(sourceRect.right, window.innerWidth);
  const bottom = Math.min(sourceRect.bottom, window.innerHeight);
  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

/**
 * Approximate the region's visible silhouette from the DOM. Painted surfaces
 * contribute mass boxes and direct text is rasterized glyph by glyph at its
 * measured DOM position, so the fallback mask can use the same WebGL sampling
 * grid as the HTML-in-Canvas capture path.
 */
function collectDustSilhouette(
  source: HTMLElement,
  band: { left: number; top: number; width: number; height: number },
  fallbackInk: string,
): DustSilhouette {
  const boxes: DustBox[] = [];
  const glyphs: DustGlyph[] = [];

  const pushBox = (rect: DOMRect, alpha: number, color: string, radius: number): void => {
    if (boxes.length >= DUST_BOX_LIMIT) return;
    const x = Math.max(rect.left, band.left);
    const y = Math.max(rect.top, band.top);
    const right = Math.min(rect.right, band.left + band.width);
    const bottom = Math.min(rect.bottom, band.top + band.height);
    const width = right - x;
    const height = bottom - y;
    if (width < 2 || height < 2) return;
    boxes.push({
      x,
      y,
      width,
      height,
      radius: Math.min(radius, Math.min(width, height) / 2),
      alpha,
      color,
    });
  };

  const readOpacity = (element: HTMLElement, style: CSSStyleDeclaration): number => {
    let opacity = Number.parseFloat(style.opacity);
    if (!Number.isFinite(opacity)) opacity = 1;
    let parent = element.parentElement;
    while (parent !== null) {
      const parentOpacity = Number.parseFloat(getComputedStyle(parent).opacity);
      if (Number.isFinite(parentOpacity)) opacity *= parentOpacity;
      if (parent === source) break;
      parent = parent.parentElement;
    }
    return opacity;
  };

  const collectTextGlyphs = (
    element: HTMLElement,
    style: CSSStyleDeclaration,
    alpha: number,
  ): void => {
    if (glyphs.length >= DUST_TEXT_GLYPH_LIMIT) return;
    const fontSize = Number.parseFloat(style.fontSize) || 16;
    const font = `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const color = style.color || fallbackInk;
    const transform = style.textTransform;

    for (const node of element.childNodes) {
      if (glyphs.length >= DUST_TEXT_GLYPH_LIMIT) break;
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const content = node.textContent ?? '';
      if (content.trim().length === 0) continue;
      const range = document.createRange();
      for (let offset = 0; offset < content.length && glyphs.length < DUST_TEXT_GLYPH_LIMIT; ) {
        const codePoint = content.codePointAt(offset);
        if (codePoint === undefined) break;
        const rawGlyph = String.fromCodePoint(codePoint);
        const nextOffset = offset + rawGlyph.length;
        offset = nextOffset;
        if (/^\s+$/u.test(rawGlyph)) continue;

        range.setStart(node, nextOffset - rawGlyph.length);
        range.setEnd(node, nextOffset);
        const rect = range.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 2) continue;
        if (rect.right <= band.left || rect.left >= band.left + band.width) continue;
        if (rect.bottom <= band.top || rect.top >= band.top + band.height) continue;

        const text =
          transform === 'uppercase'
            ? rawGlyph.toUpperCase()
            : transform === 'lowercase'
              ? rawGlyph.toLowerCase()
              : rawGlyph;
        glyphs.push({
          text,
          x: rect.left,
          y: rect.top,
          height: rect.height,
          fontSize,
          font,
          alpha,
          color,
        });
      }
      range.detach();
    }
  };

  const visit = (element: HTMLElement): void => {
    const rect = element.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    if (rect.bottom <= band.top || rect.top >= band.top + band.height) return;
    const style = getComputedStyle(element);
    const opacity = readOpacity(element, style);
    if (style.visibility === 'hidden' || style.display === 'none' || opacity === 0) {
      return;
    }

    if (isPaintedSurface(style) && boxes.length < DUST_BOX_LIMIT) {
      const radius = Number.parseFloat(style.borderTopLeftRadius) || 0;
      const hasColor =
        style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
      pushBox(
        rect,
        opacity * (hasColor ? 1 : 0.2),
        hasColor ? style.backgroundColor : fallbackInk,
        radius,
      );
    }

    if (hasDirectText(element) && glyphs.length < DUST_TEXT_GLYPH_LIMIT) {
      collectTextGlyphs(element, style, opacity);
    }
  };

  const walk = (element: Element, depth: number): void => {
    if ((boxes.length >= DUST_BOX_LIMIT && glyphs.length >= DUST_TEXT_GLYPH_LIMIT) || depth > 14) {
      return;
    }
    for (const child of element.children) {
      if (boxes.length >= DUST_BOX_LIMIT && glyphs.length >= DUST_TEXT_GLYPH_LIMIT) return;
      if (!(child instanceof HTMLElement)) continue;
      if (child.matches(CAPTURE_EXCLUDE_SELECTOR)) continue;
      visit(child);
      walk(child, depth + 1);
    }
  };

  visit(source);
  walk(source, 0);
  return { boxes, glyphs };
}

/**
 * Paint a synthetic silhouette mask for browsers without HTML-in-Canvas.
 * WebGL emits the particles on its normal preset grid; this texture only marks
 * where visible content exists, avoiding the extra random thinning that made
 * the fallback much sparser than captured HTML.
 */
function paintDustTexture(
  context: CanvasRenderingContext2D,
  source: HTMLElement,
  sourceRect: DOMRect,
  dpr: number,
): void {
  context.reset?.();
  const band = visibleSourceBand(sourceRect);
  if (band.width <= 0 || band.height <= 0) return;

  const ink = getComputedStyle(source).color;
  const accent =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--neoverse-color-accent-primary')
      .trim() || ink;
  const { boxes, glyphs } = collectDustSilhouette(source, band, accent);

  context.save();
  context.scale(dpr, dpr);
  context.beginPath();
  context.rect(band.left, band.top, band.width, band.height);
  context.clip();

  if (boxes.length === 0 && glyphs.length === 0) {
    context.globalAlpha = 0.35;
    context.fillStyle = accent;
    context.fillRect(band.left, band.top, band.width, band.height);
    context.restore();
    return;
  }

  /* Surface mass first, then actual glyph shapes, like the captured page. */
  for (const box of boxes) {
    context.beginPath();
    if (box.radius > 0 && typeof context.roundRect === 'function') {
      context.roundRect(box.x, box.y, box.width, box.height, box.radius);
    } else {
      context.rect(box.x, box.y, box.width, box.height);
    }
    context.globalAlpha = box.alpha;
    context.fillStyle = box.color;
    context.fill();
  }

  context.textBaseline = 'alphabetic';
  context.textAlign = 'left';
  for (const glyph of glyphs) {
    context.globalAlpha = glyph.alpha;
    context.fillStyle = glyph.color;
    context.font = glyph.font;
    const baseline = glyph.y + (glyph.height - glyph.fontSize) / 2 + glyph.fontSize * 0.8;
    context.fillText(glyph.text, glyph.x, baseline);
  }
  context.restore();
}

/**
 * Create the dissolve for one element. Texture source, in order of
 * preference: the official HTML-in-Canvas capture of a sanitized clone
 * (pixel-perfect), then a synthetic theme-colored dust field. Returns null
 * only when there is no WebGL2 context — callers fall back to the CSS
 * choreography.
 */
export function createParticleDissolve(
  options: ParticleDissolveOptions,
): ParticleDissolveHandle | null {
  const { source, preset = 'high', durationMs, mode = 'auto' } = options;
  if (typeof document === 'undefined' || prefersReducedMotion()) return null;
  if (!source.isConnected) return null;

  const particlePreset = particleDissolvePresets[preset];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = acquireRenderer();
  if (renderer === null) return null;

  const sourceRect = source.getBoundingClientRect();
  const width = Math.max(1, Math.round(window.innerWidth * dpr));
  const height = Math.max(1, Math.round(window.innerHeight * dpr));

  const sourceCanvas = document.createElement('canvas') as PaintableCanvas;
  sourceCanvas.className = 'nv-particle-source';
  sourceCanvas.setAttribute('aria-hidden', 'true');
  const sourceContext = sourceCanvas.getContext('2d') as ElementImageContext | null;
  if (sourceContext === null) {
    releaseRenderer(renderer);
    return null;
  }

  /* Two texture sources, one choreography:
     1. Official HTML-in-Canvas capture — the leaving region is rasterized
        pixel-perfect through a sanitized clone.
     2. Synthetic dust — browsers without the capture API get a theme-colored
        speckle field over the region, so the dissolve stays a real particle
        animation everywhere WebGL2 exists. */
  const captureSupported =
    typeof sourceContext.drawElementImage === 'function' &&
    typeof sourceCanvas.requestPaint === 'function';
  if (mode === 'capture' && !captureSupported) {
    releaseRenderer(renderer);
    return null;
  }
  const useCapture = mode === 'capture' || (mode === 'auto' && captureSupported);

  let clone: HTMLElement | null = null;
  if (useCapture) {
    sourceCanvas.setAttribute('layoutsubtree', 'true');
    clone = source.cloneNode(true) as HTMLElement;
    clone.setAttribute('data-neoverse-particle-capture', '');
    clone.inert = true;
    clone.setAttribute('aria-hidden', 'true');
    /* The clone lays out inside the capture canvas with a different containing
       block, so pin the live width and clear margins — otherwise text rewraps
       and the particles no longer line up with the page the user saw. */
    clone.style.width = `${sourceRect.width}px`;
    clone.style.margin = '0';
    clone.querySelectorAll(CAPTURE_EXCLUDE_SELECTOR).forEach((node) => {
      node.remove();
    });
    sourceCanvas.append(clone);
  }

  const output = renderer.canvas;
  output.width = width;
  output.height = height;
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  document.body.append(sourceCanvas);

  const uploadTexture = (): boolean => {
    try {
      if (clone === null) {
        paintDustTexture(sourceContext, source, sourceRect, dpr);
      } else {
        sourceContext.reset?.();
        // Clip the capture to the element's on-screen band so particles only
        // spawn where the leaving region was actually visible.
        sourceContext.beginPath();
        const band = visibleSourceBand(sourceRect);
        sourceContext.rect(band.left * dpr, band.top * dpr, band.width * dpr, band.height * dpr);
        sourceContext.clip();
        /* Anchor alignment: measure where the anchor child landed inside the
           clone's own layout and offset the draw so content sits exactly where
           the live element was — scroll position and containing-block
           differences cancel out. Falls back to the live rect when the shape
           has no element children. */
        const cloneRect = clone.getBoundingClientRect();
        const sourceAnchorRect = source.firstElementChild?.getBoundingClientRect();
        const cloneAnchorRect = clone.firstElementChild?.getBoundingClientRect();
        const captureX =
          sourceAnchorRect && cloneAnchorRect
            ? sourceAnchorRect.left - (cloneAnchorRect.left - cloneRect.left)
            : sourceRect.left;
        const captureY =
          sourceAnchorRect && cloneAnchorRect
            ? sourceAnchorRect.top - (cloneAnchorRect.top - cloneRect.top)
            : sourceRect.top;
        sourceContext.drawElementImage?.(clone, captureX * dpr, captureY * dpr);
      }
      const { gl, texture } = renderer;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
      return true;
    } catch {
      return false;
    }
  };

  /* The public duration token is the actual choreography lifetime. Do not
     shorten it behind the token with a private scale: the incoming region
     starts later and must be able to finish its entrance while the particle
     overlay is still alive. Keeping one source of truth also prevents the
     cleanup lifecycle from racing the delayed incoming animation. */
  const duration = durationMs ?? readParticleDurationMs(910);
  /* Grow the grid spacing only past a ~2.7M px viewport (1.2M-point budget at
     the preset spacing) so huge screens stay within a sane point count while
     normal screens get the full preset density. */
  const density =
    Math.max(
      particlePreset.density,
      Math.sqrt((window.innerWidth * window.innerHeight) / 1_200_000),
    ) * PARTICLE_SPACING_SCALE;
  const gridX = Math.ceil(window.innerWidth / density);
  const gridY = Math.ceil(window.innerHeight / density);
  const anchorX =
    (Math.max(sourceRect.left, 0) + Math.min(sourceRect.right, window.innerWidth)) / 2;
  const anchorY =
    (Math.max(sourceRect.top, 0) + Math.min(sourceRect.bottom, window.innerHeight)) / 2;
  const dark = prefersDarkColorScheme();

  let frameId = 0;
  let destroyed = false;
  let textureReady = false;
  let playing = false;
  let playRequested = false;
  let startedAt = 0;
  let currentProgress = 0;
  let drawCalls = 0;
  let resolveFirstFrame: (value: boolean) => void = () => undefined;
  let resolveSettled: (value: boolean) => void = () => undefined;
  const firstFrame = new Promise<boolean>((resolve) => {
    resolveFirstFrame = resolve;
  });
  const settled = new Promise<boolean>((resolve) => {
    resolveSettled = resolve;
  });

  const draw = (now: number) => {
    if (destroyed || !textureReady) return;
    const { gl, program, uniforms, vao } = renderer;
    const progress = Math.min(Math.max((now - startedAt) / duration, 0), 1);
    currentProgress = progress;
    drawCalls += 1;
    const uniform = (name: string): WebGLUniformLocation | null => uniforms[name] ?? null;

    gl.viewport(0, 0, output.width, output.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderer.texture);
    gl.uniform1i(uniform('uContent'), 0);
    gl.uniform2f(uniform('uRes'), window.innerWidth, window.innerHeight);
    gl.uniform2f(uniform('uGrid'), gridX, gridY);
    gl.uniform2f(uniform('uAnchor'), anchorX, anchorY);
    gl.uniform1f(uniform('uDensity'), density);
    gl.uniform1f(uniform('uSpread'), particlePreset.spread);
    gl.uniform1f(uniform('uGravity'), particlePreset.gravity);
    gl.uniform1f(uniform('uSwirl'), particlePreset.swirl);
    gl.uniform1f(uniform('uProgress'), progress);
    gl.uniform1f(uniform('uSize'), particlePreset.size);
    gl.uniform1f(uniform('uDpr'), dpr);
    gl.uniform1f(uniform('uTime'), now / 1000);
    gl.uniform1f(uniform('uDark'), dark ? 1 : 0);
    gl.drawArrays(gl.POINTS, 0, gridX * gridY);

    resolveFirstFrame(true);
    if (progress < 1) {
      frameId = window.requestAnimationFrame(draw);
    } else {
      resolveSettled(true);
    }
  };

  if (clone === null) {
    /* Synthetic dust is ready on the spot — no paint event to wait for. */
    const uploaded = uploadTexture();
    sourceCanvas.remove();
    if (!uploaded) {
      releaseRenderer(renderer);
      resolveFirstFrame(false);
      resolveSettled(false);
      return null;
    }
    textureReady = true;
  } else {
    sourceCanvas.onpaint = () => {
      if (destroyed) return;
      const uploaded = uploadTexture();
      if (!uploaded) {
        resolveFirstFrame(false);
        resolveSettled(false);
      } else {
        textureReady = true;
        if (playRequested) {
          playing = true;
          startedAt = performance.now();
          frameId = window.requestAnimationFrame(draw);
        }
      }
      sourceCanvas.onpaint = null;
      sourceCanvas.remove();
    };
    sourceCanvas.requestPaint?.();
  }

  return {
    canvas: output,
    firstFrame,
    settled,
    play() {
      if (destroyed || playing) return;
      playRequested = true;
      if (!textureReady) return;
      playing = true;
      startedAt = performance.now();
      frameId = window.requestAnimationFrame(draw);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      window.cancelAnimationFrame(frameId);
      sourceCanvas.onpaint = null;
      sourceCanvas.remove();
      resolveFirstFrame(false);
      resolveSettled(false);
      releaseRenderer(renderer);
    },
    debug: () => ({
      progress: currentProgress,
      drawCalls,
      playing,
      textureReady,
      destroyed,
      durationMs: duration,
    }),
  };
}

/**
 * Create the WebGL resources for the dissolve while the page is idle so the
 * first navigation does not pay the context-creation cost.
 */
export function prewarmParticleDissolve(): void {
  if (typeof document === 'undefined' || prefersReducedMotion()) return;
  if (!supportsParticleDissolve()) return;
  if (sharedRenderer?.gl.isContextLost()) {
    destroyRenderer(sharedRenderer);
    sharedRenderer = null;
  }
  if (sharedRenderer === null) {
    sharedRenderer = createRenderer();
  }
  if (sharedRenderer === null || sharedRenderer.inUse) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  sharedRenderer.canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
  sharedRenderer.canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
  sharedRenderer.gl.viewport(0, 0, sharedRenderer.canvas.width, sharedRenderer.canvas.height);
  sharedRenderer.gl.clearColor(0, 0, 0, 0);
  sharedRenderer.gl.clear(sharedRenderer.gl.COLOR_BUFFER_BIT);
  sharedRenderer.gl.flush();
}
