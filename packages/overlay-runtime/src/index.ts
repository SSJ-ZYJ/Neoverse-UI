export type OverlayPlacement = 'auto' | 'bottom-start' | 'bottom-end';

export type OverlayDismissReason = 'escape' | 'outside';

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
  trigger: HTMLElement;
  overlay: HTMLElement;
  gapVariable: string;
  leftVariable: string;
  topVariable: string;
  inlineSizeVariable?: string;
  matchTriggerWidth?: boolean;
  placement?: OverlayPlacement;
  fallbackOpenClass: string;
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

export function stopOverlayTracking(overlay: HTMLElement): void {
  overlayCleanup.get(overlay)?.();
  overlayCleanup.delete(overlay);
}

export function positionAnchoredOverlay({
  trigger,
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

  const triggerRect = trigger.getBoundingClientRect();
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
    viewport: { width: window.innerWidth, height: window.innerHeight },
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
    const rect = overlay.getBoundingClientRect();
    const deltaX = position.left - rect.left;
    const deltaY = position.top - rect.top;
    if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
      overlay.style.setProperty(leftVariable, `${(position.left + deltaX) / effectiveZoom}px`);
      overlay.style.setProperty(topVariable, `${(position.top + deltaY) / effectiveZoom}px`);
    }
  }
  overlay.dataset.neoverseOverlaySide = position.opensAbove ? 'top' : 'bottom';
}

function startOverlayTracking(options: AnchoredOverlayOptions): void {
  stopOverlayTracking(options.overlay);
  const update = () => positionAnchoredOverlay(options);
  window.addEventListener('resize', update);
  window.addEventListener('scroll', update, true);
  overlayCleanup.set(options.overlay, () => {
    window.removeEventListener('resize', update);
    window.removeEventListener('scroll', update, true);
  });
}

function installDismiss(options: AnchoredOverlayOptions): () => void {
  const onPointerDown = (event: PointerEvent) => {
    if (supportsPopover(options.overlay)) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (options.overlay.contains(target) || options.trigger.contains(target)) return;
    hideAnchoredOverlay(options);
    options.onDismiss?.('outside');
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    if (!isOverlayOpen(options.overlay, options.fallbackOpenClass)) return;
    event.preventDefault();
    hideAnchoredOverlay(options);
    options.trigger.focus();
    options.onDismiss?.('escape');
  };

  if (!supportsPopover(options.overlay)) {
    document.addEventListener('pointerdown', onPointerDown, true);
  }
  document.addEventListener('keydown', onKeydown, true);
  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true);
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
