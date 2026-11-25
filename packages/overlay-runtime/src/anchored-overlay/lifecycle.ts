import { installDismiss } from './light-dismiss.js';
import { supportsPopover } from './popover-state.js';
import { positionAnchoredOverlay } from './positioning.js';
import { addOverlayCleanup, startOverlayTracking, stopOverlayTracking } from './tracking.js';
import type { AnchoredOverlayOptions } from './types.js';

export function showAnchoredOverlay(options: AnchoredOverlayOptions): void {
  if (supportsPopover(options.overlay)) {
    if (!options.overlay.matches(':popover-open')) options.overlay.showPopover();
  } else {
    options.overlay.classList.add(options.fallbackOpenClass);
  }

  positionAnchoredOverlay(options);
  startOverlayTracking(options);

  const stopDismiss = installDismiss(options, hideAnchoredOverlay);
  addOverlayCleanup(options.overlay, stopDismiss);
}

/**
 * A closed manual popover keeps keyboard focus inside itself in Firefox: the
 * engine drops focus on its own schedule, which leaves a menu row focused in a
 * hidden surface. Chromium and WebKit move focus out during `hidePopover()`.
 * A manual overlay is the case where the runtime owns dismissal, so it owns
 * the matching focus release: return focus to the remembered owner, or release
 * it to the document when the menu was opened from a pointer with no owner.
 */
function releaseOverlayFocus(options: AnchoredOverlayOptions): void {
  if (options.manual !== true) return;
  const active = options.overlay.ownerDocument.activeElement;
  // The runtime also runs without a DOM (SSR, tests), so focusability is
  // checked structurally instead of with `instanceof HTMLElement`.
  if (active === null || typeof (active as HTMLElement).focus !== 'function') return;
  const focused = active as HTMLElement;
  const inside = (element: HTMLElement | null | undefined) => element?.contains(focused) === true;
  if (!inside(options.overlay) && !(options.containedElements?.() ?? []).some(inside)) return;
  const target = options.focusReturn ?? options.trigger ?? options.previousFocus?.();
  if (target?.isConnected === true && !options.overlay.contains(target)) {
    target.focus({ preventScroll: true });
    if (!options.overlay.contains(options.overlay.ownerDocument.activeElement)) return;
  }
  focused.blur();
}

export function hideAnchoredOverlay(options: AnchoredOverlayOptions): void {
  if (supportsPopover(options.overlay)) {
    if (options.overlay.matches(':popover-open')) options.overlay.hidePopover();
  } else {
    options.overlay.classList.remove(options.fallbackOpenClass);
  }
  stopOverlayTracking(options.overlay);
  releaseOverlayFocus(options);
}
