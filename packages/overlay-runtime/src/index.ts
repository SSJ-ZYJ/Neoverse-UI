export { hideAnchoredOverlay, showAnchoredOverlay } from './anchored-overlay/lifecycle.js';
export { isOverlayOpen, supportsPopover } from './anchored-overlay/popover-state.js';
export {
  positionAnchoredOverlay,
  resolveAnchoredPosition,
  resolveOverlayViewportLayoutBounds,
} from './anchored-overlay/positioning.js';
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
export { acquireNativeScrollbarHiding } from './scrollbar/scrollbar-owner.js';
