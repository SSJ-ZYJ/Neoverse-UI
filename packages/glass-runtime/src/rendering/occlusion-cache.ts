import type { Occluder, OcclusionCandidate } from './occlusion.js';

interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface OcclusionCacheEntry {
  signature: string;
  revision: number;
  outer?: Occluder[];
  interior?: Occluder[];
}

/** Occlusion depends on the surface box, the boxes of the surfaces that can
 * overlap it, and stacking/visibility mutations. Re-probing every point on
 * every animation frame made a Playground refresh cost seconds in WebKit. */
export class OcclusionCache {
  private readonly entries = new WeakMap<HTMLElement, OcclusionCacheEntry>();
  private surfaceRects = new Map<Element, DOMRect>();

  public updateSurfaceRects(candidates: readonly OcclusionCandidate[]): Set<Element> {
    const changedSurfaces = new Set<Element>();
    const nextRects = new Map<Element, DOMRect>();
    for (const { element, rect } of candidates) {
      nextRects.set(element, rect);
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
    this.surfaceRects = nextRects;
    return changedSurfaces;
  }

  private changedOverlaps(
    bounds: Bounds,
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

  public collect(
    element: HTMLElement,
    bounds: Bounds,
    includeInterior: boolean,
    changed: ReadonlySet<Element>,
    revision: number,
    compute: () => Occluder[],
  ): Occluder[] {
    const signature = `${bounds.left}:${bounds.top}:${bounds.width}:${bounds.height}`;
    const cached = this.entries.get(element);
    const valid =
      cached !== undefined && cached.signature === signature && cached.revision === revision;
    const memo = valid ? (includeInterior ? cached.interior : cached.outer) : undefined;
    if (memo !== undefined && !this.changedOverlaps(bounds, changed, element)) return memo;

    const occluders = compute();
    if (valid && cached !== undefined) {
      if (includeInterior) cached.interior = occluders;
      else cached.outer = occluders;
    } else {
      this.entries.set(element, {
        signature,
        revision,
        ...(includeInterior ? { interior: occluders } : { outer: occluders }),
      });
    }
    return occluders;
  }
}
