import { parseFirstNumber, parsePixels } from '../surface-geometry.js';

export const occluderSelector = '[data-neoverse-glass-occluder]';
export const maxOccluders = 6;
const occlusionSampleInset = 2;

export type Occluder = {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
  area: number;
  topmost: boolean;
};

export type OcclusionCandidate = {
  element: HTMLElement;
  rect: DOMRect;
  visible?: boolean;
};

export type OcclusionContext = {
  hitTest?: (x: number, y: number) => Element[];
  sortedByTop?: boolean;
};

// The shared edge canvas paints above every overlay, so an edge must be
// masked wherever an overlay covers its surface. Hit-test a small grid of
// points against the real paint order: everything stacked above the surface
// (drawers, popovers, scrims) at any sample point occludes it. Elements with
// pointer-events: none are already excluded from the hit test, which keeps
// the renderer's own canvas and probe out of the results.
export const occlusionSamplePoints = (rect: {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}): Array<[number, number]> => {
  const clampX = (x: number): number =>
    Math.min(Math.max(x, rect.left + occlusionSampleInset), rect.right - occlusionSampleInset);
  const clampY = (y: number): number =>
    Math.min(Math.max(y, rect.top + occlusionSampleInset), rect.bottom - occlusionSampleInset);
  const midX = clampX(rect.left + rect.width / 2);
  const midY = clampY(rect.top + rect.height / 2);
  return [
    [midX, midY],
    [midX, clampY(rect.top)],
    [midX, clampY(rect.bottom)],
    [clampX(rect.left), midY],
    [clampX(rect.right), midY],
  ];
};

const occluderRadius = (element: Element, view: Window, rect: DOMRect): number => {
  const style = view.getComputedStyle(element);
  const rawRadius = Math.max(
    parsePixels(style.borderTopLeftRadius, 0),
    parsePixels(style.borderTopRightRadius, 0),
    parsePixels(style.borderBottomRightRadius, 0),
    parsePixels(style.borderBottomLeftRadius, 0),
  );
  return Math.min(rawRadius, rect.width / 2, rect.height / 2);
};

const intersectionArea = (rect: DOMRect, bounds: DOMRect): number => {
  const width = Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left);
  const height = Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, bounds.top);
  return width > 0 && height > 0 ? width * height : 0;
};

const isVisibleOccluder = (candidate: OcclusionCandidate, view: Window): boolean => {
  if (candidate.visible !== undefined) return candidate.visible;
  for (let node: HTMLElement | null = candidate.element; node !== null; node = node.parentElement) {
    const style = view.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse' ||
      parseFirstNumber(style.opacity, 1) <= 0
    ) {
      candidate.visible = false;
      return false;
    }
  }
  candidate.visible = true;
  return true;
};

export const collectOccluders = (
  element: HTMLElement,
  bounds: DOMRect,
  ownerDocument: Document,
  view: Window,
  candidates: readonly OcclusionCandidate[] = [],
  includeInterior = false,
  context: OcclusionContext = {},
): Occluder[] => {
  if (context.hitTest === undefined && typeof ownerDocument.elementsFromPoint !== 'function') {
    return [];
  }

  // A document-wide refresh can probe the same point for several surfaces.
  // The caller may supply a per-frame cache so WebKit pays for each hit test once.
  const hitTest =
    context.hitTest ??
    ((x: number, y: number): Element[] => ownerDocument.elementsFromPoint?.(x, y) ?? []);

  const occluders = new Map<Element, Occluder>();
  const addOccluder = (entry: Element, rect: DOMRect): void => {
    if (rect.width <= 0 || rect.height <= 0) return;
    occluders.set(entry, {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      radius: occluderRadius(entry, view, rect),
      area: intersectionArea(rect, bounds),
      topmost: entry.getAttribute('data-neoverse-glass-occluder') === 'topmost',
    });
  };
  for (const [x, y] of occlusionSamplePoints(bounds)) {
    const stack = hitTest(x, y);
    const elementIndex = stack.indexOf(element);
    // A missed hit (rounded corner outside its own silhouette) yields no
    // information about what is above; slice(-1) would wrongly treat the
    // whole stack as occluding, so skip the point instead.
    if (elementIndex <= 0) {
      continue;
    }
    for (const entry of stack.slice(0, elementIndex)) {
      if (element.contains(entry) || occluders.has(entry)) {
        continue;
      }
      // Native choice inputs deliberately cover the visible control with
      // opacity: 0 to preserve native hit testing. They do not cover its edge.
      if (!isVisibleOccluder({ element: entry as HTMLElement, rect: bounds }, view)) continue;
      addOccluder(entry, entry.getBoundingClientRect());
    }
    if (occluders.size >= maxOccluders) {
      break;
    }
  }

  // Probe actual overlapping Glass rectangles as well as the fixed samples.
  // This catches small overlays between sample points without a dense per-edge
  // hit-test grid. Rectangles are measured once per frame by the caller.
  for (const candidate of candidates) {
    // Callers that sort candidates by top can stop at the first rectangle below
    // the surface instead of scanning the rest of the document.
    if (context.sortedByTop === true && candidate.rect.top >= bounds.bottom) break;
    const entry = candidate.element;
    const rect = candidate.rect;
    if (
      entry === element ||
      (!includeInterior && element.contains(entry)) ||
      entry.contains(element) ||
      occluders.has(entry)
    )
      continue;

    const left = Math.max(bounds.left, rect.left);
    const right = Math.min(bounds.right, rect.right);
    const top = Math.max(bounds.top, rect.top);
    const bottom = Math.min(bounds.bottom, rect.bottom);
    if (left >= right || top >= bottom) continue;
    const reachesEdge =
      left <= bounds.left + occlusionSampleInset ||
      right >= bounds.right - occlusionSampleInset ||
      top <= bounds.top + occlusionSampleInset ||
      bottom >= bounds.bottom - occlusionSampleInset;
    if (!includeInterior && !reachesEdge) continue;

    // A non-interactive topmost overlay is absent from elementsFromPoint. Its
    // owner may explicitly declare that it sits above ordinary page surfaces.
    if (entry.getAttribute('data-neoverse-glass-occluder') !== 'topmost') {
      const stack = hitTest((left + right) / 2, (top + bottom) / 2);
      const targetIndex = stack.indexOf(element);
      const candidateIndex = stack.findIndex((item) => item === entry || entry.contains(item));
      if (targetIndex < 0 || candidateIndex < 0 || candidateIndex >= targetIndex) continue;
    }
    if (isVisibleOccluder(candidate, view)) addOccluder(entry, rect);
  }

  return [...occluders.values()]
    .sort(
      (first, second) => Number(second.topmost) - Number(first.topmost) || second.area - first.area,
    )
    .slice(0, maxOccluders);
};
