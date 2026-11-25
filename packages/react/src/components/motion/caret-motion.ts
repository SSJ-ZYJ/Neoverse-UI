import { syncCaretFlight } from '@neoverse-ui/motion';
import type * as React from 'react';
import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

// The terminal keeps a narrow, fixed-width bar while it glides.
function caretOrigin(glyph: HTMLElement): number {
  return glyph.closest?.('.ui-terminal-prompt__caret')?.getBoundingClientRect().left ?? 0;
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
  mode: 'form' | 'terminal' = 'form',
  scrollTop = 0,
  width = 0,
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
  const lastScrollLeft = useRef(0);
  const lastScrollTop = useRef(0);
  const lastWidth = useRef(0);
  useCaretLayoutEffect(() => {
    const reset =
      scrollLeft !== lastScrollLeft.current ||
      scrollTop !== lastScrollTop.current ||
      width !== lastWidth.current;
    if (mode === 'terminal') {
      left.current = slideCaret(glyph.current, left.current, text, reset);
    } else {
      syncCaretFlight(glyph.current, text, reset);
    }
    lastScrollLeft.current = scrollLeft;
    lastScrollTop.current = scrollTop;
    lastWidth.current = width;
  }, [active, mode, prefix, scrollLeft, scrollTop, text, width]);
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
    'form',
    caret?.scrollTop ?? 0,
    caret?.width ?? 0,
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
