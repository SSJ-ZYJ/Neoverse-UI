import {
  type ComponentPropsWithRef,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { useCaretMotion } from '../motion/caret-motion.js';
import { TerminalPromptContext, type TerminalPromptSegment } from './terminal-prompt-context.js';

export interface UiTerminalPromptProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    'size' | 'type' | 'value' | 'defaultValue' | 'children'
  > {
  label: string;
  value?: string;
  defaultValue?: string;
  suggestion?: string;
  type?: 'text' | 'password' | 'search';
  symbol?: string;
  segments?: readonly TerminalPromptSegment[];
  error?: boolean;
  context?: ReactNode;
  renderSegment?: (segment: TerminalPromptSegment) => ReactNode;
  onValueChange?: (value: string) => void;
}

export function UiTerminalPrompt({
  id,
  label,
  value,
  defaultValue = '',
  suggestion = '',
  type = 'text',
  symbol = '❯',
  segments = [],
  disabled = false,
  readOnly = false,
  error = false,
  context,
  renderSegment,
  onValueChange,
  className = '',
  style,
  ref,
  onPointerDown,
  onFocus,
  onBlur,
  onChange,
  onSelect,
  onClick,
  onKeyUp,
  onScroll,
  onCompositionStart,
  onCompositionEnd,
  autoComplete = 'off',
  autoCapitalize = 'off',
  spellCheck = false,
  ...rest
}: UiTerminalPromptProps) {
  const generatedId = useId();
  const resolvedId = id ?? generatedId;
  const input = useRef<HTMLInputElement | null>(null);
  const [internal, setInternal] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const [composing, setComposing] = useState(false);
  const [editor, setEditor] = useState<{
    atEnd: boolean;
    scroll: number;
    caret: number | null;
  }>({ atEnd: false, scroll: 0, caret: null });
  const current = value ?? internal;
  const syncEditor = () => {
    const node = input.current;
    const collapsed =
      !!node && node.selectionStart !== null && node.selectionStart === node.selectionEnd;
    const next = {
      atEnd:
        !!node &&
        node.selectionStart === node.value.length &&
        node.selectionEnd === node.value.length,
      scroll: node?.scrollLeft ?? 0,
      caret: collapsed ? (node?.selectionStart ?? 0) : null,
    };
    setEditor((previous) =>
      previous.atEnd === next.atEnd &&
      previous.scroll === next.scroll &&
      previous.caret === next.caret
        ? previous
        : next,
    );
  };
  // Selection can move when a controlled value or suggestion changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: Native selection changes after React commits a new input value.
  useEffect(() => {
    if (focused) syncEditor();
  }, [current, suggestion]);
  const suffix =
    focused &&
    editor.atEnd &&
    !composing &&
    !disabled &&
    !readOnly &&
    type !== 'password' &&
    current &&
    suggestion.startsWith(current)
      ? suggestion.slice(current.length)
      : '';
  // The prompt draws its own breathing caret; states that need precise native
  // editing keep the browser caret instead.
  const caretIndex =
    focused && !composing && !disabled && !readOnly && type !== 'password' ? editor.caret : null;
  const drawsCaret = caretIndex !== null;
  const caretPrefix = current.slice(0, caretIndex ?? 0);
  const caretGlyph = useRef<HTMLSpanElement | null>(null);
  const caretFocus = useCaretMotion(
    input,
    caretGlyph,
    focused,
    drawsCaret,
    caretPrefix,
    editor.scroll,
    current,
    syncEditor,
    'terminal',
  );
  // Editing keeps the caret solid for one blink cycle before it breathes again.
  const holdCaret = () =>
    caretFocus.hold(focused && !composing && !disabled && !readOnly && type !== 'password');
  return (
    <div
      className={`ui-terminal-prompt ${className}`}
      style={style}
      data-error={error ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      data-caret={drawsCaret ? 'overlay' : 'native'}
    >
      <TerminalPromptContext segments={segments} context={context} renderSegment={renderSegment} />
      <label className="ui-terminal-prompt__entry" htmlFor={resolvedId}>
        <span className="ui-terminal-prompt__symbol" aria-hidden="true">
          {symbol}
        </span>
        <span className="ui-terminal-prompt__input-wrap">
          {suffix ? (
            <span className="ui-terminal-prompt__ghost" aria-hidden="true">
              <span style={{ transform: `translateX(${-editor.scroll}px)` }}>
                <span className="ui-terminal-prompt__ghost-prefix">{current}</span>
                <span className="ui-terminal-prompt__ghost-suffix">{suffix}</span>
              </span>
            </span>
          ) : null}
          <input
            {...rest}
            ref={(node) => {
              input.current = node;
              if (typeof ref === 'function') return ref(node);
              if (ref) ref.current = node;
            }}
            id={resolvedId}
            className="ui-terminal-prompt__editor"
            type={type}
            value={current}
            disabled={disabled}
            readOnly={readOnly}
            aria-label={label}
            aria-invalid={error || undefined}
            autoComplete={autoComplete}
            autoCapitalize={autoCapitalize}
            spellCheck={spellCheck}
            onPointerDown={(event) => {
              caretFocus.markPointerFocus();
              onPointerDown?.(event);
            }}
            onFocus={(event) => {
              setFocused(true);
              caretFocus.syncOnFocus();
              onFocus?.(event);
            }}
            onBlur={(event) => {
              caretFocus.clearPointerFocus();
              setFocused(false);
              setEditor((prev) => (prev.caret === null ? prev : { ...prev, caret: null }));
              onBlur?.(event);
            }}
            onChange={(event) => {
              setInternal(event.currentTarget.value);
              onValueChange?.(event.currentTarget.value);
              syncEditor();
              holdCaret();
              onChange?.(event);
            }}
            onSelect={(event) => {
              syncEditor();
              holdCaret();
              onSelect?.(event);
            }}
            onClick={(event) => {
              syncEditor();
              onClick?.(event);
            }}
            onKeyUp={(event) => {
              syncEditor();
              onKeyUp?.(event);
            }}
            onScroll={(event) => {
              syncEditor();
              onScroll?.(event);
            }}
            onCompositionStart={(event) => {
              setComposing(true);
              onCompositionStart?.(event);
            }}
            onCompositionEnd={(event) => {
              setComposing(false);
              syncEditor();
              onCompositionEnd?.(event);
            }}
          />
          {drawsCaret ? (
            <span
              className={`ui-terminal-prompt__caret${caretFocus.holding ? ' ui-terminal-prompt__caret--holding' : ''}`}
              aria-hidden="true"
            >
              <span style={{ transform: `translateX(${-editor.scroll}px)` }}>
                <span className="ui-terminal-prompt__caret-prefix">{caretPrefix}</span>
                <span ref={caretGlyph} className="ui-terminal-prompt__caret-glyph" />
              </span>
            </span>
          ) : null}
        </span>
      </label>
    </div>
  );
}
