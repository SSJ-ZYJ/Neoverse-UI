import { isOverlayOpen } from './popover-state.js';
import { positionAnchoredOverlay } from './positioning.js';
import type { AnchoredOverlayOptions } from './types.js';

const overlayCleanup = new WeakMap<HTMLElement, () => void>();

export function stopOverlayTracking(overlay: HTMLElement): void {
  overlayCleanup.get(overlay)?.();
  overlayCleanup.delete(overlay);
}

export function startOverlayTracking(options: AnchoredOverlayOptions): void {
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

export function addOverlayCleanup(overlay: HTMLElement, cleanup: () => void): void {
  const previousCleanup = overlayCleanup.get(overlay);
  overlayCleanup.set(overlay, () => {
    previousCleanup?.();
    cleanup();
  });
}
