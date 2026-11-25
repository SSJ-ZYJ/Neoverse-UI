import { prefersReducedMotion } from '../foundation/reduced-motion.js';
import type { ElementImageContext, PaintableCanvas } from './particle-dissolve-types.js';

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

export interface ParticleRenderer {
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

export function prefersDarkColorScheme(): boolean {
  const root = document.documentElement;
  const explicit = root.dataset.theme;
  if (explicit === 'dark') return true;
  if (explicit === 'light') return false;
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
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

export function acquireRenderer(): ParticleRenderer | null {
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

export function releaseRenderer(renderer: ParticleRenderer): void {
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

export function readParticleDurationMs(defaultMs: number): number {
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
