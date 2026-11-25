// The terminal keeps a narrow, fixed-width bar while it glides.
function caretOrigin(glyph: HTMLElement): number {
  return glyph.closest?.('.ui-terminal-prompt__caret')?.getBoundingClientRect().left ?? 0;
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

function applyGlide(glyph: HTMLElement, dx: number): void {
  const distance = Math.abs(dx);
  if (distance > 0.5) {
    const limit = glideCap(glyph);
    const duration = Math.round(Math.min(limit, Math.max(shortestGlide, distance * 1.8)));
    glyph.style.transform = `translateX(${dx}px)`;
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
  const renderedLeft = glyph.getBoundingClientRect().left - origin;
  glyph.style.transition = 'none';
  glyph.style.transform = 'none';
  glyph.style.width = '';
  const left = glyph.getBoundingClientRect().left - origin;
  // Inserting or deleting text must not leave the caret trailing the glyphs.
  const edited = lastText.get(glyph) !== text;
  lastText.set(glyph, text);
  const activeOffset = renderedLeft - left;
  const visualPrevious = previousLeft === null ? null : previousLeft + activeOffset;
  const dx = visualPrevious === null || scrolled || edited ? 0 : visualPrevious - left;
  applyGlide(glyph, dx);
  return left;
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
