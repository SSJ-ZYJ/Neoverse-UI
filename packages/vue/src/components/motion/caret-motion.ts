/**
 * Glide the mirrored caret from its previous position to the new one.
 *
 * The bar keeps its width; only its transform travels. Sampling the painted
 * position before clearing the active transform lets rapid arrow repeats and
 * mid-flight reversals continue from the live pixel instead of teleporting,
 * while edited text or scroll jumps start directly at the new slot so the
 * caret never trails the content.
 */
export interface CaretPoint {
  left: number;
  top: number;
}

const holdTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
const lastText = new WeakMap<HTMLElement, string>();
const shortestGlide = 80;

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

function caretOrigin(glyph: HTMLElement): CaretPoint {
  const frame =
    typeof glyph.closest === 'function'
      ? glyph.closest('.ui-input-caret, .ui-textarea-caret, .ui-terminal-prompt__caret')
      : null;
  if (!frame) return { left: 0, top: 0 };
  const rect = frame.getBoundingClientRect();
  return { left: rect.left, top: rect.top };
}

function applyGlide(glyph: HTMLElement, dx: number, dy: number): void {
  const distance = Math.hypot(dx, dy);
  if (distance > 0.5) {
    // A far jump gets more travel time; the token caps how long that may take.
    const limit = glideCap(glyph);
    const duration = Math.round(Math.min(limit, Math.max(shortestGlide, distance * 1.8)));
    // Seed the previous position, commit it, then release the bar back to its
    // resting transform so the browser interpolates the whole travel.
    glyph.style.transform = dy === 0 ? `translateX(${dx}px)` : `translate(${dx}px, ${dy}px)`;
    void glyph.offsetWidth;
    glyph.style.transition = '';
    glyph.style.transitionDuration = `${duration}ms`;
    holdBlink(glyph, duration);
    glyph.style.transform = '';
  } else {
    glyph.style.transition = '';
    glyph.style.transitionDuration = '';
    glyph.style.transform = '';
  }
}

export function slideCaret(
  glyph: HTMLElement | null | undefined,
  previousLeft: number | null,
  text: string,
  scrolled: boolean,
): number | null {
  if (!glyph) return null;
  const origin = caretOrigin(glyph);
  const renderedLeft = glyph.getBoundingClientRect().left - origin.left;
  glyph.style.transition = 'none';
  glyph.style.transform = 'none';
  glyph.style.width = '';
  const left = glyph.getBoundingClientRect().left - origin.left;
  // Inserting or deleting text must not leave the caret trailing the glyphs.
  const edited = lastText.get(glyph) !== text;
  lastText.set(glyph, text);
  const activeOffset = renderedLeft - left;
  const visualPrevious = previousLeft === null ? null : previousLeft + activeOffset;
  const dx = visualPrevious === null || scrolled || edited ? 0 : visualPrevious - left;
  applyGlide(glyph, dx, 0);
  return left;
}

export function slideCaret2d(
  glyph: HTMLElement | null | undefined,
  previous: CaretPoint | null,
  text: string,
  scrolled: boolean,
): CaretPoint | null {
  if (!glyph) return null;
  const origin = caretOrigin(glyph);
  const rendered = glyph.getBoundingClientRect();
  const renderedLeft = rendered.left - origin.left;
  const renderedTop = rendered.top - origin.top;
  glyph.style.transition = 'none';
  glyph.style.transform = 'none';
  glyph.style.width = '';
  const box = glyph.getBoundingClientRect();
  const left = box.left - origin.left;
  const top = box.top - origin.top;
  const edited = lastText.get(glyph) !== text;
  lastText.set(glyph, text);
  const dx =
    previous === null || scrolled || edited ? 0 : previous.left + (renderedLeft - left) - left;
  const dy = previous === null || scrolled || edited ? 0 : previous.top + (renderedTop - top) - top;
  applyGlide(glyph, dx, dy);
  return { left, top };
}

/**
 * Sync the mirrored caret whenever the active text box's native selection or
 * layout size changes (arrow keydown/repeat, Home/End, mouse drag, or resize).
 */
export function watchCaretSelection(
  getControl: () => HTMLInputElement | HTMLTextAreaElement | null | undefined,
  onSync: () => void,
): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const handle = () => {
    const editor = getControl();
    if (editor && document.activeElement === editor) onSync();
  };
  document.addEventListener('selectionchange', handle);
  const editor = getControl();
  const resize =
    editor && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onSync) : undefined;
  if (editor) resize?.observe(editor);
  return () => {
    document.removeEventListener('selectionchange', handle);
    resize?.disconnect();
  };
}

/**
 * Wait until the browser commits a pointer-initiated click caret before
 * mounting the overlay, avoiding a transient flash at index 0.
 */
export function deferPointerFocus(onSync: () => void): () => void {
  if (typeof requestAnimationFrame === 'function') {
    const id = requestAnimationFrame(onSync);
    return () => cancelAnimationFrame(id);
  }
  let canceled = false;
  queueMicrotask(() => {
    if (!canceled) onSync();
  });
  return () => {
    canceled = true;
  };
}
