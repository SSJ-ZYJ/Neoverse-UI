export type OverlayPlacement = 'auto' | 'bottom-start' | 'bottom-end';

export type OverlayDismissReason = 'escape' | 'outside' | 'scroll';

/** Viewport pointer anchor for menus opened at a cursor position. */
export interface OverlayPoint {
  x: number;
  y: number;
}

export interface OverlayRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

export interface OverlayViewport {
  width: number;
  height: number;
}

export interface ResolveAnchoredPositionOptions {
  trigger: OverlayRect;
  overlayWidth: number;
  overlayHeight: number;
  viewport: OverlayViewport;
  gap: number;
  placement?: OverlayPlacement;
}

export interface AnchoredPosition {
  left: number;
  top: number;
  opensAbove: boolean;
}

export interface AnchoredOverlayOptions {
  /** Element the overlay is positioned against; omitted for point-anchored menus. */
  trigger?: HTMLElement;
  /** Viewport coordinates for cursor-anchored menus; mutually exclusive with `trigger`. */
  point?: OverlayPoint;
  /** Element that receives focus when the overlay closes; defaults to `trigger`. */
  focusReturn?: HTMLElement;
  overlay: HTMLElement;
  gapVariable: string;
  leftVariable: string;
  topVariable: string;
  inlineSizeVariable?: string;
  matchTriggerWidth?: boolean;
  placement?: OverlayPlacement;
  fallbackOpenClass: string;
  /**
   * The overlay is a manual popover, so the browser does not light-dismiss it and the
   * runtime owns outside dismissal instead. Needed when the overlay owns a nested popover
   * (a submenu) that must not count as an outside click.
   */
  manual?: boolean;
  /** Extra elements that count as inside the overlay for dismissal and focus guards. */
  containedElements?: () => Array<HTMLElement | null | undefined>;
  onDismiss?: (reason: OverlayDismissReason) => void;
}

const overlayCleanup = new WeakMap<HTMLElement, () => void>();

export function supportsPopover(element: HTMLElement): boolean {
  return typeof element.showPopover === 'function' && typeof element.hidePopover === 'function';
}

export function isOverlayOpen(element: HTMLElement, fallbackOpenClass: string): boolean {
  if (!supportsPopover(element)) return element.classList.contains(fallbackOpenClass);
  return element.matches(':popover-open');
}

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

function resolveEffectiveZoom(element: HTMLElement): number {
  let zoom = 1;
  let node: HTMLElement | null = element;
  while (node !== null) {
    const value = Number.parseFloat(getComputedStyle(node).zoom);
    if (Number.isFinite(value) && value > 0) zoom *= value;
    node = node.parentElement;
  }
  return zoom;
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
  const zoom = resolveEffectiveZoom(element);
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

export function stopOverlayTracking(overlay: HTMLElement): void {
  overlayCleanup.get(overlay)?.();
  overlayCleanup.delete(overlay);
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
  const effectiveZoom = resolveEffectiveZoom(overlay);
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

function startOverlayTracking(options: AnchoredOverlayOptions): void {
  stopOverlayTracking(options.overlay);
  const update = () => positionAnchoredOverlay(options);
  // A point anchor does not move with the layout, so only the panel's own
  // geometry is sampled; an element trigger also contributes its rect.
  const readGeometry = () => {
    const rect = options.trigger?.getBoundingClientRect();
    return [
      rect?.left ?? options.point?.x ?? 0,
      rect?.top ?? options.point?.y ?? 0,
      rect?.width ?? 0,
      rect?.height ?? 0,
      options.overlay.offsetWidth,
      options.overlay.offsetHeight,
    ];
  };
  let previous = readGeometry();
  let frame = 0;
  // Scroll/resize events do not cover async content or an ancestor's layout /
  // transform changes. Sample only while open and write only on geometry changes.
  const track = () => {
    if (
      options.trigger?.isConnected === false ||
      !options.overlay.isConnected ||
      !isOverlayOpen(options.overlay, options.fallbackOpenClass)
    ) {
      stopOverlayTracking(options.overlay);
      return;
    }
    const next = readGeometry();
    if (next.some((value, index) => value !== previous[index])) {
      previous = next;
      update();
    }
    frame = requestAnimationFrame(track);
  };
  frame = requestAnimationFrame(track);
  window.addEventListener('resize', update);
  window.addEventListener('scroll', update, true);
  overlayCleanup.set(options.overlay, () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', update);
    window.removeEventListener('scroll', update, true);
  });
}

function installDismiss(options: AnchoredOverlayOptions): () => void {
  // A cursor-anchored menu has no trigger element; the panel and its caller's
  // region own dismissal, so only the document listeners apply.
  const anchor = options.trigger;
  const isInside = (target: Node): boolean => {
    if (options.overlay.contains(target) || anchor?.contains(target) === true) return true;
    for (const element of options.containedElements?.() ?? []) {
      if (element?.contains(target) === true) return true;
    }
    return false;
  };
  const onPointerDown = (event: PointerEvent) => {
    // A manual popover is never light-dismissed by the browser, so outside pointer input
    // has to be handled here; an auto popover already does it natively.
    if (supportsPopover(options.overlay) && options.manual !== true) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (isInside(target)) return;
    hideAnchoredOverlay(options);
    options.onDismiss?.('outside');
  };

  // Native popovers dismiss on light-dismiss interactions (outside pointer
  // input, Escape) but Chromium keeps an open popover when keyboard focus
  // walks out of the panel. The fallback path has no dismissal at all. Both
  // modes need this focusout handler to satisfy the APG menu/listbox pattern.
  //
  // Only a focus change that lands on another element counts: pointer-driven
  // dismissal already ran through onPointerDown/was accepted by the parent,
  // and re-firing here would double-count a single dismiss request.
  const onFocusOut = (event: FocusEvent) => {
    if (!isOverlayOpen(options.overlay, options.fallbackOpenClass)) return;
    const next = event.relatedTarget;
    if (!(next instanceof Node)) return;
    if (isInside(next)) return;
    hideAnchoredOverlay(options);
    options.onDismiss?.('outside');
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    if (!isOverlayOpen(options.overlay, options.fallbackOpenClass)) return;
    event.preventDefault();
    hideAnchoredOverlay(options);
    (options.focusReturn ?? anchor)?.focus();
    options.onDismiss?.('escape');
  };

  if (!supportsPopover(options.overlay) || options.manual === true) {
    document.addEventListener('pointerdown', onPointerDown, true);
  }
  document.addEventListener('focusout', onFocusOut, true);
  document.addEventListener('keydown', onKeydown, true);
  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('focusout', onFocusOut, true);
    document.removeEventListener('keydown', onKeydown, true);
  };
}

export function showAnchoredOverlay(options: AnchoredOverlayOptions): void {
  if (supportsPopover(options.overlay)) {
    if (!options.overlay.matches(':popover-open')) options.overlay.showPopover();
  } else {
    options.overlay.classList.add(options.fallbackOpenClass);
  }

  positionAnchoredOverlay(options);
  startOverlayTracking(options);

  const stopDismiss = installDismiss(options);
  const previousCleanup = overlayCleanup.get(options.overlay);
  overlayCleanup.set(options.overlay, () => {
    previousCleanup?.();
    stopDismiss();
  });
}

export function hideAnchoredOverlay(options: AnchoredOverlayOptions): void {
  if (supportsPopover(options.overlay)) {
    if (options.overlay.matches(':popover-open')) options.overlay.hidePopover();
  } else {
    options.overlay.classList.remove(options.fallbackOpenClass);
  }
  stopOverlayTracking(options.overlay);
}

// Shared document-level owner used by UiScrollbar in both adapters.
export { acquireNativeScrollbarHiding } from './scrollbar-owner';
