import { NativeGlassRenderer, supportsNativeRefraction } from '../native.js';
import type { GlassRenderer, GlassRendererOptions } from '../types.js';
import { GlassFrameScheduler, glassMotionEvents } from './frame-scheduler.js';
import { glassRendererAttribute, isRelevantScrollTarget } from './mutation-filter.js';
import { maxOccluders, type OcclusionCandidate } from './occlusion.js';
import { OcclusionCache } from './occlusion-cache.js';
import { SceneColorCache } from './scene-colors.js';
import { glassSelector } from './style-resolution.js';
import {
  computeSceneSignature,
  createStyleGetter,
  GlassSurfaceTracker,
} from './surface-observer.js';
import {
  getCanvasViewport,
  intersectsViewport,
  normalizeMaxDevicePixelRatio,
  resolveDevicePixelRatio,
} from './viewport.js';
import {
  createChromaCanvasResources,
  createWebGLPassResources,
  drawGlassSurfacesPass,
  removeStaleGlassCanvases,
  syncChromaCanvasVisibility,
  type WebGLPassResources,
} from './webgl-surface-pass.js';

export { glassRendererAttribute };

const reducedTransparencyQuery = '(prefers-reduced-transparency: reduce)';
const systemDarkQuery = '(prefers-color-scheme: dark)';

type GlassWindow = Window & {
  CSS?: Pick<typeof CSS, 'supports'>;
  ResizeObserver?: typeof ResizeObserver;
  MutationObserver?: typeof MutationObserver;
  Document?: typeof Document;
};

const activeRenderers = new WeakMap<Document, GlassRenderer>();

const getDocument = (candidate?: Document): Document | undefined =>
  candidate ?? (typeof document === 'undefined' ? undefined : document);

const getWindow = (ownerDocument?: Document): GlassWindow | undefined =>
  (ownerDocument?.defaultView as GlassWindow | null | undefined) ?? undefined;

class GlassRendererImpl implements GlassRenderer {
  private readonly ownerDocument: Document | undefined;
  private readonly maxDevicePixelRatio: number;
  private mounted = false;
  private active = false;
  private suspended = false;
  private resources: WebGLPassResources | undefined;
  private chromaCanvas: HTMLCanvasElement | undefined;
  private chromaContext: CanvasRenderingContext2D | undefined;
  private chromaUnavailable = false;
  private transparencyQuery: MediaQueryList | undefined;
  private systemSchemeQuery: MediaQueryList | undefined;
  private paintedEdges = false;
  private contextLost = false;
  private isRendering = false;
  private readonly occluderRects = new Float32Array(maxOccluders * 4);
  private readonly occluderRadii = new Float32Array(maxOccluders);
  private readonly occlusionCache = new OcclusionCache();
  private readonly sceneColorCache = new SceneColorCache();
  private readonly tracker = new GlassSurfaceTracker();
  private readonly scheduler: GlassFrameScheduler;
  private mutationRevision = 0;
  private sceneSignature = 0;
  private previousRendererAttribute: string | null = null;

  public constructor(options: GlassRendererOptions) {
    this.ownerDocument = getDocument(options.document);
    this.maxDevicePixelRatio = normalizeMaxDevicePixelRatio(options.maxDevicePixelRatio);
    this.scheduler = new GlassFrameScheduler(
      {
        getDocument: () => this.ownerDocument,
        getWindow: () => getWindow(this.ownerDocument),
        isMounted: () => this.mounted,
        isActive: () => this.active,
        isSuspended: () => this.suspended,
        isContextLost: () => this.contextLost,
        activateIfNeeded: () => this.activateIfNeeded(),
        render: (force) => this.render(force),
        refresh: (force) => this.refresh(force),
      },
      this.tracker,
    );
  }

  private readonly handleMotion = (event: Event): void => {
    this.scheduler.trackMotionEvent(event);
  };

  private readonly handleViewportResize = (): void => {
    this.sceneSignature = 0;
    if (!this.active) {
      this.scheduler.queueActivationProbe();
      return;
    }
    this.scheduler.scheduleRefresh(false);
  };

  private readonly handleElementResize = (): void => {
    if (!this.active || this.suspended || this.isRendering || this.ownerDocument?.hidden) return;
    this.sceneSignature = 0;
    this.render(false);
    if (this.scheduler.hasLiveEdgeMotion()) this.scheduler.scheduleRefresh(true);
  };

  private readonly handleScroll = (event?: Event): void => {
    if (!isRelevantScrollTarget(event, this.ownerDocument)) return;
    this.sceneSignature = 0;
    this.scheduler.scheduleRefresh(false);
  };

  private readonly handleToggle = (): void => {
    this.invalidateScene();
    if (!this.active) {
      this.scheduler.queueActivationProbe();
      return;
    }
    this.scheduler.scheduleRefresh(true);
  };

  private readonly handleSystemSchemeChange = (): void => {
    this.invalidateScene();
    this.scheduler.scheduleRefresh(true);
  };

  private readonly handleVisibilityChange = (): void => {
    if (!this.mounted) return;
    if (this.ownerDocument?.hidden) {
      this.scheduler.pause();
      return;
    }
    if (this.suspended) return;
    this.sceneSignature = 0;
    if (!this.active) {
      this.scheduler.queueActivationProbe();
      return;
    }
    this.scheduler.scheduleRefresh(true);
  };

  private readonly handleMutations = (records: MutationRecord[]): void => {
    if (records.some((record) => record.target === this.resources?.canvas)) {
      syncChromaCanvasVisibility(
        getWindow(this.ownerDocument),
        this.resources?.canvas,
        this.chromaCanvas,
      );
    }
    if (
      !this.tracker.hasSceneMutation(records, {
        ownerDocument: this.ownerDocument,
        canvas: this.resources?.canvas,
        chromaCanvas: this.chromaCanvas,
        colorProbe: this.resources?.colorProbe,
      })
    ) {
      if (this.active && this.scheduler.hasLiveDocumentEdgeMotion()) {
        this.scheduler.scheduleRefresh(true);
      }
      return;
    }
    this.mutationRevision += 1;
    if (!this.active) {
      this.scheduler.queueActivationProbe();
      return;
    }
    this.scheduler.scheduleRefresh(true);
  };

  private readonly handleTransparencyChange = (event: MediaQueryListEvent): void => {
    if (event.matches) {
      this.releaseOptics();
    } else if (this.mounted && !this.active && !this.contextLost) {
      this.refresh(true);
    }
  };

  private readonly handleContextLoss = (event: Event): void => {
    event.preventDefault();
    if (!this.active) return;
    this.contextLost = true;
    this.scheduler.cancel();
    this.scheduler.clearMotionState();
    this.tracker.disconnectResizes();
    this.tracker.disconnectMutations();
    if (this.resources) this.resources.canvas.style.display = 'none';
    if (this.chromaCanvas) this.chromaCanvas.style.display = 'none';
    this.restoreRendererAttribute();
    this.active = false;
  };

  private readonly handleContextRestore = (): void => {
    if (!this.mounted || !this.contextLost) return;
    this.detachResources(false);
    this.tracker.observeMutations(
      this.ownerDocument,
      getWindow(this.ownerDocument),
      this.handleMutations,
    );
    if (this.transparencyQuery?.matches !== true) this.refresh(true);
  };

  public mount(): void {
    if (this.mounted || !this.ownerDocument?.body) return;
    const existing = activeRenderers.get(this.ownerDocument);
    if (existing !== undefined && existing !== this) return;

    this.mounted = true;
    activeRenderers.set(this.ownerDocument, this);
    const view = getWindow(this.ownerDocument);
    this.transparencyQuery = view?.matchMedia?.(reducedTransparencyQuery);
    this.transparencyQuery?.addEventListener('change', this.handleTransparencyChange);
    this.systemSchemeQuery = view?.matchMedia?.(systemDarkQuery);
    this.systemSchemeQuery?.addEventListener('change', this.handleSystemSchemeChange);
    this.ownerDocument.addEventListener('scroll', this.handleScroll, true);
    this.ownerDocument.addEventListener('toggle', this.handleToggle, true);
    this.ownerDocument.addEventListener('visibilitychange', this.handleVisibilityChange);
    for (const event of glassMotionEvents) {
      this.ownerDocument.addEventListener(event, this.handleMotion, true);
    }
    view?.addEventListener('scroll', this.handleScroll, { passive: true });
    view?.addEventListener('resize', this.handleViewportResize);
    // Observation starts without optics: a page with no eligible Glass surface
    // must not create a canvas, GL context, program or buffer.
    removeStaleGlassCanvases(this.ownerDocument, glassRendererAttribute);
    this.tracker.observeMutations(this.ownerDocument, view, this.handleMutations);
    if (this.suspended) this.activateIfNeeded();
    else this.refresh(true);
  }

  public refresh(force = true): void {
    if (!this.mounted) return;
    if (!this.active && !this.activateIfNeeded()) return;
    if (this.active) this.render(force);
  }

  public suspend(): void {
    if (this.suspended) return;
    this.suspended = true;
    this.scheduler.cancel();
    this.scheduler.clearMotionState();
  }

  public resume(): void {
    if (!this.suspended) return;
    this.suspended = false;
    this.invalidateScene();
    this.refresh(true);
  }

  public destroy(): void {
    if (!this.mounted) return;
    this.mounted = false;
    this.suspended = false;
    this.transparencyQuery?.removeEventListener('change', this.handleTransparencyChange);
    this.transparencyQuery = undefined;
    this.systemSchemeQuery?.removeEventListener('change', this.handleSystemSchemeChange);
    this.systemSchemeQuery = undefined;
    this.ownerDocument?.removeEventListener('scroll', this.handleScroll, true);
    this.ownerDocument?.removeEventListener('toggle', this.handleToggle, true);
    this.ownerDocument?.removeEventListener('visibilitychange', this.handleVisibilityChange);
    for (const event of glassMotionEvents) {
      this.ownerDocument?.removeEventListener(event, this.handleMotion, true);
    }
    getWindow(this.ownerDocument)?.removeEventListener('scroll', this.handleScroll);
    getWindow(this.ownerDocument)?.removeEventListener('resize', this.handleViewportResize);
    this.releaseOptics();
    this.tracker.disconnectMutations();
    this.tracker.clearTopLayer();
    if (this.ownerDocument !== undefined && activeRenderers.get(this.ownerDocument) === this) {
      activeRenderers.delete(this.ownerDocument);
    }
  }

  private activateIfNeeded(): boolean {
    if (!this.mounted || this.active || this.contextLost) return false;
    if (this.transparencyQuery?.matches === true) return false;
    const view = getWindow(this.ownerDocument);
    if (!this.ownerDocument || !view) return false;
    if (!this.tracker.hasEffectiveGlass(this.ownerDocument, view, this.active)) return false;
    return this.activate();
  }

  private activate(): boolean {
    if (!this.mounted || this.active || !this.ownerDocument?.body) return false;
    this.invalidateScene();
    removeStaleGlassCanvases(this.ownerDocument, glassRendererAttribute);
    if (this.transparencyQuery?.matches === true) return false;
    const resources = createWebGLPassResources(this.ownerDocument);
    if (!resources) return false;

    this.resources = resources;
    this.previousRendererAttribute =
      this.ownerDocument.documentElement.getAttribute(glassRendererAttribute);
    this.ownerDocument.documentElement.setAttribute(glassRendererAttribute, 'webgl');
    this.ownerDocument.body.append(resources.canvas, resources.colorProbe);
    resources.canvas.addEventListener('webglcontextlost', this.handleContextLoss);
    resources.canvas.addEventListener('webglcontextrestored', this.handleContextRestore);
    this.tracker.observeResizes(getWindow(this.ownerDocument), this.handleElementResize);
    this.active = true;
    return true;
  }

  private ensureChromaCanvas(): void {
    const view = getWindow(this.ownerDocument);
    if (
      this.chromaCanvas ||
      this.chromaUnavailable ||
      !this.resources ||
      !this.ownerDocument ||
      !view
    ) {
      return;
    }
    const created = createChromaCanvasResources(this.ownerDocument, view, this.resources.canvas);
    if (!created) {
      this.chromaUnavailable = true;
      return;
    }
    this.chromaCanvas = created.canvas;
    this.chromaContext = created.context;
  }

  private invalidateScene(): void {
    this.sceneColorCache.invalidate();
    this.sceneSignature = 0;
    this.scheduler.resetClock();
  }

  private restoreRendererAttribute(): void {
    if (!this.ownerDocument) return;
    if (this.previousRendererAttribute === null) {
      this.ownerDocument.documentElement.removeAttribute(glassRendererAttribute);
    } else {
      this.ownerDocument.documentElement.setAttribute(
        glassRendererAttribute,
        this.previousRendererAttribute,
      );
    }
  }

  private detachResources(deleteGpuObjects: boolean): void {
    if (this.resources) {
      this.resources.canvas.removeEventListener('webglcontextlost', this.handleContextLoss);
      this.resources.canvas.removeEventListener('webglcontextrestored', this.handleContextRestore);
      this.resources.canvas.remove();
      this.resources.colorProbe.remove();
      if (deleteGpuObjects && !this.contextLost) {
        this.resources.gl.deleteProgram(this.resources.program);
        this.resources.gl.deleteBuffer(this.resources.buffer);
      }
      this.resources = undefined;
    }
    this.chromaCanvas?.remove();
    this.chromaCanvas = undefined;
    this.chromaContext = undefined;
    this.chromaUnavailable = false;
    this.previousRendererAttribute = null;
    this.contextLost = false;
  }

  /** Remove every optical resource; structural observation stays installed. */
  private releaseOptics(): void {
    this.scheduler.cancel();
    this.scheduler.clearMotionState();
    this.paintedEdges = false;
    this.tracker.disconnectResizes();
    this.restoreRendererAttribute();
    this.detachResources(true);
    this.active = false;
  }

  private render(force = false): void {
    const view = getWindow(this.ownerDocument);
    if (!this.active || !this.ownerDocument || !this.resources || !view) return;
    this.isRendering = true;
    try {
      const getStyle = createStyleGetter(view);
      const topLayer = this.tracker.getTopLayer(this.ownerDocument);
      const viewport = getCanvasViewport(this.resources.canvas, this.ownerDocument, view);
      const candidates = Array.from(
        this.ownerDocument.querySelectorAll<HTMLElement>(
          `${glassSelector}, [data-neoverse-glass-occluder='topmost']`,
        ),
        (element): OcclusionCandidate => ({ element, rect: element.getBoundingClientRect() }),
      );
      const elements = this.tracker.collectElements(
        this.ownerDocument,
        candidates.map(({ element }) => element),
        getStyle,
        new Map(),
        topLayer,
        this.active,
      );
      if (elements.length === 0) {
        this.releaseOptics();
        return;
      }
      const measuredRects = new Map(candidates.map(({ element, rect }) => [element, rect]));
      const visibleCandidates = candidates
        .filter(({ rect }) => intersectsViewport(rect, viewport))
        .sort((first, second) => first.rect.top - second.rect.top);
      const changedSurfaces = this.occlusionCache.updateSurfaceRects(candidates);
      const pixelRatio = resolveDevicePixelRatio(view, this.maxDevicePixelRatio);
      const sceneSignature = computeSceneSignature(
        this.mutationRevision,
        viewport,
        pixelRatio,
        candidates,
        elements,
      );
      if (!force && this.paintedEdges && this.sceneSignature === sceneSignature) return;
      this.sceneSignature = sceneSignature;

      const drawingWidth = Math.max(Math.round(viewport.width * pixelRatio), 1);
      const drawingHeight = Math.max(Math.round(viewport.height * pixelRatio), 1);
      if (this.resources.canvas.width !== drawingWidth) this.resources.canvas.width = drawingWidth;
      if (this.resources.canvas.height !== drawingHeight) {
        this.resources.canvas.height = drawingHeight;
      }
      const { gl } = this.resources;
      gl.viewport(0, 0, drawingWidth, drawingHeight);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.paintedEdges = true;

      const sceneColors = this.sceneColorCache.resolve(
        getStyle(this.ownerDocument.documentElement),
        view,
        this.resources.colorProbe,
      );
      if (sceneColors.isLight) this.ensureChromaCanvas();
      const visibleTableCells = drawGlassSurfacesPass({
        ownerDocument: this.ownerDocument,
        view,
        resources: this.resources,
        chromaCanvas: this.chromaCanvas,
        chromaContext: this.chromaContext,
        elements,
        measuredRects,
        visibleCandidates,
        changedSurfaces,
        mutationRevision: this.mutationRevision,
        viewport,
        pixelRatio,
        drawingWidth,
        drawingHeight,
        sceneColors,
        getStyle,
        occlusionCache: this.occlusionCache,
        occluderRects: this.occluderRects,
        occluderRadii: this.occluderRadii,
      });
      this.tracker.syncTableCells(visibleTableCells);
    } finally {
      this.isRendering = false;
    }
  }
}

export const createGlassRenderer = (options: GlassRendererOptions = {}): GlassRenderer => {
  const doc = getDocument(options.document);
  if (options.backend === 'native' && doc && supportsNativeRefraction(doc)) {
    return new NativeGlassRenderer(
      doc,
      (renderer) => {
        const existing = activeRenderers.get(doc);
        if (existing && existing !== renderer) return false;
        activeRenderers.set(doc, renderer);
        return true;
      },
      (renderer) => {
        if (activeRenderers.get(doc) === renderer) activeRenderers.delete(doc);
      },
    );
  }
  return new GlassRendererImpl(options);
};
