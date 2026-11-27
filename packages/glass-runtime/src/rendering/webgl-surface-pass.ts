import { paintBackdropChroma } from '../backdrop-chroma.js';
import { createProgram, type GlassGl } from '../gl-program.js';
import type { OverflowClipCache } from '../overflow-clip.js';
import type { Mat2, StyleGetter, SurfaceVisualState } from '../surface-geometry.js';
import { getTableGridEdges, getTableOuterRect } from '../table-edges.js';
import {
  collectOccluders,
  maxOccluders,
  type Occluder,
  type OcclusionCandidate,
  type OcclusionContext,
} from './occlusion.js';
import type { OcclusionCache } from './occlusion-cache.js';
import type { SceneColors } from './scene-colors.js';
import { getEdgeScissors, getScissorRect } from './scissors.js';
import { readStyle } from './style-resolution.js';
import { type CanvasViewport, intersectsViewport } from './viewport.js';

const tableGlassSelector = 'table.ui-table, .neoverse-prose table';
const quadPositions = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

export type ProgramLocations = {
  position: number;
  viewport: WebGLUniformLocation | null;
  rect: WebGLUniformLocation | null;
  basis: WebGLUniformLocation | null;
  rectSize: WebGLUniformLocation | null;
  pixelRatio: WebGLUniformLocation | null;
  radii: WebGLUniformLocation | null;
  pointer: WebGLUniformLocation | null;
  edgeWidth: WebGLUniformLocation | null;
  softness: WebGLUniformLocation | null;
  opacity: WebGLUniformLocation | null;
  lightSurface: WebGLUniformLocation | null;
  colorDodge: WebGLUniformLocation | null;
  cornerFocus: WebGLUniformLocation | null;
  chroma: WebGLUniformLocation | null;
  gain: WebGLUniformLocation | null;
  tertiary: WebGLUniformLocation | null;
  secondary: WebGLUniformLocation | null;
  primary: WebGLUniformLocation | null;
  edgeLight: WebGLUniformLocation | null;
  carrier: WebGLUniformLocation | null;
  occluders: WebGLUniformLocation | null;
  occluderRadii: WebGLUniformLocation | null;
  occluderCount: WebGLUniformLocation | null;
};

export interface WebGLPassResources {
  canvas: HTMLCanvasElement;
  gl: GlassGl;
  program: WebGLProgram;
  locations: ProgramLocations;
  buffer: WebGLBuffer;
  colorProbe: HTMLElement;
}

const getWebGLContext = (canvas: HTMLCanvasElement): GlassGl | undefined => {
  try {
    const webgl2 = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    });
    if (webgl2 !== null) return webgl2;
    const webgl1 = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    });
    return webgl1 ?? undefined;
  } catch {
    return undefined;
  }
};

export const createWebGLPassResources = (
  ownerDocument: Document,
): WebGLPassResources | undefined => {
  const canvas = ownerDocument.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('data-neoverse-glass-renderer-canvas', 'true');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '2147483646';
  canvas.style.mixBlendMode = 'overlay';

  const gl = getWebGLContext(canvas);
  if (gl === undefined) return undefined;

  const program = createProgram(gl);
  const buffer = gl.createBuffer();
  if (program === undefined || buffer === null) {
    if (program !== undefined) gl.deleteProgram(program);
    return undefined;
  }

  const locations: ProgramLocations = {
    position: gl.getAttribLocation(program, 'a_position'),
    viewport: gl.getUniformLocation(program, 'u_viewport'),
    rect: gl.getUniformLocation(program, 'u_rect'),
    basis: gl.getUniformLocation(program, 'u_basis'),
    rectSize: gl.getUniformLocation(program, 'u_rect_size'),
    pixelRatio: gl.getUniformLocation(program, 'u_pixel_ratio'),
    radii: gl.getUniformLocation(program, 'u_radii'),
    pointer: gl.getUniformLocation(program, 'u_pointer'),
    edgeWidth: gl.getUniformLocation(program, 'u_edge_width'),
    softness: gl.getUniformLocation(program, 'u_softness'),
    opacity: gl.getUniformLocation(program, 'u_opacity'),
    lightSurface: gl.getUniformLocation(program, 'u_light_surface'),
    colorDodge: gl.getUniformLocation(program, 'u_color_dodge'),
    cornerFocus: gl.getUniformLocation(program, 'u_corner_focus'),
    chroma: gl.getUniformLocation(program, 'u_chroma'),
    gain: gl.getUniformLocation(program, 'u_gain'),
    tertiary: gl.getUniformLocation(program, 'u_tertiary'),
    secondary: gl.getUniformLocation(program, 'u_secondary'),
    primary: gl.getUniformLocation(program, 'u_primary'),
    edgeLight: gl.getUniformLocation(program, 'u_edge_light'),
    carrier: gl.getUniformLocation(program, 'u_carrier'),
    occluders: gl.getUniformLocation(program, 'u_occluders'),
    occluderRadii: gl.getUniformLocation(program, 'u_occluder_radii'),
    occluderCount: gl.getUniformLocation(program, 'u_occluder_count'),
  };

  const colorProbe = ownerDocument.createElement('span');
  colorProbe.setAttribute('aria-hidden', 'true');
  colorProbe.style.position = 'fixed';
  colorProbe.style.width = '0';
  colorProbe.style.height = '0';
  colorProbe.style.overflow = 'hidden';
  colorProbe.style.visibility = 'hidden';
  colorProbe.style.pointerEvents = 'none';

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadPositions, gl.STATIC_DRAW);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  return { canvas, gl, program, locations, buffer, colorProbe };
};

export const createChromaCanvasResources = (
  ownerDocument: Document,
  view: Window & { CSS?: Pick<typeof CSS, 'supports'> },
  mainCanvas: HTMLCanvasElement,
): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } | undefined => {
  if (
    typeof Path2D !== 'function' ||
    typeof Path2D.prototype.roundRect !== 'function' ||
    !view.CSS?.supports('mix-blend-mode', 'saturation')
  ) {
    // The geometry signal is only safe to paint when the compositor can
    // interpret it as saturation rather than displaying its source color.
    return undefined;
  }
  const canvas = ownerDocument.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('data-neoverse-glass-chroma-canvas', 'true');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.display = 'none';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '2147483646';
  canvas.style.mixBlendMode = 'saturation';
  let context: CanvasRenderingContext2D | null = null;
  try {
    context = canvas.getContext('2d');
  } catch {
    // Keep the established edge if the optional color field is unavailable.
  }
  if (!context || typeof context.roundRect !== 'function') return undefined;
  mainCanvas.before(canvas);
  return { canvas, context };
};

export const syncChromaCanvasVisibility = (
  view: Window | undefined,
  canvas: HTMLCanvasElement | undefined,
  chromaCanvas: HTMLCanvasElement | undefined,
): void => {
  if (!view || !canvas || !chromaCanvas) return;
  const visibility = view.getComputedStyle(canvas).visibility;
  if (chromaCanvas.style.visibility !== visibility) {
    chromaCanvas.style.visibility = visibility;
  }
};

export const removeStaleGlassCanvases = (
  ownerDocument: Document | undefined,
  rendererAttribute: string,
): void => {
  if (!ownerDocument) return;
  const stale = ownerDocument.querySelectorAll<HTMLCanvasElement>(
    '[data-neoverse-glass-renderer-canvas], [data-neoverse-glass-chroma-canvas]',
  );
  for (const canvas of stale) canvas.remove();
  if (
    stale.length > 0 &&
    ownerDocument.documentElement.getAttribute(rendererAttribute) === 'webgl'
  ) {
    ownerDocument.documentElement.removeAttribute(rendererAttribute);
  }
};

export interface SurfacePassInput {
  ownerDocument: Document;
  view: Window;
  resources: WebGLPassResources;
  chromaCanvas: HTMLCanvasElement | undefined;
  chromaContext: CanvasRenderingContext2D | undefined;
  elements: readonly HTMLElement[];
  measuredRects: ReadonlyMap<HTMLElement, DOMRect>;
  visibleCandidates: readonly OcclusionCandidate[];
  changedSurfaces: ReadonlySet<Element>;
  mutationRevision: number;
  viewport: CanvasViewport;
  pixelRatio: number;
  drawingWidth: number;
  drawingHeight: number;
  sceneColors: SceneColors;
  getStyle: StyleGetter;
  occlusionCache: OcclusionCache;
  occluderRects: Float32Array;
  occluderRadii: Float32Array;
}

export const drawGlassSurfacesPass = (input: SurfacePassInput): Set<HTMLElement> => {
  const {
    ownerDocument,
    view,
    resources: { canvas, gl, program, locations, buffer, colorProbe },
    chromaCanvas,
    chromaContext,
    elements,
    measuredRects,
    visibleCandidates,
    changedSurfaces,
    mutationRevision,
    viewport,
    pixelRatio,
    drawingWidth,
    drawingHeight,
    sceneColors: {
      gain,
      edgeLight,
      primary,
      secondary,
      tertiary,
      lightSurface,
      isLight,
      colorDodge,
    },
    getStyle,
    occlusionCache,
    occluderRects,
    occluderRadii,
  } = input;

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(locations.position);
  gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(locations.viewport, viewport.width, viewport.height);
  gl.uniform1f(locations.pixelRatio, pixelRatio);
  gl.uniform1f(locations.gain, gain);
  gl.uniform1f(locations.lightSurface, lightSurface);

  // Saturation would exaggerate even a neutral dark backdrop's blue lead.
  const backdropChroma = isLight;
  const boostLowerRight = isLight && colorDodge;
  if (chromaCanvas && chromaContext) {
    if (!chromaCanvas.isConnected && canvas.isConnected) canvas.before(chromaCanvas);
    const display = backdropChroma ? 'block' : 'none';
    if (chromaCanvas.style.display !== display) chromaCanvas.style.display = display;
    syncChromaCanvasVisibility(view, canvas, chromaCanvas);
    if (backdropChroma) {
      let resized = false;
      if (chromaCanvas.width !== drawingWidth) {
        chromaCanvas.width = drawingWidth;
        resized = true;
      }
      if (chromaCanvas.height !== drawingHeight) {
        chromaCanvas.height = drawingHeight;
        resized = true;
      }
      if (!resized) {
        chromaContext.resetTransform();
        chromaContext.clearRect(0, 0, drawingWidth, drawingHeight);
      }
      chromaContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }
  }

  const blendMode = colorDodge ? 'color-dodge' : 'overlay';
  if (canvas.style.mixBlendMode !== blendMode) canvas.style.mixBlendMode = blendMode;
  gl.uniform1f(locations.colorDodge, colorDodge ? 1 : 0);

  const visualCache = new Map<Element, SurfaceVisualState | null>();
  const matrixCache = new Map<Element, Mat2>();
  const hitTestCache = new Map<string, Element[]>();
  const hitTest = (x: number, y: number): Element[] => {
    const key = `${x},${y}`;
    const cached = hitTestCache.get(key);
    if (cached !== undefined) return cached;
    const stack = ownerDocument.elementsFromPoint?.(x, y) ?? [];
    hitTestCache.set(key, stack);
    return stack;
  };
  const occlusionContext: OcclusionContext = { hitTest, sortedByTop: true };

  gl.enable(gl.SCISSOR_TEST);
  const overflowClips: OverflowClipCache = new Map();
  const visibleTableCells = new Set<HTMLElement>();
  const uploadOccluders = (occluders: readonly Occluder[]): void => {
    if (locations.occluders === null || locations.occluderCount === null) return;
    let count = 0;
    for (const occluder of occluders) {
      occluderRects.set(
        [
          occluder.left - viewport.left,
          occluder.top - viewport.top,
          occluder.width,
          occluder.height,
        ],
        count * 4,
      );
      occluderRadii[count] = occluder.radius;
      count += 1;
    }
    gl.uniform4fv(locations.occluders, occluderRects);
    if (locations.occluderRadii !== null) gl.uniform1fv(locations.occluderRadii, occluderRadii);
    gl.uniform1f(locations.occluderCount, count);
  };

  for (const element of elements) {
    const table = element.matches(tableGlassSelector) ? (element as HTMLTableElement) : undefined;
    const measuredRect = measuredRects.get(element) ?? element.getBoundingClientRect();
    const rect = table ? getTableOuterRect(table, measuredRect) : measuredRect;
    // Skip surfaces the fixed canvas cannot show before reading their style:
    // a document-wide refresh otherwise resolves computed style and the
    // ancestor opacity chain for every offscreen control.
    if (!intersectsViewport(rect, viewport)) continue;
    const style = readStyle(
      element,
      view,
      colorProbe,
      viewport,
      rect,
      getStyle,
      visualCache,
      matrixCache,
      overflowClips,
    );
    if (style === undefined) continue;

    const scissor = getScissorRect(
      style.clipRect,
      viewport,
      pixelRatio,
      drawingWidth,
      drawingHeight,
    );
    if (scissor.width === 0 || scissor.height === 0) continue;

    const drawHeight = style.height + style.pointer[2];
    const cx =
      style.pointer[2] > 0
        ? style.centerX + style.basis[2] * (style.pointer[2] / 2)
        : style.centerX;
    const cy =
      style.pointer[2] > 0
        ? style.centerY + style.basis[3] * (style.pointer[2] / 2)
        : style.centerY;
    gl.uniform4f(
      locations.rect,
      cx - viewport.left - style.width / 2,
      cy - viewport.top - drawHeight / 2,
      style.width,
      drawHeight,
    );
    gl.uniform2f(locations.rectSize, style.width, style.height);
    gl.uniform4f(locations.basis, ...style.basis);
    gl.uniform4f(locations.radii, ...style.radii);
    gl.uniform3f(locations.pointer, ...style.pointer);
    gl.uniform1f(locations.edgeWidth, style.edgeWidth);
    gl.uniform1f(locations.softness, style.softness);
    gl.uniform1f(locations.opacity, style.opacity);
    gl.uniform1f(locations.cornerFocus, isLight ? 0.4 : 0.5);
    gl.uniform1f(locations.chroma, style.chroma);
    gl.uniform3f(locations.carrier, ...style.carrier);
    gl.uniform3f(locations.edgeLight, ...edgeLight);
    gl.uniform3f(locations.primary, ...primary);
    gl.uniform3f(locations.secondary, ...secondary);
    gl.uniform3f(locations.tertiary, ...tertiary);

    const occluders = occlusionCache.collect(
      element,
      style.rect,
      false,
      changedSurfaces,
      mutationRevision,
      () =>
        collectOccluders(
          element,
          style.rect,
          ownerDocument,
          view,
          visibleCandidates,
          false,
          occlusionContext,
        ),
    );
    uploadOccluders(occluders);
    if (backdropChroma && chromaContext) {
      paintBackdropChroma(chromaContext, style, viewport, occluders, gain, boostLowerRight);
    }
    for (const strip of getEdgeScissors(
      style,
      scissor,
      viewport,
      pixelRatio,
      drawingWidth,
      drawingHeight,
    )) {
      gl.scissor(strip.x, strip.y, strip.width, strip.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if (!table) continue;
    const grid = getTableGridEdges(
      table,
      style.rect,
      style.clipRect,
      viewport,
      style.edgeWidth,
      view,
    );
    if (grid.length === 0) continue;
    // Unlike the outer rim, a grid can be covered by an overlay entirely
    // inside the table. Share one interior occlusion pass across its cells.
    uploadOccluders(
      occlusionCache.collect(element, style.rect, true, changedSurfaces, mutationRevision, () =>
        collectOccluders(
          element,
          style.rect,
          ownerDocument,
          view,
          visibleCandidates,
          true,
          occlusionContext,
        ),
      ),
    );
    gl.uniform4f(locations.basis, 1, 0, 0, 1);
    gl.uniform4f(locations.radii, 0, 0, 0, 0);
    gl.uniform3f(locations.pointer, 0, 0, 0);
    for (const { cell, rect: cellRect, strips } of grid) {
      visibleTableCells.add(cell);
      gl.uniform4f(
        locations.rect,
        cellRect.left - viewport.left,
        cellRect.top - viewport.top,
        cellRect.width,
        cellRect.height,
      );
      gl.uniform2f(locations.rectSize, cellRect.width, cellRect.height);
      for (const strip of strips) {
        const area = getScissorRect(strip, viewport, pixelRatio, drawingWidth, drawingHeight);
        if (area.width === 0 || area.height === 0) continue;
        gl.scissor(area.x, area.y, area.width, area.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
  }

  gl.disable(gl.SCISSOR_TEST);
  return visibleTableCells;
};

export { maxOccluders };
