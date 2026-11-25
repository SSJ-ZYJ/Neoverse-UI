import { type ComponentPropsWithRef, useEffect, useRef, useState } from 'react';
import { useCaretMotion } from '../caret-motion.js';
import { mergeClassNames, resolveAriaInvalid } from '../internal.js';
import type { FormControlValidation } from './shared.js';

export interface UiInputProps extends ComponentPropsWithRef<'input'> {
  validation?: FormControlValidation;
  incrementLabel?: string;
  decrementLabel?: string;
}

function stepNumberInput(input: HTMLInputElement | null, direction: number) {
  if (!input || input.disabled || input.readOnly) return;
  const previous = input.value;
  if (input.step === 'any') {
    const next = Number(((input.valueAsNumber || 0) + direction).toPrecision(12));
    input.valueAsNumber = Math.min(
      input.max === '' ? Infinity : Number(input.max),
      Math.max(input.min === '' ? -Infinity : Number(input.min), next),
    );
  } else if (direction > 0) {
    input.stepUp();
  } else {
    input.stepDown();
  }
  input.dataset.neoverseFocusOrigin = 'pointer';
  input.focus({ preventScroll: true });
  if (input.value !== previous) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

export function UiInput({
  validation = 'none',
  incrementLabel = 'Increase value',
  decrementLabel = 'Decrease value',
  className,
  ref: forwardedRef,
  onPointerDown,
  onFocus,
  onInput,
  onSelect,
  onClick,
  onKeyUp,
  onScroll,
  onCompositionStart,
  onCompositionEnd,
  onBlur,
  'aria-invalid': ariaInvalid,
  ...props
}: UiInputProps) {
  const input = useRef<HTMLInputElement | null>(null);
  const [caret, setCaret] = useState<{
    index: number;
    prefix: string;
    scroll: number;
    text: string;
  } | null>(null);
  const [focused, setFocused] = useState(false);
  const [composing, setComposing] = useState(false);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const number = props.type === 'number';
  const showsCaret =
    focused &&
    !composing &&
    !props.disabled &&
    !props.readOnly &&
    !number &&
    props.type !== 'password' &&
    caret !== null;
  const syncCaret = () => {
    const node = input.current;
    if (!node) {
      setCaret(null);
      return;
    }
    // Types without a text selection read null here, so they keep the native caret.
    let caretIndex: number | null = null;
    try {
      const start = node.selectionStart;
      if (start !== null && start === node.selectionEnd) caretIndex = start;
    } catch {
      caretIndex = null;
    }
    const next =
      caretIndex === null
        ? null
        : {
            index: caretIndex,
            prefix: node.value.slice(0, caretIndex),
            scroll: node.scrollLeft,
            text: node.value,
          };
    setCaret((previous) =>
      previous?.index === next?.index &&
      previous?.prefix === next?.prefix &&
      previous?.scroll === next?.scroll &&
      previous?.text === next?.text
        ? previous
        : next,
    );
  };
  // Editing keeps the caret solid for one blink cycle before it breathes again.
  const holdCaret = () => {
    if (!focused || composing || props.disabled || props.readOnly || number) return;
    if (props.type === 'password') return;
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
  const caretGlyph = useRef<HTMLSpanElement | null>(null);
  const caretFocus = useCaretMotion(
    input,
    caretGlyph,
    focused,
    showsCaret,
    caret?.prefix ?? '',
    caret?.scroll ?? 0,
    caret?.text ?? '',
    syncCaret,
  );
  const control = (
    <input
      {...props}
      ref={(node) => {
        input.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      className={mergeClassNames('ui-input', className)}
      data-validation={validation}
      aria-invalid={resolveAriaInvalid(ariaInvalid, validation)}
      onPointerDown={(event) => {
        event.currentTarget.dataset.neoverseFocusOrigin = 'pointer';
        caretFocus.markPointerFocus();
        onPointerDown?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        caretFocus.syncOnFocus();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        delete event.currentTarget.dataset.neoverseFocusOrigin;
        caretFocus.clearPointerFocus();
        setFocused(false);
        setCaret(null);
        onBlur?.(event);
      }}
      onInput={(event) => {
        syncCaret();
        holdCaret();
        onInput?.(event);
      }}
      onSelect={(event) => {
        syncCaret();
        holdCaret();
        onSelect?.(event);
      }}
      onClick={(event) => {
        syncCaret();
        onClick?.(event);
      }}
      onKeyUp={(event) => {
        syncCaret();
        onKeyUp?.(event);
      }}
      onScroll={(event) => {
        syncCaret();
        onScroll?.(event);
      }}
      onCompositionStart={(event) => {
        setComposing(true);
        onCompositionStart?.(event);
      }}
      onCompositionEnd={(event) => {
        setComposing(false);
        syncCaret();
        onCompositionEnd?.(event);
      }}
    />
  );
  if (number) {
    return (
      <span className="ui-input-number">
        {control}
        <span className="ui-input-number__steps">
          {[1, -1].map((direction) => (
            <button
              key={direction}
              className="ui-input-number__step"
              type="button"
              tabIndex={-1}
              aria-label={direction > 0 ? incrementLabel : decrementLabel}
              title={direction > 0 ? incrementLabel : decrementLabel}
              disabled={props.disabled || props.readOnly}
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.preventDefault();
                stepNumberInput(
                  event.currentTarget.closest('.ui-input-number')?.querySelector('input') ?? null,
                  direction,
                );
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="ui-input-number__indicator">
                <path d={direction > 0 ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
              </svg>
            </button>
          ))}
        </span>
      </span>
    );
  }
  return (
    <span className="ui-input-shell" data-caret={showsCaret ? 'overlay' : 'native'}>
      {control}
      {showsCaret && caret ? (
        <span
          className={`ui-input-caret${holding ? ' ui-input-caret--holding' : ''}`}
          aria-hidden="true"
        >
          <span style={{ transform: `translateX(${-caret.scroll}px)` }}>
            <span className="ui-input-caret__prefix">{caret.prefix}</span>
            <span ref={caretGlyph} className="ui-input-caret__glyph" />
          </span>
        </span>
      ) : null}
    </span>
  );
}
