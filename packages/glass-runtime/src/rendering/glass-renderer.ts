import { paintBackdropChroma } from '../backdrop-chroma.js';
import { createProgram, type GlassGl } from '../gl-program.js';
import {
  hasActiveEdgeMotion,
  hasAnyDocumentEdgeMotion,
  type MotionTrackingContext,
  motionStaticSelector,
  motionWakeEventName,
  shouldTrackMotionEvent,
} from '../motion-tracking.js';
import { NativeGlassRenderer, supportsNativeRefraction } from '../native.js';
import type { OverflowClipCache } from '../overflow-clip.js';
import type { Color } from '../style-colors.js';
import {
  createTopLayerHelpers,
  type Mat2,
  parseFirstNumber,
  type StyleGetter,
  type SurfaceVisualState,
  type TopLayerHelpers,
} from '../surface-geometry.js';
import { getTableGridEdges, getTableOuterRect } from '../table-edges.js';
import type { GlassRenderer, GlassRendererOptions } from '../types.js';
import {
  collectOccluders,
  maxOccluders,
  type Occluder,
  type OcclusionCandidate,
  type OcclusionContext,
  occluderSelector,
} from './occlusion.js';
import { getEdgeScissors, getScissorRect } from './scissors.js';
import {
  colorProperties,
  firstPropertyValue,
  getVariant,
  glassSelector,
  inheritsParentGlassEdge,
  readStyle,
  resolveColor,
} from './style-resolution.js';
import {
  getCanvasViewport,
  intersectsViewport,
  normalizeMaxDevicePixelRatio,
  resolveDevicePixelRatio,
} from './viewport.js';

export const glassRendererAttribute = 'data-neoverse-glass-renderer';

const tableGlassSelector = 'table.ui-table, .neoverse-prose table';
const cssEdgePassSelector = '[data-neoverse-glass-edge-pass="css"]';
const reducedTransparencyQuery = '(prefers-reduced-transparency: reduce)';
const systemDarkQuery = '(prefers-color-scheme: dark)';
// Cap passive scroll and viewport-resize bursts at roughly 60 fps while keeping
// active motion and element resizes locked to vsync. Using 15 ms avoids 60 Hz
// frame-timestamp jitter dropping to 30 fps.
const minFrameIntervalMs = 15;
const glassMutationAttributes = [
  'class',
  'style',
  'hidden',
  'open',
  'data-theme',
  'data-presentation',
  'data-surface',
  glassRendererAttribute,
  'data-neoverse-glass-edge-pass',
  'data-neoverse-glass-edge-pass-active',
  'data-neoverse-glass-occluder',
  'data-neoverse-glass-nesting',
  'data-neoverse-tooltip-surface',
  'colspan',
  'rowspan',
  'span',
] as const;
// Attribute changes outside a Glass surface, its occluders and its ancestors
// cannot move or restyle an edge. Typewriters and scrollbar thumbs emit
// thousands of style mutations per second from exactly that region.
const sceneRelevantAttributes = new Set([
  'data-theme',
  'open',
  'data-presentation',
  'data-surface',
  glassRendererAttribute,
  'data-neoverse-glass-edge-pass',
  'data-neoverse-glass-edge-pass-active',
  'data-neoverse-glass-occluder',
  'data-neoverse-glass-nesting',
  'data-neoverse-tooltip-surface',
  'colspan',
  'rowspan',
  'span',
  'hidden',
]);
const quadPositions = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
const motionEvents = [
  'pointerdown',
  'pointerup',
  'pointercancel',
  'keydown',
  'keyup',
  'focusin',
  'focusout',
  'transitionrun',
  'transitionstart',
  'transitionend',
  'transitioncancel',
  'animationstart',
  'animationend',
  'animationcancel',
  motionWakeEventName,
] as const;

type GlassWindow = Window & {
  CSS?: Pick<typeof CSS, 'supports'>;
  ResizeObserver?: typeof ResizeObserver;
  MutationObserver?: typeof MutationObserver;
  Document?: typeof Document;
};

type ProgramLocations = {
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

interface SceneColors {
  gain: number;
  edgeLight: Color;
  primary: Color;
  secondary: Color;
  tertiary: Color;
  lightSurface: number;
  isLight: boolean;
  colorDodge: boolean;
}

const activeRenderers = new WeakMap<Document, GlassRenderer>();

const getDocument = (candidate?: Document): Document | undefined => {
  if (candidate !== undefined) {
    return candidate;
  }

  return typeof document === 'undefined' ? undefined : document;
};

const getWindow = (ownerDocument?: Document): GlassWindow | undefined =>
  (ownerDocument?.defaultView as GlassWindow | null | undefined) ?? undefined;

class GlassRendererImpl implements GlassRenderer {
  private readonly ownerDocument: Document | undefined;
  private readonly maxDevicePixelRatio: number;
  private mounted = false;
  private active = false;
  private suspended = false;
  private canvas: HTMLCanvasElement | undefined;
  private chromaCanvas: HTMLCanvasElement | undefined;
  private chromaContext: CanvasRenderingContext2D | undefined;
  private chromaUnavailable = false;
  private colorProbe: HTMLElement | undefined;
  private gl: GlassGl | undefined;
  private program: WebGLProgram | undefined;
  private locations: ProgramLocations | undefined;
  private buffer: WebGLBuffer | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private readonly observedGlassElements = new Set<HTMLElement>();
  private readonly observedTableCells = new Set<HTMLElement>();
  private mutationObserver: MutationObserver | undefined;
  private transparencyQuery: MediaQueryList | undefined;
  private systemSchemeQuery: MediaQueryList | undefined;
  private animationFrame: number | undefined;
  private paintedEdges = false;
  private contextLost = false;
  private uncappedRefresh = false;
  private wasMoving = false;
  private isRendering = false;
  private topLayer: TopLayerHelpers | undefined;
  private readonly occluderRects = new Float32Array(maxOccluders * 4);
  private readonly occluderRadii = new Float32Array(maxOccluders);
  private readonly animatedElements = new Set<Element>();
  // Occlusion depends on the surface box, the boxes of the surfaces that can
  // overlap it, and stacking/visibility mutations. Re-probing every point on
  // every animation frame made a Playground refresh cost seconds in WebKit.
  private readonly occlusionCache = new WeakMap<
    HTMLElement,
    { signature: string; revision: number; outer?: Occluder[]; interior?: Occluder[] }
  >();
  private surfaceRects = new Map<Element, DOMRect>();
  private mutationRevision = 0;
  private colorSignature = 0;
  private sceneColors: SceneColors | undefined;
  private sceneSignature = 0;
  private signatureHash = 2166136261;
  private lastFrameTime = 0;
  private readonly handleMotion = (event: Event): void => {
    if (!this.active) return;
    const target = event.target as Element | null;
    if (
      typeof target?.matches !== 'function' ||
      !shouldTrackMotionEvent(event, target, glassSelector, occluderSelector)
    ) {
      return;
    }
    this.animatedElements.add(target);
    this.scheduleRefresh(true);
  };
  private previousRendererAttribute: string | null = null;
  private readonly handleViewportResize = (): void => {
    // Responsive colors are checked against the root tokens when we paint.
    // Geometry changes must not discard them or restart the frame clock.
    this.invalidateFrame();
    this.scheduleRefresh(false);
  };
  private readonly handleElementResize = (): void => {
    if (!this.active || this.suspended || this.isRendering) return;
    // ResizeObserver runs after requestAnimationFrame and before paint; draw
    // immediately so WAAPI and CSS size changes stay aligned on the same frame.
    this.invalidateFrame();
    this.render(false);
    if (this.hasLiveEdgeMotion()) {
      this.scheduleRefresh(true);
    }
  };
  private readonly handleScroll = (event?: Event): void => {
    const target = event?.target;
    const isRootScroll =
      event === undefined ||
      target === null ||
      target === this.ownerDocument ||
      target === this.ownerDocument?.documentElement ||
      target === this.ownerDocument?.body ||
      target === this.ownerDocument?.defaultView;

    if (!isRootScroll && target && typeof (target as Element).matches === 'function') {
      const element = target as Element;
      const hasGlassOrOccluder =
        element.matches(glassSelector) ||
        element.matches(occluderSelector) ||
        element.closest(glassSelector) !== null ||
        element.closest(occluderSelector) !== null ||
        element.querySelector(glassSelector) !== null ||
        element.querySelector(occluderSelector) !== null;

      if (!hasGlassOrOccluder) {
        return;
      }
    }

    this.invalidateFrame();
    this.scheduleRefresh(false);
  };
  private readonly handleToggle = (): void => {
    this.invalidateScene();
    this.scheduleRefresh(true);
  };
  private readonly handleSystemSchemeChange = (): void => {
    this.invalidateScene();
    this.scheduleRefresh(true);
  };
  private readonly handleMutations = (records: MutationRecord[]): void => {
    if (records.some((record) => record.target === this.canvas)) this.syncChromaVisibility();
    if (records.every((record) => !this.isSceneMutation(record))) {
      if (this.hasLiveDocumentEdgeMotion()) {
        this.scheduleRefresh(true);
      }
      return;
    }

    this.mutationRevision += 1;
    this.scheduleRefresh(true);
  };

  /** Decorative attribute churn cannot change edge geometry; only scene-bearing
   * mutations raise the revision and schedule a repaint. */
  private isSceneMutation(record: MutationRecord): boolean {
    const target = record.target;
    const element = target.nodeType === 1 ? (target as Element) : undefined;
    if (
      target === this.colorProbe ||
      target === this.canvas ||
      target === this.chromaCanvas ||
      element?.closest('[data-neoverse-particle-capture]') ||
      element?.closest(motionStaticSelector)
    ) {
      return false;
    }
    if (record.type !== 'attributes') return true;
    const name = record.attributeName ?? '';
    if (sceneRelevantAttributes.has(name)) return true;
    if (name !== 'class' && name !== 'style') return true;
    if (element === undefined || element === this.ownerDocument?.documentElement) return true;
    if (element.matches?.(glassSelector) || element.closest(glassSelector)) return true;
    if (element.matches?.(occluderSelector) || element.closest(occluderSelector)) return true;
    // An ancestor can move or resize a surface without changing its attributes.
    return Boolean(element.querySelector?.(glassSelector));
  }
  private changedOverlaps(
    bounds: { left: number; top: number; width: number; height: number },
    changed: ReadonlySet<Element>,
    self: HTMLElement,
  ): boolean {
    for (const element of changed) {
      if (element === self) return true;
      const rect = this.surfaceRects.get(element);
      if (rect === undefined) return true;
      if (
        rect.left < bounds.left + bounds.width &&
        bounds.left < rect.left + rect.width &&
        rect.top < bounds.top + bounds.height &&
        bounds.top < rect.top + rect.height
      ) {
        return true;
      }
    }
    return false;
  }
  private collectCachedOccluders(
    element: HTMLElement,
    bounds: { left: number; top: number; width: number; height: number },
    includeInterior: boolean,
    changed: ReadonlySet<Element>,
    collect: () => Occluder[],
  ): Occluder[] {
    const signature = `${bounds.left}:${bounds.top}:${bounds.width}:${bounds.height}`;
    const cached = this.occlusionCache.get(element);
    const valid =
      cached !== undefined &&
      cached.signature === signature &&
      cached.revision === this.mutationRevision;
    const memo = valid ? (includeInterior ? cached.interior : cached.outer) : undefined;
    if (memo !== undefined && !this.changedOverlaps(bounds, changed, element)) return memo;

    const occluders = collect();
    if (valid && cached !== undefined) {
      if (includeInterior) cached.interior = occluders;
      else cached.outer = occluders;
    } else {
      this.occlusionCache.set(element, {
        signature,
        revision: this.mutationRevision,
        ...(includeInterior ? { interior: occluders } : { outer: occluders }),
      });
    }
    return occluders;
  }
  private readonly handleTransparencyChange = (event: MediaQueryListEvent): void => {
    if (event.matches) {
      this.deactivate();
    } else if (this.mounted && !this.active && !this.contextLost) {
      this.activate();
    }
  };
  private readonly handleContextLoss = (event: Event): void => {
    event.preventDefault();
    if (!this.active) return;

    this.contextLost = true;
    this.uncappedRefresh = false;
    this.wasMoving = false;
    this.cancelScheduledRefresh();
    this.animatedElements.clear();
    this.disconnectObservers();
    if (this.canvas !== undefined) {
      this.canvas.style.display = 'none';
    }
    if (this.chromaCanvas !== undefined) this.chromaCanvas.style.display = 'none';
    this.restoreRendererAttribute();
    this.active = false;
  };
  private readonly handleContextRestore = (): void => {
    if (!this.mounted || !this.contextLost) return;

    this.discardLostContext();
    if (this.transparencyQuery?.matches !== true) {
      this.activate();
    }
  };

  public constructor(options: GlassRendererOptions) {
    this.ownerDocument = getDocument(options.document);
    this.maxDevicePixelRatio = normalizeMaxDevicePixelRatio(options.maxDevicePixelRatio);
  }

  public mount(): void {
    if (this.mounted || this.ownerDocument === undefined || this.ownerDocument.body === null) {
      return;
    }

    const existing = activeRenderers.get(this.ownerDocument);
    if (existing !== undefined && existing !== this) {
      return;
    }

    this.mounted = true;
    this.topLayer = createTopLayerHelpers(this.ownerDocument);
    activeRenderers.set(this.ownerDocument, this);
    const view = getWindow(this.ownerDocument);
    this.transparencyQuery = view?.matchMedia?.(reducedTransparencyQuery);
    this.transparencyQuery?.addEventListener('change', this.handleTransparencyChange);
    this.systemSchemeQuery = view?.matchMedia?.(systemDarkQuery);
    this.systemSchemeQuery?.addEventListener('change', this.handleSystemSchemeChange);
    this.ownerDocument.addEventListener('scroll', this.handleScroll, true);
    this.ownerDocument.addEventListener('toggle', this.handleToggle, true);
    for (const event of motionEvents) {
      this.ownerDocument.addEventListener(event, this.handleMotion, true);
    }
    view?.addEventListener('scroll', this.handleScroll, { passive: true });
    view?.addEventListener('resize', this.handleViewportResize);
    this.activate();
  }

  public refresh(force = true): void {
    if (this.active) {
      // The public contract stays forceful; pass false to let the frame cache deduplicate.
      this.render(force);
    }
  }

  public suspend(): void {
    if (this.suspended) return;
    this.suspended = true;
    this.uncappedRefresh = false;
    this.wasMoving = false;
    this.cancelScheduledRefresh();
    this.animatedElements.clear();
  }

  public resume(): void {
    if (!this.suspended) return;
    this.suspended = false;
    this.invalidateScene();
    this.refresh(true);
  }

  public destroy(): void {
    if (!this.mounted) {
      return;
    }

    this.mounted = false;
    this.suspended = false;
    this.transparencyQuery?.removeEventListener('change', this.handleTransparencyChange);
    this.transparencyQuery = undefined;
    this.systemSchemeQuery?.removeEventListener('change', this.handleSystemSchemeChange);
    this.systemSchemeQuery = undefined;
    this.ownerDocument?.removeEventListener('scroll', this.handleScroll, true);
    this.ownerDocument?.removeEventListener('toggle', this.handleToggle, true);
    for (const event of motionEvents) {
      this.ownerDocument?.removeEventListener(event, this.handleMotion, true);
    }
    getWindow(this.ownerDocument)?.removeEventListener('scroll', this.handleScroll);
    getWindow(this.ownerDocument)?.removeEventListener('resize', this.handleViewportResize);
    this.deactivate();
    this.topLayer = undefined;
    if (this.ownerDocument !== undefined && activeRenderers.get(this.ownerDocument) === this) {
      activeRenderers.delete(this.ownerDocument);
    }
  }

  private activate(): void {
    if (
      !this.mounted ||
      this.active ||
      this.ownerDocument === undefined ||
      this.ownerDocument.body === null
    ) {
      return;
    }

    // A new GL context has no previous frame to reuse.
    this.invalidateScene();
    this.removeStaleCanvas();
    if (this.transparencyQuery?.matches === true) {
      return;
    }

    const canvas = this.ownerDocument.createElement('canvas');
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

    const gl = this.getContext(canvas);
    if (gl === undefined) {
      return;
    }

    const program = createProgram(gl);
    const buffer = gl.createBuffer();
    if (program === undefined || buffer === null) {
      if (program !== undefined) {
        gl.deleteProgram(program);
      }
      return;
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

    this.canvas = canvas;
    this.gl = gl;
    this.program = program;
    this.locations = locations;
    this.buffer = buffer;
    this.previousRendererAttribute =
      this.ownerDocument.documentElement.getAttribute(glassRendererAttribute);
    this.ownerDocument.documentElement.setAttribute(glassRendererAttribute, 'webgl');
    this.ownerDocument.body.append(canvas);
    const colorProbe = this.ownerDocument.createElement('span');
    colorProbe.setAttribute('aria-hidden', 'true');
    colorProbe.style.position = 'fixed';
    colorProbe.style.width = '0';
    colorProbe.style.height = '0';
    colorProbe.style.overflow = 'hidden';
    colorProbe.style.visibility = 'hidden';
    colorProbe.style.pointerEvents = 'none';
    this.ownerDocument.body.append(colorProbe);
    this.colorProbe = colorProbe;

    canvas.addEventListener('webglcontextlost', this.handleContextLoss);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestore);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadPositions, gl.STATIC_DRAW);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.observe();
    this.active = true;
    // A fresh GL context has no previous frame to reuse; a suspended mount
    // still defers its first paint until resume.
    if (!this.suspended) this.refresh(true);
  }

  private removeStaleCanvas(): void {
    if (this.ownerDocument === undefined) {
      return;
    }

    const staleCanvases = this.ownerDocument.querySelectorAll<HTMLCanvasElement>(
      '[data-neoverse-glass-renderer-canvas], [data-neoverse-glass-chroma-canvas]',
    );
    for (const staleCanvas of staleCanvases) {
      staleCanvas.remove();
    }

    if (
      staleCanvases.length > 0 &&
      this.ownerDocument.documentElement.getAttribute(glassRendererAttribute) === 'webgl'
    ) {
      this.ownerDocument.documentElement.removeAttribute(glassRendererAttribute);
    }
  }

  private cancelScheduledRefresh(): void {
    if (this.animationFrame === undefined) return;

    getWindow(this.ownerDocument)?.cancelAnimationFrame(this.animationFrame);
    this.animationFrame = undefined;
  }

  private ensureChromaCanvas(): void {
    if (this.chromaCanvas || this.chromaUnavailable || !this.canvas || !this.ownerDocument) return;
    const view = getWindow(this.ownerDocument);
    if (
      typeof Path2D !== 'function' ||
      typeof Path2D.prototype.roundRect !== 'function' ||
      !view?.CSS?.supports('mix-blend-mode', 'saturation')
    ) {
      // The geometry signal is only safe to paint when the compositor can
      // interpret it as saturation rather than displaying its source color.
      this.chromaUnavailable = true;
      return;
    }
    const canvas = this.ownerDocument.createElement('canvas');
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
    if (!context || typeof context.roundRect !== 'function') {
      this.chromaUnavailable = true;
      return;
    }
    this.chromaCanvas = canvas;
    this.chromaContext = context;
    this.canvas.before(canvas);
  }

  private syncChromaVisibility(): void {
    const view = getWindow(this.ownerDocument);
    if (!view || !this.canvas || !this.chromaCanvas) return;
    const visibility = view.getComputedStyle(this.canvas).visibility;
    if (this.chromaCanvas.style.visibility !== visibility) {
      this.chromaCanvas.style.visibility = visibility;
    }
  }

  /** Drop cached frame inputs so the next render cannot reuse a stale palette or geometry. */
  private invalidateScene(): void {
    this.colorSignature = 0;
    this.sceneColors = undefined;
    this.sceneSignature = 0;
    this.lastFrameTime = 0;
  }

  /** Keep the palette and frame clock when scrolling or resizing changes geometry. */
  private invalidateFrame(): void {
    this.sceneSignature = 0;
  }

  /** FNV-1a accumulation keeps the frame signature allocation-free on high-refresh displays. */
  private mixSignature(value: number): void {
    this.signatureHash ^= Math.round(value * 100) | 0;
    this.signatureHash = Math.imul(this.signatureHash, 16777619);
  }

  private mixSignatureText(value: string): void {
    for (let index = 0; index < value.length; index += 1) {
      this.signatureHash ^= value.charCodeAt(index);
      this.signatureHash = Math.imul(this.signatureHash, 16777619);
    }
  }

  private disconnectObservers(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.observedGlassElements.clear();
    this.observedTableCells.clear();
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
  }

  private restoreRendererAttribute(): void {
    if (this.ownerDocument === undefined) return;

    if (this.previousRendererAttribute === null) {
      this.ownerDocument.documentElement.removeAttribute(glassRendererAttribute);
    } else {
      this.ownerDocument.documentElement.setAttribute(
        glassRendererAttribute,
        this.previousRendererAttribute,
      );
    }
  }

  private discardLostContext(): void {
    if (this.canvas !== undefined) {
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLoss);
      this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestore);
      this.canvas.remove();
    }
    this.canvas = undefined;
    this.chromaCanvas?.remove();
    this.chromaCanvas = undefined;
    this.chromaContext = undefined;
    this.chromaUnavailable = false;
    this.colorProbe?.remove();
    this.colorProbe = undefined;
    this.gl = undefined;
    this.program = undefined;
    this.locations = undefined;
    this.buffer = undefined;
    this.previousRendererAttribute = null;
    this.contextLost = false;
  }

  private deactivate(): void {
    this.uncappedRefresh = false;
    this.wasMoving = false;
    this.cancelScheduledRefresh();
    this.animatedElements.clear();
    this.disconnectObservers();

    if (this.canvas !== undefined) {
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLoss);
      this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestore);
      this.canvas.remove();
    }

    if (!this.contextLost && this.gl !== undefined && this.program !== undefined) {
      this.gl.deleteProgram(this.program);
    }
    if (!this.contextLost && this.gl !== undefined && this.buffer !== undefined) {
      this.gl.deleteBuffer(this.buffer);
    }

    this.restoreRendererAttribute();

    this.canvas = undefined;
    this.chromaCanvas?.remove();
    this.chromaCanvas = undefined;
    this.chromaContext = undefined;
    this.chromaUnavailable = false;
    this.colorProbe?.remove();
    this.colorProbe = undefined;
    this.gl = undefined;
    this.program = undefined;
    this.locations = undefined;
    this.buffer = undefined;
    this.previousRendererAttribute = null;
    this.contextLost = false;
    this.active = false;
  }

  private getContext(canvas: HTMLCanvasElement): GlassGl | undefined {
    try {
      const webgl2 = canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      });
      if (webgl2 !== null) {
        return webgl2;
      }

      const webgl1 = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      });
      return webgl1 ?? undefined;
    } catch {
      return undefined;
    }
  }

  private observe(): void {
    if (this.ownerDocument === undefined || this.canvas === undefined) return;

    const view = getWindow(this.ownerDocument);
    const ResizeObserverConstructor = view?.ResizeObserver;
    if (ResizeObserverConstructor !== undefined) {
      this.resizeObserver = new ResizeObserverConstructor(this.handleElementResize);
    }

    const MutationObserverConstructor = view?.MutationObserver;
    const documentElement = this.ownerDocument.documentElement;
    if (MutationObserverConstructor !== undefined && documentElement !== null) {
      const mutationObserver = new MutationObserverConstructor(this.handleMutations);
      mutationObserver.observe(documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [...glassMutationAttributes],
      });
      this.mutationObserver = mutationObserver;
    }
  }

  private createMotionContext(): MotionTrackingContext | undefined {
    const view = getWindow(this.ownerDocument);
    if (!this.ownerDocument || !view) return undefined;
    const styleCache = new Map<Element, CSSStyleDeclaration>();
    const topLayerCache = new Map<Element, boolean>();
    const topLayer = this.topLayer ?? createTopLayerHelpers(this.ownerDocument);
    this.topLayer = topLayer;
    const getStyle: StyleGetter = (element) => {
      let cached = styleCache.get(element);
      if (cached === undefined) {
        cached = view.getComputedStyle(element);
        styleCache.set(element, cached);
      }
      return cached;
    };
    return {
      glassSelector,
      occluderSelector,
      getStyle,
      isStrictTopLayerDescendant: (element) =>
        topLayer.isStrictTopLayerDescendant(element, getStyle, topLayerCache),
    };
  }

  private hasLiveDocumentEdgeMotion(): boolean {
    if (!this.ownerDocument?.getAnimations || this.ownerDocument.getAnimations().length === 0) {
      return false;
    }
    const context = this.createMotionContext();
    return context !== undefined && hasAnyDocumentEdgeMotion(this.ownerDocument, context);
  }

  private hasLiveEdgeMotion(): boolean {
    if (
      this.animatedElements.size === 0 &&
      (!this.ownerDocument?.getAnimations || this.ownerDocument.getAnimations().length === 0)
    ) {
      return false;
    }
    if (!this.ownerDocument) return false;
    const context = this.createMotionContext();
    return (
      context !== undefined &&
      hasActiveEdgeMotion(this.ownerDocument, this.animatedElements, context)
    );
  }

  private scheduleRefresh(uncapped = false): void {
    if (!this.active || this.suspended) {
      return;
    }
    if (uncapped) {
      this.uncappedRefresh = true;
    }
    if (this.animationFrame !== undefined) {
      return;
    }

    const view = getWindow(this.ownerDocument);
    if (view?.requestAnimationFrame === undefined) {
      this.uncappedRefresh = false;
      this.refresh();
      return;
    }

    // Reserve the frame slot before calling requestAnimationFrame so test
    // realms with a synchronous RAF shim cannot leave a stale frame id.
    this.animationFrame = -1;
    let completedSynchronously = false;
    const frame = view.requestAnimationFrame((timestamp: number) => {
      completedSynchronously = true;
      this.animationFrame = undefined;
      const immediate = this.uncappedRefresh;
      this.uncappedRefresh = false;
      const movingEdges = this.hasLiveEdgeMotion();
      const elapsed =
        timestamp > 0 && this.lastFrameTime > 0
          ? timestamp - this.lastFrameTime
          : Number.POSITIVE_INFINITY;
      if (!immediate && !movingEdges && !this.wasMoving && elapsed < minFrameIntervalMs) {
        // The cap defers passive scroll/resize frames without dropping them.
        // Active motion and direct scene mutations bypass the cap to stay
        // locked to vsync on high-refresh displays.
        this.scheduleRefresh(false);
        return;
      }
      if (timestamp > 0) this.lastFrameTime = timestamp;
      const forceRender = movingEdges || this.wasMoving;
      this.wasMoving = movingEdges;
      this.render(forceRender);
      if (movingEdges) this.scheduleRefresh(true);
    });
    if (!completedSynchronously) {
      this.animationFrame = frame;
    }
  }

  /** Theme colors change with the root token signature, not on every frame.
   * Caching avoids roughly forty probe style writes and computed-style reads
   * per repaint, and keeps the probe out of the mutation stream. */
  private resolveSceneColors(
    rootStyle: CSSStyleDeclaration,
    view: GlassWindow,
    probe: HTMLElement,
  ): SceneColors {
    this.signatureHash = 2166136261;
    this.mixSignatureText(rootStyle.colorScheme);
    for (const property of colorProperties) {
      this.mixSignatureText(rootStyle.getPropertyValue(property));
    }
    this.mixSignatureText(rootStyle.getPropertyValue('--neoverse-material-edge-refraction-gain'));
    const signature = this.signatureHash || 1;
    const cached = this.sceneColors;
    if (cached !== undefined && this.colorSignature === signature) return cached;
    const gain = Math.max(
      parseFirstNumber(rootStyle.getPropertyValue('--neoverse-material-edge-refraction-gain'), 1),
      0,
    );
    const edgeLight = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-edge-light', '--edge-light']) ??
          'var(--neoverse-color-edge-light)',
        'var(--edge-light)',
      ],
      view,
      probe,
      [1, 1, 1],
    );
    const lightSurface =
      rootStyle.colorScheme === 'light' ? 1 : rootStyle.colorScheme === 'dark' ? 0 : -1;
    // Match the shader's smoothstep(0.55, 0.88, luminance) > 0.5 fallback
    // when a consumer has not declared a color scheme.
    const lightLuminance = edgeLight[0] * 0.2126 + edgeLight[1] * 0.7152 + edgeLight[2] * 0.0722;
    const isLight = lightSurface === 1 || (lightSurface === -1 && lightLuminance > 0.715);
    const primary = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-accent-primary', '--accent-primary']) ??
          'var(--neoverse-color-accent-primary)',
        'var(--accent-primary)',
      ],
      view,
      probe,
      [0.45, 0.73, 0.9],
    );
    const secondary = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, [
          '--neoverse-color-accent-secondary',
          '--accent-secondary',
        ]) ?? 'var(--neoverse-color-accent-secondary)',
        'var(--accent-secondary)',
      ],
      view,
      probe,
      [0.3, 0.85, 0.7],
    );
    const tertiary = resolveColor(
      rootStyle,
      [
        firstPropertyValue(rootStyle, ['--neoverse-color-accent-tertiary', '--accent-tertiary']) ??
          'var(--neoverse-color-accent-tertiary)',
        'var(--accent-tertiary)',
      ],
      view,
      probe,
      [0.48, 0.43, 0.9],
    );
    const colors: SceneColors = {
      gain,
      edgeLight,
      primary,
      secondary,
      tertiary,
      lightSurface,
      isLight,
      colorDodge: view.CSS?.supports('mix-blend-mode', 'color-dodge') === true,
    };
    this.colorSignature = signature;
    this.sceneColors = colors;
    return colors;
  }

  private render(force = false): void {
    if (
      !this.active ||
      this.ownerDocument === undefined ||
      this.canvas === undefined ||
      this.gl === undefined ||
      this.program === undefined ||
      this.locations === undefined ||
      this.buffer === undefined ||
      this.colorProbe === undefined
    ) {
      return;
    }

    const view = getWindow(this.ownerDocument);
    if (view === undefined) {
      return;
    }

    this.isRendering = true;
    try {
      const styleCache = new Map<Element, CSSStyleDeclaration>();
      const getStyle: StyleGetter = (element) => {
        let cached = styleCache.get(element);
        if (cached === undefined) {
          cached = view.getComputedStyle(element);
          styleCache.set(element, cached);
        }
        return cached;
      };
      const topLayerCache = new Map<Element, boolean>();
      const topLayer = this.topLayer ?? createTopLayerHelpers(this.ownerDocument);
      this.topLayer = topLayer;

      const viewport = getCanvasViewport(this.canvas, this.ownerDocument, view);
      // One document-wide query feeds both the edge pass and the occlusion list.
      const candidates = Array.from(
        this.ownerDocument.querySelectorAll<HTMLElement>(
          `${glassSelector}, [data-neoverse-glass-occluder='topmost']`,
        ),
        (element): OcclusionCandidate => ({ element, rect: element.getBoundingClientRect() }),
      );
      const elements = this.getGlassElements(
        candidates.map(({ element }) => element),
        getStyle,
        topLayerCache,
        topLayer,
      );
      if (elements.length === 0 && !this.paintedEdges) return;
      const measuredRects = new Map(candidates.map(({ element, rect }) => [element, rect]));
      const visibleCandidates = candidates
        .filter(({ rect }) => intersectsViewport(rect, viewport))
        .sort((first, second) => first.rect.top - second.rect.top);
      const visualCache = new Map<Element, SurfaceVisualState | null>();
      const matrixCache = new Map<Element, Mat2>();
      const hitTestCache = new Map<string, Element[]>();
      const hitTest = (x: number, y: number): Element[] => {
        const key = `${x},${y}`;
        const cached = hitTestCache.get(key);
        if (cached !== undefined) return cached;
        const stack = this.ownerDocument?.elementsFromPoint?.(x, y) ?? [];
        hitTestCache.set(key, stack);
        return stack;
      };
      const occlusionContext: OcclusionContext = { hitTest, sortedByTop: true };
      const ownerDocument = this.ownerDocument;
      const changedSurfaces = new Set<Element>();
      const surfaceRects = new Map<Element, DOMRect>();
      for (const { element, rect } of candidates) {
        surfaceRects.set(element, rect);
        const previous = this.surfaceRects.get(element);
        if (
          previous === undefined ||
          previous.left !== rect.left ||
          previous.top !== rect.top ||
          previous.width !== rect.width ||
          previous.height !== rect.height
        ) {
          changedSurfaces.add(element);
        }
      }
      this.surfaceRects = surfaceRects;
      const width = viewport.width;
      const height = viewport.height;
      const pixelRatio = resolveDevicePixelRatio(view, this.maxDevicePixelRatio);
      // Skip a full repaint when every input to the edge pass is unchanged. Keep
      // the compositing contract intact: no partial clear, no altered blend mode,
      // just the previous frame retained on the fixed canvas.
      this.signatureHash = 2166136261;
      this.mixSignature(this.mutationRevision);
      this.mixSignature(viewport.left);
      this.mixSignature(viewport.top);
      this.mixSignature(width);
      this.mixSignature(height);
      this.mixSignature(pixelRatio);
      for (const { rect } of candidates) {
        this.mixSignature(rect.left);
        this.mixSignature(rect.top);
        this.mixSignature(rect.width);
        this.mixSignature(rect.height);
      }
      for (const element of elements) {
        this.mixSignatureText(element.className);
        this.mixSignatureText(element.getAttribute?.('style') ?? '');
      }
      const sceneSignature = this.signatureHash || 1;
      if (!force && this.paintedEdges && this.sceneSignature === sceneSignature) return;
      this.sceneSignature = sceneSignature;
      const drawingWidth = Math.max(Math.round(width * pixelRatio), 1);
      const drawingHeight = Math.max(Math.round(height * pixelRatio), 1);
      if (this.canvas.width !== drawingWidth) this.canvas.width = drawingWidth;
      if (this.canvas.height !== drawingHeight) this.canvas.height = drawingHeight;
      const gl = this.gl;
      const locations = this.locations;
      gl.viewport(0, 0, drawingWidth, drawingHeight);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.paintedEdges = elements.length > 0;
      if (!this.paintedEdges) {
        if (this.chromaCanvas) this.chromaCanvas.style.display = 'none';
        this.observeTableCells(new Set());
        return;
      }
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(locations.position);
      gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(locations.viewport, width, height);
      gl.uniform1f(locations.pixelRatio, pixelRatio);

      const rootStyle = getStyle(this.ownerDocument.documentElement);
      const { gain, edgeLight, primary, secondary, tertiary, lightSurface, isLight, colorDodge } =
        this.resolveSceneColors(rootStyle, view, this.colorProbe);
      gl.uniform1f(locations.gain, gain);
      const backdropChroma = isLight || colorDodge;
      const boostLowerRight = isLight && colorDodge;
      if (backdropChroma) this.ensureChromaCanvas();
      if (this.chromaCanvas && this.chromaContext) {
        if (!this.chromaCanvas.isConnected && this.canvas.isConnected) {
          this.canvas.before(this.chromaCanvas);
        }
        const display = backdropChroma ? 'block' : 'none';
        if (this.chromaCanvas.style.display !== display) this.chromaCanvas.style.display = display;
        this.syncChromaVisibility();
        if (backdropChroma) {
          let resized = false;
          if (this.chromaCanvas.width !== drawingWidth) {
            this.chromaCanvas.width = drawingWidth;
            resized = true;
          }
          if (this.chromaCanvas.height !== drawingHeight) {
            this.chromaCanvas.height = drawingHeight;
            resized = true;
          }
          if (!resized) {
            this.chromaContext.resetTransform();
            this.chromaContext.clearRect(0, 0, drawingWidth, drawingHeight);
          }
          this.chromaContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        }
      }
      gl.uniform1f(locations.lightSurface, lightSurface);
      const blendMode = colorDodge ? 'color-dodge' : 'overlay';
      if (this.canvas.style.mixBlendMode !== blendMode) this.canvas.style.mixBlendMode = blendMode;
      gl.uniform1f(locations.colorDodge, colorDodge ? 1 : 0);

      gl.enable(gl.SCISSOR_TEST);
      const occluderRects = this.occluderRects;
      const occluderRadii = this.occluderRadii;
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
        const table = element.matches(tableGlassSelector)
          ? (element as HTMLTableElement)
          : undefined;
        const measuredRect = measuredRects.get(element) ?? element.getBoundingClientRect();
        const rect = table ? getTableOuterRect(table, measuredRect) : measuredRect;
        // Skip surfaces the fixed canvas cannot show before reading their style:
        // a document-wide refresh otherwise resolves computed style and the
        // ancestor opacity chain for every offscreen control.
        if (!intersectsViewport(rect, viewport)) continue;
        const style = readStyle(
          element,
          view,
          this.colorProbe,
          viewport,
          rect,
          getStyle,
          visualCache,
          matrixCache,
          overflowClips,
        );
        if (style === undefined) {
          continue;
        }

        const scissor = getScissorRect(
          style.clipRect,
          viewport,
          pixelRatio,
          drawingWidth,
          drawingHeight,
        );
        if (scissor.width === 0 || scissor.height === 0) {
          continue;
        }

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
        gl.uniform1f(
          locations.cornerFocus,
          isLight ? 0.4 : element.classList.contains('ui-button') ? 1 : 0,
        );
        gl.uniform1f(locations.chroma, style.chroma);
        gl.uniform3f(locations.carrier, ...style.carrier);
        gl.uniform3f(locations.edgeLight, ...edgeLight);
        gl.uniform3f(locations.primary, ...primary);
        gl.uniform3f(locations.secondary, ...secondary);
        gl.uniform3f(locations.tertiary, ...tertiary);
        const occluders = this.collectCachedOccluders(
          element,
          style.rect,
          false,
          changedSurfaces,
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
        if (backdropChroma && this.chromaContext) {
          paintBackdropChroma(
            this.chromaContext,
            style,
            viewport,
            occluders,
            gain,
            boostLowerRight,
          );
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
          this.collectCachedOccluders(element, style.rect, true, changedSurfaces, () =>
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
      this.observeTableCells(visibleTableCells);
    } finally {
      this.isRendering = false;
    }
  }

  private observeTableCells(current: Set<HTMLElement>): void {
    if (!this.resizeObserver) return;
    for (const cell of current) {
      if (this.observedTableCells.has(cell)) continue;
      this.observedTableCells.add(cell);
      if (!this.observedGlassElements.has(cell)) this.resizeObserver.observe(cell);
    }
    for (const cell of this.observedTableCells) {
      if (current.has(cell)) continue;
      if (!this.observedGlassElements.has(cell)) this.resizeObserver.unobserve(cell);
      this.observedTableCells.delete(cell);
    }
  }

  private getGlassElements(
    candidates: readonly HTMLElement[] | undefined,
    getStyle: StyleGetter,
    topLayerCache: Map<Element, boolean>,
    topLayer: TopLayerHelpers,
  ): HTMLElement[] {
    if (this.ownerDocument === undefined) {
      return [];
    }

    const elements =
      candidates ?? Array.from(this.ownerDocument.querySelectorAll<HTMLElement>(glassSelector));
    const currentElements: HTMLElement[] = [];

    for (const element of elements) {
      if (element.closest('[data-neoverse-particle-capture]')) continue;
      if (element.matches(cssEdgePassSelector)) {
        continue;
      }
      if (inheritsParentGlassEdge(element)) {
        continue;
      }
      if (topLayer.isInTopLayer(element, getStyle, topLayerCache)) {
        continue;
      }

      const variant = getVariant(element);
      if (variant === undefined) {
        continue;
      }

      currentElements.push(element);
    }

    if (this.resizeObserver !== undefined) {
      // ResizeObserver fires an initial callback for every observe() call. Re-observing
      // unchanged elements on each render would therefore schedule another render and
      // loop forever, so only subscribe to elements that are not observed yet.
      for (const element of currentElements) {
        if (!this.observedGlassElements.has(element)) {
          this.observedGlassElements.add(element);
          if (!this.observedTableCells.has(element)) this.resizeObserver.observe(element);
        }
      }

      const currentSet = new Set(currentElements);
      for (const element of this.observedGlassElements) {
        if (!currentSet.has(element)) {
          if (!this.observedTableCells.has(element)) this.resizeObserver.unobserve(element);
          this.observedGlassElements.delete(element);
        }
      }
    }

    return currentElements;
  }
}

export const createGlassRenderer = (options: GlassRendererOptions = {}): GlassRenderer => {
  const document = getDocument(options.document);
  if (options.backend === 'native' && document && supportsNativeRefraction(document)) {
    return new NativeGlassRenderer(
      document,
      (element) => !inheritsParentGlassEdge(element),
      (renderer) => {
        const existing = activeRenderers.get(document);
        if (existing && existing !== renderer) return false;
        activeRenderers.set(document, renderer);
        return true;
      },
      (renderer) => {
        if (activeRenderers.get(document) === renderer) activeRenderers.delete(document);
      },
    );
  }
  return new GlassRendererImpl(options);
};
