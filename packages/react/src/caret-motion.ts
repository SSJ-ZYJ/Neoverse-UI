/**
 * Stretch a mirrored caret across the travelled span, then contract it back
 * into a thin bar to leave an elastic trail.
 */
const holdTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
const lastText = new WeakMap<HTMLElement, string>();
const shortestGlide = 110;

function holdBlink(glyph: HTMLElement, duration: number): void {
  const pending = holdTimers.get(glyph);
  if (pending !== undefined) clearTimeout(pending);
  glyph.style.animationName = 'none';
  holdTimers.set(
    glyph,
    setTimeout(() => {
      glyph.style.animationName = '';
      holdTimers.delete(glyph);
    }, duration + 60),
  );
}

function glideCap(glyph: HTMLElement): number {
  const raw = getComputedStyle(glyph)
    .getPropertyValue('--neoverse-motion-caret-glide-duration')
    .trim();
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 320;
  return raw.endsWith('ms') ? parsed : parsed * 1000;
}

export function slideCaret(
  glyph: HTMLElement | null | undefined,
  previousLeft: number | null,
  text: string,
  scrolled: boolean,
): number | null {
  if (!glyph) return null;
  glyph.style.transition = 'none';
  glyph.style.transform = 'none';
  glyph.style.width = '';
  const box = glyph.getBoundingClientRect();
  const left = box.left;
  const bar = box.width;
  // Inserting or deleting text must not leave the caret trailing the glyphs.
  const edited = lastText.get(glyph) !== text;
  lastText.set(glyph, text);
  const delta = previousLeft === null || scrolled || edited ? 0 : previousLeft - left;
  const distance = Math.abs(delta);
  if (distance > 0.5) {
    // A far jump gets more travel time; the token caps how long that may take.
    const limit = glideCap(glyph);
    const duration = Math.round(Math.min(limit, Math.max(shortestGlide, distance * 1.8)));
    // Start from the union of the old and new spans, then collapse to the bar.
    glyph.style.width = `${distance + bar}px`;
    glyph.style.transform = delta < 0 ? `translateX(${delta}px)` : 'none';
    void glyph.offsetWidth;
    glyph.style.transition = '';
    glyph.style.transitionDuration = `${duration}ms`;
    holdBlink(glyph, duration);
  } else {
    glyph.style.transition = '';
    glyph.style.transitionDuration = '';
  }
  glyph.style.width = '';
  glyph.style.transform = '';
  return left;
}
