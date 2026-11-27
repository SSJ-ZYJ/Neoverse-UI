import {
  hasActiveEdgeMotion,
  hasAnyDocumentEdgeMotion,
  type MotionTrackingContext,
  motionWakeEventName,
  shouldTrackMotionEvent,
} from '../motion-tracking.js';
import { occluderSelector } from './occlusion.js';
import { glassSelector } from './style-resolution.js';
import { createStyleGetter, type GlassSurfaceTracker } from './surface-observer.js';

export const glassMotionEvents = [
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

// Cap passive scroll and viewport-resize bursts at roughly 60 fps while keeping
// active motion and element resizes locked to vsync. Using 15 ms avoids 60 Hz
// frame-timestamp jitter dropping to 30 fps.
const minFrameIntervalMs = 15;

export interface FrameSchedulerHost {
  getDocument(): Document | undefined;
  getWindow(): Window | undefined;
  isMounted(): boolean;
  isActive(): boolean;
  isSuspended(): boolean;
  isContextLost(): boolean;
  activateIfNeeded(): boolean;
  render(force: boolean): void;
  refresh(force?: boolean): void;
}

/** Owns coalesced animation-frame scheduling, passive throttling, activation probes and motion tracking. */
export class GlassFrameScheduler {
  private animationFrame: number | undefined;
  private activationProbeQueued = false;
  private uncappedRefresh = false;
  private wasMoving = false;
  private lastFrameTime = 0;
  private readonly animatedElements = new Set<Element>();

  public constructor(
    private readonly host: FrameSchedulerHost,
    private readonly tracker: GlassSurfaceTracker,
  ) {}

  public resetClock(): void {
    this.lastFrameTime = 0;
  }

  public cancel(): void {
    if (this.animationFrame === undefined) return;
    this.host.getWindow()?.cancelAnimationFrame(this.animationFrame);
    this.animationFrame = undefined;
  }

  public clearMotionState(): void {
    this.uncappedRefresh = false;
    this.wasMoving = false;
    this.animatedElements.clear();
  }

  public pause(): void {
    this.cancel();
    this.uncappedRefresh = false;
    this.wasMoving = false;
  }

  public trackMotionEvent(event: Event): void {
    if (!this.host.isActive()) return;
    const target = event.target as Element | null;
    if (
      typeof target?.matches !== 'function' ||
      !shouldTrackMotionEvent(event, target, glassSelector, occluderSelector)
    ) {
      return;
    }
    this.animatedElements.add(target);
    this.scheduleRefresh(true);
  }

  public queueActivationProbe(): void {
    const doc = this.host.getDocument();
    if (
      !this.host.isMounted() ||
      this.host.isActive() ||
      this.host.isSuspended() ||
      this.host.isContextLost() ||
      this.activationProbeQueued ||
      doc?.hidden
    ) {
      return;
    }
    this.activationProbeQueued = true;
    const view = this.host.getWindow();
    const enqueue = view?.queueMicrotask ?? globalThis.queueMicrotask;
    const run = (): void => {
      this.activationProbeQueued = false;
      if (this.host.getDocument()?.hidden) return;
      if (this.host.activateIfNeeded() && !this.host.isSuspended()) {
        this.scheduleRefresh(true);
      }
    };
    if (typeof enqueue === 'function') enqueue(run);
    else view?.setTimeout(run, 0);
  }

  private createMotionContext(): MotionTrackingContext | undefined {
    const doc = this.host.getDocument();
    const view = this.host.getWindow();
    if (!doc || !view) return undefined;
    const getStyle = createStyleGetter(view);
    const topLayerCache = new Map<Element, boolean>();
    const topLayer = this.tracker.getTopLayer(doc);
    return {
      glassSelector,
      occluderSelector,
      getStyle,
      isInTopLayer: (element) => topLayer.isInTopLayer(element, getStyle, topLayerCache),
    };
  }

  public hasLiveDocumentEdgeMotion(): boolean {
    const doc = this.host.getDocument();
    if (!doc?.getAnimations || doc.getAnimations().length === 0) return false;
    const context = this.createMotionContext();
    return context !== undefined && hasAnyDocumentEdgeMotion(doc, context);
  }

  public hasLiveEdgeMotion(): boolean {
    const doc = this.host.getDocument();
    if (
      this.animatedElements.size === 0 &&
      (!doc?.getAnimations || doc.getAnimations().length === 0)
    ) {
      return false;
    }
    if (!doc) return false;
    const context = this.createMotionContext();
    return context !== undefined && hasActiveEdgeMotion(doc, this.animatedElements, context);
  }

  public scheduleRefresh(uncapped = false): void {
    if (!this.host.isActive() || this.host.isSuspended() || this.host.getDocument()?.hidden) {
      return;
    }
    if (uncapped) this.uncappedRefresh = true;
    if (this.animationFrame !== undefined) return;
    const view = this.host.getWindow();
    if (view?.requestAnimationFrame === undefined) {
      this.uncappedRefresh = false;
      this.host.refresh();
      return;
    }
    this.animationFrame = -1;
    let completedSynchronously = false;
    const frame = view.requestAnimationFrame((timestamp: number) => {
      completedSynchronously = true;
      this.animationFrame = undefined;
      if (this.host.getDocument()?.hidden) return;
      const immediate = this.uncappedRefresh;
      this.uncappedRefresh = false;
      const movingEdges = this.hasLiveEdgeMotion();
      const elapsed =
        timestamp > 0 && this.lastFrameTime > 0
          ? timestamp - this.lastFrameTime
          : Number.POSITIVE_INFINITY;
      if (!immediate && !movingEdges && !this.wasMoving && elapsed < minFrameIntervalMs) {
        this.scheduleRefresh(false);
        return;
      }
      if (timestamp > 0) this.lastFrameTime = timestamp;
      const forceRender = movingEdges || this.wasMoving;
      this.wasMoving = movingEdges;
      this.host.render(forceRender);
      if (movingEdges) this.scheduleRefresh(true);
    });
    if (!completedSynchronously) this.animationFrame = frame;
  }
}
