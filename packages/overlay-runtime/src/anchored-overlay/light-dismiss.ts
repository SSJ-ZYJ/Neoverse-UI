import { isOverlayOpen, supportsPopover } from './popover-state.js';
import type { AnchoredOverlayOptions } from './types.js';

export function installDismiss(
  options: AnchoredOverlayOptions,
  hideAnchoredOverlay: (options: AnchoredOverlayOptions) => void,
): () => void {
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
