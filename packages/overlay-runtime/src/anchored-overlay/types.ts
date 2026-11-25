export type OverlayPlacement =
  | 'auto'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'left-start'
  | 'left-end'
  | 'right-start'
  | 'right-end';

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
  /**
   * Element that received focus before a point-anchored overlay opened. Firefox
   * does not move focus out of a manual popover when it closes, so the runtime
   * returns focus itself; this is the fallback when `focusReturn` is unset and
   * `trigger` does not exist.
   */
  previousFocus?: () => HTMLElement | null;
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
