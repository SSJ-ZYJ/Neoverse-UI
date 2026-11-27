import {
  createTopLayerHelpers,
  type StyleGetter,
  type TopLayerHelpers,
} from '../surface-geometry.js';
import {
  glassMutationAttributes,
  isSceneMutation,
  type SceneMutationContext,
} from './mutation-filter.js';
import type { OcclusionCandidate } from './occlusion.js';
import { mixSignature, mixSignatureText } from './scene-colors.js';
import { canRenderGlassEdge, glassSelector } from './style-resolution.js';
import type { CanvasViewport } from './viewport.js';

const cssEdgePassSelector = '.ui-overlay-panel, [data-neoverse-glass-edge-pass="css"]';

type ObserverWindow = Window & {
  ResizeObserver?: typeof ResizeObserver;
  MutationObserver?: typeof MutationObserver;
};

export const createStyleGetter = (view: Window): StyleGetter => {
  const styleCache = new Map<Element, CSSStyleDeclaration>();
  return (element) => {
    let cached = styleCache.get(element);
    if (cached === undefined) {
      cached = view.getComputedStyle(element);
      styleCache.set(element, cached);
    }
    return cached;
  };
};

export const computeSceneSignature = (
  mutationRevision: number,
  viewport: CanvasViewport,
  pixelRatio: number,
  candidates: readonly OcclusionCandidate[],
  elements: readonly HTMLElement[],
): number => {
  let hash = 2166136261;
  hash = mixSignature(hash, mutationRevision);
  hash = mixSignature(hash, viewport.left);
  hash = mixSignature(hash, viewport.top);
  hash = mixSignature(hash, viewport.width);
  hash = mixSignature(hash, viewport.height);
  hash = mixSignature(hash, pixelRatio);
  for (const { rect } of candidates) {
    hash = mixSignature(hash, rect.left);
    hash = mixSignature(hash, rect.top);
    hash = mixSignature(hash, rect.width);
    hash = mixSignature(hash, rect.height);
  }
  for (const element of elements) {
    hash = mixSignatureText(hash, element.className);
    hash = mixSignatureText(hash, element.getAttribute?.('style') ?? '');
  }
  return hash || 1;
};

/** Owns Glass surface eligibility discovery plus ResizeObserver and MutationObserver tracking. */
export class GlassSurfaceTracker {
  public readonly observedGlassElements = new Set<HTMLElement>();
  private readonly observedTableCells = new Set<HTMLElement>();
  private resizeObserver: ResizeObserver | undefined;
  private mutationObserver: MutationObserver | undefined;
  private topLayer: TopLayerHelpers | undefined;

  public getTopLayer(ownerDocument: Document): TopLayerHelpers {
    const topLayer = this.topLayer ?? createTopLayerHelpers(ownerDocument);
    this.topLayer = topLayer;
    return topLayer;
  }

  public clearTopLayer(): void {
    this.topLayer = undefined;
  }

  public observeMutations(
    ownerDocument: Document | undefined,
    view: ObserverWindow | undefined,
    onMutations: MutationCallback,
  ): void {
    const MutationObserverCtor = view?.MutationObserver;
    if (!ownerDocument?.documentElement || !MutationObserverCtor) return;
    const observer = new MutationObserverCtor(onMutations);
    observer.observe(ownerDocument.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [...glassMutationAttributes],
    });
    this.mutationObserver = observer;
  }

  public disconnectMutations(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
  }

  public observeResizes(view: ObserverWindow | undefined, onResize: ResizeObserverCallback): void {
    const ResizeObserverCtor = view?.ResizeObserver;
    if (ResizeObserverCtor && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserverCtor(onResize);
    }
  }

  public disconnectResizes(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.observedGlassElements.clear();
    this.observedTableCells.clear();
  }

  public hasSceneMutation(
    records: readonly MutationRecord[],
    context: Omit<SceneMutationContext, 'observedGlassElements'>,
  ): boolean {
    const fullContext: SceneMutationContext = {
      ...context,
      observedGlassElements: this.observedGlassElements,
    };
    return records.some((record) => isSceneMutation(record, fullContext));
  }

  public hasEffectiveGlass(ownerDocument: Document, view: Window, active: boolean): boolean {
    const getStyle = createStyleGetter(view);
    const topLayer = this.getTopLayer(ownerDocument);
    const candidates = Array.from(ownerDocument.querySelectorAll<HTMLElement>(glassSelector));
    return this.collectElements(
      ownerDocument,
      candidates,
      getStyle,
      new Map(),
      topLayer,
      active,
    ).some((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }

  public collectElements(
    ownerDocument: Document,
    candidates: readonly HTMLElement[] | undefined,
    getStyle: StyleGetter,
    topLayerCache: Map<Element, boolean>,
    topLayer: TopLayerHelpers,
    active: boolean,
  ): HTMLElement[] {
    const elements =
      candidates ?? Array.from(ownerDocument.querySelectorAll<HTMLElement>(glassSelector));
    const currentElements: HTMLElement[] = [];
    for (const element of elements) {
      if (element.closest('[data-neoverse-particle-capture]')) continue;
      if (element.matches(cssEdgePassSelector)) continue;
      if (!canRenderGlassEdge(element, getStyle)) continue;
      if (topLayer.isInTopLayer(element, getStyle, topLayerCache)) continue;
      currentElements.push(element);
    }
    if (active) {
      for (const element of currentElements) {
        if (!this.observedGlassElements.has(element)) {
          this.observedGlassElements.add(element);
          if (!this.observedTableCells.has(element)) this.resizeObserver?.observe(element);
        }
      }
      const currentSet = new Set(currentElements);
      for (const element of this.observedGlassElements) {
        if (!currentSet.has(element)) {
          if (!this.observedTableCells.has(element)) this.resizeObserver?.unobserve(element);
          this.observedGlassElements.delete(element);
        }
      }
    }
    return currentElements;
  }

  public syncTableCells(current: ReadonlySet<HTMLElement>): void {
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
}
