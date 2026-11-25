export interface ParticleDissolvePreset {
  /** Grid spacing in CSS pixels; smaller = denser dust. */
  density: number;
  /** Particle radius in CSS pixels. */
  size: number;
  /** Travel distance of the plume, in CSS pixels. */
  spread: number;
  /** Vertical pull; negative = the dust rises. */
  gravity: number;
  /** Lateral turbulence amplitude, in CSS pixels. */
  swirl: number;
}

/** The shared choreography: a fine dust layer that follows content edges.
 * The high preset's 1.75px base spacing keeps text silhouettes readable;
 * the shared spacing scale adds breathing room between particles. */
export const particleDissolvePresets = {
  high: {
    density: 1.75,
    gravity: -0.18,
    size: 1.5,
    spread: 180,
    swirl: 28,
  },
  medium: {
    density: 2.25,
    gravity: -0.12,
    size: 1.35,
    spread: 118,
    swirl: 17,
  },
} as const;

/* One shared spacing adjustment keeps capture and synthetic textures at the
   same reduced particle density across every preset and viewport size. */
export const PARTICLE_SPACING_SCALE = 1.8;

export type ParticleDissolvePresetName = keyof typeof particleDissolvePresets;

export type ParticleDissolveMode = 'auto' | 'capture' | 'synthetic';

export interface ParticleDissolveOptions {
  /** Element captured and dissolved. Must be attached to the document. */
  source: HTMLElement;
  preset?: ParticleDissolvePresetName;
  /** Total dissolve duration in milliseconds. Defaults to the particle token. */
  durationMs?: number;
  /**
   * Texture source. `auto` (default) captures the element when the browser
   * implements HTML-in-Canvas and falls back to synthetic dust otherwise;
   * `capture` and `synthetic` force one pipeline (preview and calibration only).
   */
  mode?: ParticleDissolveMode;
}

export interface ParticleDissolveDebugState {
  progress: number;
  drawCalls: number;
  playing: boolean;
  textureReady: boolean;
  destroyed: boolean;
  durationMs: number;
}

export interface ParticleDissolveHandle {
  canvas: HTMLCanvasElement;
  /** Resolves true once the first frame is on screen (safe to swap the DOM). */
  firstFrame: Promise<boolean>;
  /** Resolves true once the dissolve finished playing. */
  settled: Promise<boolean>;
  play: () => void;
  destroy: () => void;
  /** Live state for debugging and tests. */
  debug: () => ParticleDissolveDebugState;
}

export type PaintableCanvas = HTMLCanvasElement & {
  onpaint?: (() => void) | null;
  requestPaint?: () => void;
};

export type ElementImageContext = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, x: number, y: number) => DOMMatrix | undefined;
};

export const CAPTURE_EXCLUDE_SELECTOR =
  'canvas, video, audio, iframe, script, object, embed, .nv-particle-canvas, .nv-particle-source';
