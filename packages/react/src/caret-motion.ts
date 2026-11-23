import type * as React from 'react';
import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

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

export const useCaretLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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

/** Sync the active text box's selection while focused and glide the mirrored caret before paint. */
export function useCaretMotion(
  control: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  glyph: RefObject<HTMLSpanElement | null>,
  focused: boolean,
  active: boolean,
  prefix: string,
  scrollLeft: number,
  text: string,
  onSync: () => void,
  scrollTop?: number,
) {
  const sync = useRef(onSync);
  sync.current = onSync;
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerFocusing = useRef(false);
  const cancelPointerFocus = useRef<(() => void) | null>(null);
  const clearPointerFocus = () => {
    pointerFocusing.current = false;
    cancelPointerFocus.current?.();
    cancelPointerFocus.current = null;
  };
  useEffect(
    () => () => {
      if (holdTimer.current !== null) clearTimeout(holdTimer.current);
      cancelPointerFocus.current?.();
    },
    [],
  );
  useEffect(() => {
    if (!focused) return;
    return watchCaretSelection(
      () => control.current,
      () => {
        pointerFocusing.current = false;
        cancelPointerFocus.current?.();
        cancelPointerFocus.current = null;
        sync.current();
      },
    );
  }, [focused, control]);
  const left = useRef<number | null>(null);
  const point = useRef<CaretPoint | null>(null);
  const lastScrollLeft = useRef(0);
  const lastScrollTop = useRef(0);
  useCaretLayoutEffect(() => {
    const scrolled =
      scrollLeft !== lastScrollLeft.current ||
      (scrollTop !== undefined && scrollTop !== lastScrollTop.current);
    if (scrollTop !== undefined) {
      point.current = slideCaret2d(glyph.current, point.current, text, scrolled);
      lastScrollTop.current = scrollTop;
    } else {
      left.current = slideCaret(glyph.current, left.current, text, scrolled);
    }
    lastScrollLeft.current = scrollLeft;
  }, [active, prefix, scrollLeft, scrollTop, text]);
  return {
    holding,
    hold: (canHold: boolean) => {
      if (!canHold) return;
      setHolding(true);
      if (holdTimer.current !== null) clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(() => setHolding(false), 600);
    },
    markPointerFocus: () => {
      if (!focused) pointerFocusing.current = true;
    },
    syncOnFocus: () => {
      if (pointerFocusing.current) {
        cancelPointerFocus.current?.();
        cancelPointerFocus.current = deferPointerFocus(() => {
          clearPointerFocus();
          sync.current();
        });
      } else {
        sync.current();
      }
    },
    clearPointerFocus,
  };
}

/** Own multi-line mirrored caret state and 2D glide lifecycle for React UiTextarea. */
export function useTextareaCaret(
  control: RefObject<HTMLTextAreaElement | null>,
  disabled: boolean | undefined,
  readOnly: boolean | undefined,
  handlers: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const glyph = useRef<HTMLSpanElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [composing, setComposing] = useState(false);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [caret, setCaret] = useState<{
    index: number;
    prefix: string;
    suffix: string;
    scrollLeft: number;
    scrollTop: number;
    width: number;
    text: string;
  } | null>(null);
  const showsCaret = focused && !composing && !disabled && !readOnly && caret !== null;
  const sync = () => {
    const node = control.current;
    if (!node) {
      setCaret(null);
      return;
    }
    const start = node.selectionStart;
    const next =
      start !== null && start === node.selectionEnd
        ? {
            index: start,
            prefix: node.value.slice(0, start),
            suffix: node.value.slice(start),
            scrollLeft: node.scrollLeft,
            scrollTop: node.scrollTop,
            width: node.clientWidth,
            text: node.value,
          }
        : null;
    setCaret((previous) =>
      previous?.index === next?.index &&
      previous?.prefix === next?.prefix &&
      previous?.suffix === next?.suffix &&
      previous?.scrollLeft === next?.scrollLeft &&
      previous?.scrollTop === next?.scrollTop &&
      previous?.width === next?.width &&
      previous?.text === next?.text
        ? previous
        : next,
    );
  };
  const hold = () => {
    if (!focused || composing || disabled || readOnly) return;
    setHolding(true);
    if (holdTimer.current !== null) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => setHolding(false), 600);
  };
  useEffect(
    () => () => {
      if (holdTimer.current !== null) clearTimeout(holdTimer.current);
    },
    [],
  );
  const focus = useCaretMotion(
    control,
    glyph,
    focused,
    showsCaret,
    caret?.prefix ?? '',
    caret?.scrollLeft ?? 0,
    caret?.text ?? '',
    sync,
    caret?.scrollTop ?? 0,
  );
  return {
    glyph,
    caret,
    showsCaret,
    holding,
    eventProps: {
      onPointerDown: (event: React.PointerEvent<HTMLTextAreaElement>) => {
        event.currentTarget.dataset.neoverseFocusOrigin = 'pointer';
        focus.markPointerFocus();
        handlers.onPointerDown?.(event);
      },
      onFocus: (event: React.FocusEvent<HTMLTextAreaElement>) => {
        setFocused(true);
        focus.syncOnFocus();
        handlers.onFocus?.(event);
      },
      onBlur: (event: React.FocusEvent<HTMLTextAreaElement>) => {
        delete event.currentTarget.dataset.neoverseFocusOrigin;
        focus.clearPointerFocus();
        setFocused(false);
        setCaret(null);
        handlers.onBlur?.(event);
      },
      onInput: (event: React.InputEvent<HTMLTextAreaElement>) => {
        sync();
        hold();
        handlers.onInput?.(event);
      },
      onSelect: (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
        sync();
        hold();
        handlers.onSelect?.(event);
      },
      onClick: (event: React.MouseEvent<HTMLTextAreaElement>) => {
        sync();
        handlers.onClick?.(event);
      },
      onKeyUp: (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        sync();
        handlers.onKeyUp?.(event);
      },
      onScroll: (event: React.UIEvent<HTMLTextAreaElement>) => {
        sync();
        handlers.onScroll?.(event);
      },
      onCompositionStart: (event: React.CompositionEvent<HTMLTextAreaElement>) => {
        setComposing(true);
        handlers.onCompositionStart?.(event);
      },
      onCompositionEnd: (event: React.CompositionEvent<HTMLTextAreaElement>) => {
        setComposing(false);
        sync();
        handlers.onCompositionEnd?.(event);
      },
    },
  };
}
