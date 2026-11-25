import { isOverlayOpen, supportsPopover } from './popover-state.js';
import type {
  AnchoredOverlayOptions,
  AnchoredPosition,
  ResolveAnchoredPositionOptions,
} from './types.js';

export function resolveAnchoredPosition({
  trigger,
  overlayWidth,
  overlayHeight,
  viewport,
  gap,
  placement = 'auto',
}: ResolveAnchoredPositionOptions): AnchoredPosition {
  const normalizedGap = Math.max(0, gap);
  const maxLeft = Math.max(normalizedGap, viewport.width - overlayWidth - normalizedGap);
  const preferredLeft = placement === 'bottom-end' ? trigger.right - overlayWidth : trigger.left;
  const left = Math.min(Math.max(preferredLeft, normalizedGap), maxLeft);

  const spaceBelow = viewport.height - trigger.bottom - normalizedGap;
  const spaceAbove = trigger.top - normalizedGap;
  const opensAbove =
    placement === 'auto' && overlayHeight > spaceBelow && spaceAbove >= overlayHeight;
  const unclampedTop = opensAbove
    ? trigger.top - overlayHeight - normalizedGap
    : trigger.bottom + normalizedGap;
  const maxTop = Math.max(normalizedGap, viewport.height - overlayHeight - normalizedGap);
  const top = Math.min(Math.max(unclampedTop, normalizedGap), maxTop);

  return { left, top, opensAbove };
}

function resolveCssLength(element: HTMLElement, value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;

  const normalized = value.trim().toLowerCase();
  if (normalized.endsWith('rem')) {
    return parsed * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  if (normalized.endsWith('em')) {
    return parsed * Number.parseFloat(getComputedStyle(element).fontSize);
  }
  return parsed;
}

/**
 * Rendered scale from CSS `zoom` and ancestor `scale` transforms. A visual zoom
 * on a preview keeps layout at 100%, so only the painted size changes; a
 * fallback panel positioned in that subtree must convert the same way. The
 * element's own `scale` is its entrance motion and stays out of the conversion:
 * its left/top are resolved before that transform applies.
 */
function resolveEffectiveScale(element: HTMLElement): number {
  let scale = 1;
  const ownZoom = Number.parseFloat(getComputedStyle(element).zoom);
  if (Number.isFinite(ownZoom) && ownZoom > 0) scale *= ownZoom;
  let node: HTMLElement | null = element.parentElement;
  while (node !== null) {
    const style = getComputedStyle(node);
    const zoom = Number.parseFloat(style.zoom);
    if (Number.isFinite(zoom) && zoom > 0) scale *= zoom;
    // `scale` takes one or two values; the uniform factor is the first.
    const factor = Number.parseFloat((style.scale || '1').split(/\s+/)[0] ?? '1');
    if (Number.isFinite(factor) && factor > 0) scale *= factor;
    node = node.parentElement;
  }
  return scale;
}

// `window.innerWidth` follows the scrollable overflow of the document, so a
// panel that overflows the right edge widens the value that is supposed to
// clamp it (mobile emulation, or any layout viewport that is allowed to
// expand). The root element's client box is the nominal layout viewport and
// keeps fixed-position coordinates and their clamps in the same space.
function resolveLayoutViewportSize(): { width: number; height: number } {
  const root = document.documentElement;
  return {
    width: Math.min(window.innerWidth, root.clientWidth || window.innerWidth),
    height: Math.min(window.innerHeight, root.clientHeight || window.innerHeight),
  };
}

function resolveMotionOffset(element: HTMLElement, style: CSSStyleDeclaration) {
  const scales = (style.scale || 'none').split(/\s+/);
  const scale = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) ? parsed / (value?.endsWith('%') ? 100 : 1) : fallback;
  };
  const scaleX = scale(scales[0], 1);
  const scaleY = scale(scales[1], scaleX);
  const length = (value: string | undefined, size: number) =>
    value?.endsWith('%')
      ? (Number.parseFloat(value) * size) / 100
      : resolveCssLength(element, value ?? '0');
  const origins = style.transformOrigin.split(/\s+/);
  const translations = (style.translate || 'none').split(/\s+/);
  return {
    x:
      length(origins[0], element.offsetWidth) * (1 - scaleX) +
      length(translations[0], element.offsetWidth),
    y:
      length(origins[1], element.offsetHeight) * (1 - scaleY) +
      length(translations[1], element.offsetHeight),
  };
}

/**
 * The CSS left/top of a fallback panel can be relative to a transformed ancestor.
 * A submenu teleported to the document body instead needs viewport coordinates.
 * Exclude the panel's own presence motion so the layout bounds stay stable during entry.
 */
export function resolveOverlayViewportLayoutBounds(element: HTMLElement): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const style = getComputedStyle(element);
  const zoom = resolveEffectiveScale(element);
  const rect = element.getBoundingClientRect();
  const motion = resolveMotionOffset(element, style);
  const left = rect.left - motion.x * zoom;
  const top = rect.top - motion.y * zoom;
  return {
    left,
    right: left + element.offsetWidth * zoom,
    top,
    bottom: top + element.offsetHeight * zoom,
  };
}

export function positionAnchoredOverlay({
  trigger,
  point,
  overlay,
  gapVariable,
  leftVariable,
  topVariable,
  inlineSizeVariable,
  matchTriggerWidth = false,
  placement = 'auto',
  fallbackOpenClass,
}: AnchoredOverlayOptions): void {
  if (!isOverlayOpen(overlay, fallbackOpenClass)) return;

  // A cursor anchor is a zero-size rect: the panel opens from the pointer and
  // reuses the same flip, clamp and zoom compensation as an element trigger.
  const triggerRect =
    trigger === undefined
      ? {
          top: point?.y ?? 0,
          bottom: point?.y ?? 0,
          left: point?.x ?? 0,
          right: point?.x ?? 0,
          width: 0,
          height: 0,
        }
      : trigger.getBoundingClientRect();
  const overlayStyle = getComputedStyle(overlay);
  const effectiveZoom = resolveEffectiveScale(overlay);
  const gap =
    Math.max(0, resolveCssLength(overlay, overlayStyle.getPropertyValue(gapVariable))) *
    effectiveZoom;

  if (matchTriggerWidth && inlineSizeVariable !== undefined) {
    overlay.style.setProperty(inlineSizeVariable, `${triggerRect.width / effectiveZoom}px`);
  }

  // Layout dimensions do not include CSS zoom, unlike the viewport and trigger rect.
  const overlayWidth = overlay.offsetWidth * effectiveZoom;
  const overlayHeight = overlay.offsetHeight * effectiveZoom;
  const position = resolveAnchoredPosition({
    trigger: triggerRect,
    overlayWidth,
    overlayHeight,
    viewport: resolveLayoutViewportSize(),
    gap,
    placement,
  });

  overlay.style.setProperty(leftVariable, `${position.left / effectiveZoom}px`);
  overlay.style.setProperty(topVariable, `${position.top / effectiveZoom}px`);

  // A filtered/transformed ancestor establishes a containing block for fixed
  // fallback overlays. Correct from the *rendered* viewport rect rather than
  // assuming that fixed CSS coordinates are viewport-relative. Native popovers
  // in the top layer need no adjustment.
  if (!supportsPopover(overlay)) {
    // A panel without a layout box reports an all-zero rect, which would turn
    // the correction into a duplicate offset instead of a containing-block fix.
    if (overlay.offsetWidth > 0 || overlay.offsetHeight > 0) {
      const rect = overlay.getBoundingClientRect();
      // The panel's own presence scale/translate is intentional entrance motion,
      // not a containing-block offset. Exclude it or the initial correction leaves
      // a permanent drift after the animation reaches its resting geometry.
      const motion = resolveMotionOffset(overlay, overlayStyle);
      const deltaX = position.left - (rect.left - motion.x * effectiveZoom);
      const deltaY = position.top - (rect.top - motion.y * effectiveZoom);
      if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
        overlay.style.setProperty(leftVariable, `${(position.left + deltaX) / effectiveZoom}px`);
        overlay.style.setProperty(topVariable, `${(position.top + deltaY) / effectiveZoom}px`);
      }
    }
  }
  overlay.dataset.neoverseOverlaySide = position.opensAbove ? 'top' : 'bottom';
}
