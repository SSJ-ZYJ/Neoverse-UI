import { resolveEffectiveScale, resolveOverlayViewportLayoutBounds } from './positioning.js';
import type { OverlayPoint } from './types.js';

type MotionSource = HTMLElement | OverlayPoint;
type SourceRect = Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>;
const sources = new WeakMap<HTMLElement, MotionSource>();
const slides = new WeakMap<HTMLElement, Animation>();

function readSource(overlay: HTMLElement, source: MotionSource): SourceRect | undefined {
  if (!('getBoundingClientRect' in source)) {
    return { left: source.x, top: source.y, width: 0, height: 0 };
  }
  const document = overlay.ownerDocument;
  if (
    source.ownerDocument !== document ||
    !source.isConnected ||
    source === document.body ||
    source === document.documentElement ||
    overlay.contains(source)
  ) {
    return;
  }
  const rect = source.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return rect;
}

function clearMotion(overlay: HTMLElement) {
  sources.delete(overlay);
  delete overlay.dataset.neoverseOverlayMotion;
  overlay.style.removeProperty('--neoverse-overlay-motion-translate');
  overlay.style.removeProperty('--neoverse-overlay-motion-scale');
}

function setEndpoint(overlay: HTMLElement, source: SourceRect): boolean {
  const { left, top, right, bottom } = resolveOverlayViewportLayoutBounds(overlay);
  const width = right - left;
  const height = bottom - top;
  if (width <= 0 || height <= 0) return false;
  const zoom = width / overlay.offsetWidth;
  overlay.style.setProperty(
    '--neoverse-overlay-motion-translate',
    `${(source.left - left) / zoom}px ${(source.top - top) / zoom}px`,
  );
  overlay.style.setProperty(
    '--neoverse-overlay-motion-scale',
    `${source.width / width} ${source.height / height}`,
  );
  return true;
}

/** Resample the original source so dismissal returns to its current position. */
export function refreshOverlayExit(overlay: HTMLElement): void {
  const source = sources.get(overlay);
  if (source === undefined) return;
  const rect = readSource(overlay, source);
  if (rect === undefined) clearMotion(overlay);
  else setEndpoint(overlay, rect);
}

function onBeforeToggle(event: Event) {
  if ((event as ToggleEvent).newState === 'closed') {
    refreshOverlayExit(event.currentTarget as HTMLElement);
  }
}

/** Reposition without replaying presence. Retarget an active slide from its painted position. */
export function moveOverlayToPoint(
  overlay: HTMLElement,
  point: OverlayPoint,
  position: () => void,
): void {
  const previous = sources.get(overlay);
  if (
    previous === undefined ||
    'getBoundingClientRect' in previous ||
    (previous.x === point.x && previous.y === point.y)
  ) {
    position();
    return;
  }

  sources.set(overlay, point);
  const style = getComputedStyle(overlay);
  const time = style.getPropertyValue('--neoverse-motion-spatial-duration').trim();
  const duration = Number.parseFloat(time) * (time.endsWith('ms') ? 1 : 1000);
  const animate =
    Number.isFinite(duration) &&
    duration > 1 &&
    typeof overlay.animate === 'function' &&
    !overlay.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const from = animate ? overlay.getBoundingClientRect() : undefined;
  slides.get(overlay)?.cancel();
  slides.delete(overlay);
  position();
  if (from === undefined) return;

  const to = overlay.getBoundingClientRect();
  const zoom = resolveEffectiveScale(overlay);
  const x = (from.left - to.left) / zoom;
  const y = (from.top - to.top) / zoom;
  if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) return;
  slides.set(
    overlay,
    overlay.animate([{ translate: `${x}px ${y}px` }, { translate: '0px 0px' }], {
      composite: 'add',
      duration,
      easing: style.getPropertyValue('--neoverse-motion-spatial-easing').trim() || 'ease-out',
    }),
  );
}

/** Reveal and position the real panel, then start presence from the source rectangle. */
export function openOverlayWithMotion(
  overlay: HTMLElement,
  source: MotionSource | null | undefined,
  reveal: () => void,
  replay = false,
): void {
  slides.get(overlay)?.cancel();
  slides.delete(overlay);
  const rect =
    source != null &&
    overlay.classList.contains('nv-presence') &&
    !overlay.closest('[data-neoverse-motion-fallback="fade-only"]') &&
    !overlay.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ? readSource(overlay, source)
      : undefined;
  if (rect === undefined || source == null) {
    if (sources.has(overlay)) clearMotion(overlay);
    reveal();
    return;
  }

  // A panel still departing already has a rendered frame to reverse from.
  const seed = replay || overlay.getClientRects().length === 0;
  overlay.dataset.neoverseOverlayMotion = seed ? 'prepare' : 'shared';
  reveal();
  if (!setEndpoint(overlay, rect)) {
    clearMotion(overlay);
    return;
  }
  if (seed) {
    // Placement can force style resolution before the endpoint is known. Commit
    // the measured start frame without transitions before releasing it to CSS.
    void getComputedStyle(overlay).scale;
    overlay.dataset.neoverseOverlayMotion = 'shared';
  }
  sources.set(overlay, source);
  overlay.addEventListener('beforetoggle', onBeforeToggle);
}
