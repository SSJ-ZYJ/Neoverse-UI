export {
  focusElement,
  installFocusModality,
  isKeyboardModality,
  markPointerModality,
  trapModalTabKey,
} from './anchored-overlay/focus-modality.js';
export { hideAnchoredOverlay, showAnchoredOverlay } from './anchored-overlay/lifecycle.js';
export { isOverlayOpen, supportsPopover } from './anchored-overlay/popover-state.js';
export {
  positionAnchoredOverlay,
  resolveAnchoredPosition,
  resolveOverlayViewportLayoutBounds,
} from './anchored-overlay/positioning.js';
export { openOverlayWithMotion, refreshOverlayExit } from './anchored-overlay/shared-motion.js';
export { stopOverlayTracking } from './anchored-overlay/tracking.js';
export type {
  AnchoredOverlayOptions,
  AnchoredPosition,
  OverlayDismissReason,
  OverlayPlacement,
  OverlayPoint,
  OverlayRect,
  OverlayViewport,
  ResolveAnchoredPositionOptions,
} from './anchored-overlay/types.js';
export { bridgeDialogMaterialScope } from './dialog-material.js';
export { ownsDocumentModalKeyboard } from './document-modal.js';
export { createDrawerController, type DrawerController } from './drawer.js';
export { acquireNativeScrollbarHiding } from './scrollbar/scrollbar-owner.js';
