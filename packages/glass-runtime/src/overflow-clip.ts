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

const hasTransformedAxis = (value: string | undefined): boolean =>
  value !== undefined && value !== '' && value !== 'none';

const isContainingBlockForFixed = (style: CSSStyleDeclaration): boolean => {
  if (
    hasTransformedAxis(style.transform) ||
    hasTransformedAxis(style.translate) ||
    hasTransformedAxis(style.scale) ||
    hasTransformedAxis(style.rotate) ||
    hasTransformedAxis(style.filter) ||
    hasTransformedAxis(style.backdropFilter) ||
    hasTransformedAxis(style.perspective)
  ) {
    return true;
  }
  const willChange = style.willChange;
  if (
    willChange &&
    (willChange.includes('transform') ||
      willChange.includes('filter') ||
      willChange.includes('perspective'))
  ) {
    return true;
  }
  const contain = style.contain;
  return (
    contain !== undefined &&
    (contain.includes('paint') ||
      contain.includes('layout') ||
      contain.includes('strict') ||
      contain.includes('content'))
  );
};

// Sibling surfaces share their ancestors' clip until the next paint. Cache
// the intersection so neither the style reads nor the walk repeat per edge.
const resolveOverflowClip = (
  ancestor: HTMLElement | null,
  getStyle: (element: Element) => CSSStyleDeclaration,
  cache: OverflowClipCache,
): ClipBounds => {
  if (ancestor === null) return unclippedBounds;
  const cached = cache.get(ancestor);
  if (cached !== undefined) return cached;

  const inherited = resolveOverflowClip(ancestor.parentElement, getStyle, cache);
  const style = getStyle(ancestor);
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

const resolveFixedOverflowClip = (
  ancestor: HTMLElement | null,
  getStyle: (element: Element) => CSSStyleDeclaration,
): ClipBounds => {
  let bounds = unclippedBounds;
  for (let current = ancestor; current !== null; current = current.parentElement) {
    const style = getStyle(current);
    const clipX = clipsOverflowAxis(style.overflowX || style.overflow);
    const clipY = clipsOverflowAxis(style.overflowY || style.overflow);
    if ((clipX || clipY) && isContainingBlockForFixed(style)) {
      const rect = current.getBoundingClientRect();
      bounds = {
        left: clipX ? Math.max(bounds.left, rect.left) : bounds.left,
        top: clipY ? Math.max(bounds.top, rect.top) : bounds.top,
        right: clipX ? Math.min(bounds.right, rect.right) : bounds.right,
        bottom: clipY ? Math.min(bounds.bottom, rect.bottom) : bounds.bottom,
      };
    }
    if (isContainingBlockForFixed(style)) {
      // Once inside the fixed containing block, its own ancestors clip normally.
      const inherited = resolveOverflowClip(current.parentElement, getStyle, new Map());
      return {
        left: Math.max(bounds.left, inherited.left),
        top: Math.max(bounds.top, inherited.top),
        right: Math.min(bounds.right, inherited.right),
        bottom: Math.min(bounds.bottom, inherited.bottom),
      };
    }
  }
  return bounds;
};

/** Clip a surface and its tooltip pointer using the current paint's ancestor bounds */
export const clipSurfaceRect = (
  element: HTMLElement,
  rect: ClipBounds,
  pointerHeight: number,
  view: Window,
  cache: OverflowClipCache,
  getStyle: (target: Element) => CSSStyleDeclaration = (target) => view.getComputedStyle(target),
): ClipRect => {
  const isFixed = getStyle(element).position === 'fixed';
  const bounds = isFixed
    ? resolveFixedOverflowClip(element.parentElement, getStyle)
    : resolveOverflowClip(element.parentElement, getStyle, cache);
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
