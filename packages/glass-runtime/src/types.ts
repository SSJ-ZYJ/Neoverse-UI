export interface GlassRendererOptions {
  /**
   * `native` opts into SVG displacement where supported; every other value
   * renders with WebGL. `'webgl'` therefore selects the same path as `'auto'`
   * — it is kept as an explicit, self-documenting alias rather than a
   * separate engine, so do not read it as a forced-or-fallback switch.
   */
  backend?: 'auto' | 'webgl' | 'native';
  document?: Document;
  maxDevicePixelRatio?: number;
}

export interface GlassRenderer {
  mount(): void;
  /** Force a repaint by default; pass false to let the frame cache deduplicate. */
  refresh(force?: boolean): void;
  /** Defer automatic edge repaints and retain the last painted frame until `resume`.
   * Only position/opacity transitions may run while suspended; size, stacking and
   * top-layer changes need `refresh` or `resume`. Explicit `refresh` still paints. */
  suspend(): void;
  /** End the suspension and repaint the full scene once against the settled DOM. */
  resume(): void;
  destroy(): void;
}

export type { Color as GlassRendererColor } from './style-colors.js';
