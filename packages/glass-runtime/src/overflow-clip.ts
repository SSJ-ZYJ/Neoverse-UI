type ClipBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type ClipRect = ClipBounds & {
  width: number;
  height: number;
};

export type OverflowClipCache = Map<HTMLElement, ClipBounds>;

const unclippedBounds: ClipBounds = {
  left: -Infinity,
  top: -Infinity,
  right: Infinity,
  bottom: Infinity,
};

const clipsOverflowAxis = (value: string): boolean =>
  value === 'auto' || value === 'clip' || value === 'hidden' || value === 'scroll';

// Sibling surfaces share their ancestors' clip until the next paint. Cache
// the intersection so neither the style reads nor the walk repeat per edge.
const resolveOverflowClip = (
  ancestor: HTMLElement | null,
  view: Window,
  cache: OverflowClipCache,
): ClipBounds => {
  if (ancestor === null) return unclippedBounds;
  const cached = cache.get(ancestor);
  if (cached !== undefined) return cached;

  const inherited = resolveOverflowClip(ancestor.parentElement, view, cache);
  const style = view.getComputedStyle(ancestor);
  const clipX = clipsOverflowAxis(style.overflowX || style.overflow);
  const clipY = clipsOverflowAxis(style.overflowY || style.overflow);
  let bounds = inherited;
  if (clipX || clipY) {
    const rect = ancestor.getBoundingClientRect();
    bounds = {
      left: clipX ? Math.max(inherited.left, rect.left) : inherited.left,
      top: clipY ? Math.max(inherited.top, rect.top) : inherited.top,
      right: clipX ? Math.min(inherited.right, rect.right) : inherited.right,
      bottom: clipY ? Math.min(inherited.bottom, rect.bottom) : inherited.bottom,
    };
  }
  cache.set(ancestor, bounds);
  return bounds;
};

/** Clip a surface and its tooltip pointer using the current paint's ancestor bounds */
export const clipSurfaceRect = (
  element: HTMLElement,
  rect: ClipBounds,
  pointerHeight: number,
  view: Window,
  cache: OverflowClipCache,
): ClipRect => {
  const bounds = resolveOverflowClip(element.parentElement, view, cache);
  const left = Math.max(rect.left, bounds.left);
  const top = Math.max(rect.top, bounds.top);
  const right = Math.min(rect.right, bounds.right);
  const bottom = Math.min(rect.bottom + pointerHeight, bounds.bottom);

  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(right - left, 0),
    height: Math.max(bottom - top, 0),
  };
};
