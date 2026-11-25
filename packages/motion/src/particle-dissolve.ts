// WebGL particle dissolve — the shared page-change choreography.
// A sanitized clone of the leaving region is rasterized through the official
// HTML-in-Canvas capture (content="drawable" + drawElementImage) when available;
// otherwise a DOM-measured silhouette mask feeds the same WebGL2 point-sprite
// pass. Both paths erode the page into particles that sample the source and
// drift away on a smoke plume. Browsers without WebGL2 use the CSS choreography.

import { paintDustTexture, visibleSourceBand } from './particle-dissolve-silhouette.js';
import {
  CAPTURE_EXCLUDE_SELECTOR,
  type ElementImageContext,
  PARTICLE_SPACING_SCALE,
  type PaintableCanvas,
  type ParticleDissolveHandle,
  type ParticleDissolveOptions,
  particleDissolvePresets,
} from './particle-dissolve-types.js';
import {
  acquireRenderer,
  prefersDarkColorScheme,
  readParticleDurationMs,
  releaseRenderer,
} from './particle-dissolve-webgl.js';
import { prefersReducedMotion } from './reduced-motion.js';

export type {
  ParticleDissolveDebugState,
  ParticleDissolveHandle,
  ParticleDissolveMode,
  ParticleDissolveOptions,
  ParticleDissolvePreset,
  ParticleDissolvePresetName,
} from './particle-dissolve-types.js';
export { particleDissolvePresets } from './particle-dissolve-types.js';
export {
  prewarmParticleDissolve,
  supportsParticleCapture,
  supportsParticleDissolve,
} from './particle-dissolve-webgl.js';

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
    /* Chrome 157 renamed the HTML-in-Canvas opt-in: <canvas layoutsubtree>
       became <canvas content="drawable">, and every element handed to
       drawElementImage() must carry a drawable attribute. Without the pair the
       call throws InvalidStateError and the texture stays blank. Chromium
       147-156 only understands layoutsubtree, so both are set; each build
       ignores the attribute it does not know. */
    sourceCanvas.setAttribute('content', 'drawable');
    sourceCanvas.setAttribute('layoutsubtree', 'true');
    clone = source.cloneNode(true) as HTMLElement;
    clone.setAttribute('drawable', '');
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
