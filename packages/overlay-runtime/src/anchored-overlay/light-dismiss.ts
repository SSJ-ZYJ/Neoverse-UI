import { focusElement } from './focus-modality.js';
import { isOverlayOpen, supportsPopover } from './popover-state.js';
import type { AnchoredOverlayOptions } from './types.js';

export function installDismiss(
  options: AnchoredOverlayOptions,
  hideAnchoredOverlay: (options: AnchoredOverlayOptions) => void,
): () => void {
  // A cursor-anchored menu has no trigger element; the panel and its caller's
  // region own dismissal, so only the document listeners apply.
  const anchor = options.trigger;
  const cursorMenu = options.manual === true && options.point !== undefined;
  const view = options.overlay.ownerDocument?.defaultView;
  let secondaryPress = false;
  const isInside = (target: Node): boolean => {
    if (options.overlay.contains(target) || anchor?.contains(target) === true) return true;
    for (const element of options.containedElements?.() ?? []) {
      if (element?.contains(target) === true) return true;
    }
    return false;
  };
  const dismissOutside = () => {
    hideAnchoredOverlay(options);
    options.onDismiss?.('outside');
  };
  const onPointerDown = (event: PointerEvent) => {
    // A manual popover is never light-dismissed by the browser, so outside pointer input
    // has to be handled here; an auto popover already does it natively.
    if (supportsPopover(options.overlay) && options.manual !== true) return;
    // Let the target's contextmenu handler claim a secondary click first.
    secondaryPress = cursorMenu && event.button === 2;
    if (secondaryPress) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (isInside(target)) return;
    dismissOutside();
  };
  const endSecondaryPress = () => {
    secondaryPress = false;
  };
  const onContextMenu = (event: Event) => {
    endSecondaryPress();
    if (!event.defaultPrevented && event.target instanceof Node && !isInside(event.target)) {
      dismissOutside();
    }
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
    if (secondaryPress) return;
    if (!isOverlayOpen(options.overlay, options.fallbackOpenClass)) return;
    const next = event.relatedTarget;
    if (!(next instanceof Node)) return;
    if (isInside(next)) return;
    dismissOutside();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    if (!isOverlayOpen(options.overlay, options.fallbackOpenClass)) return;
    event.preventDefault();
    hideAnchoredOverlay(options);
    focusElement(options.focusReturn ?? anchor, { preventScroll: true, modality: 'keyboard' });
    options.onDismiss?.('escape');
  };

  if (!supportsPopover(options.overlay) || options.manual === true) {
    document.addEventListener('pointerdown', onPointerDown, true);
  }
  if (cursorMenu) {
    document.addEventListener('pointerup', endSecondaryPress, true);
    document.addEventListener('pointercancel', endSecondaryPress, true);
    view?.addEventListener('contextmenu', onContextMenu);
  }
  document.addEventListener('focusout', onFocusOut, true);
  document.addEventListener('keydown', onKeydown, true);
  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true);
    if (cursorMenu) {
      document.removeEventListener('pointerup', endSecondaryPress, true);
      document.removeEventListener('pointercancel', endSecondaryPress, true);
      view?.removeEventListener('contextmenu', onContextMenu);
    }
    document.removeEventListener('focusout', onFocusOut, true);
    document.removeEventListener('keydown', onKeydown, true);
  };
}
