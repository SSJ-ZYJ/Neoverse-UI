import {
  type ComponentPropsWithRef,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { type SurfacePreset, UiSurface } from './index';

export type TerminalPromptTone = 'host' | 'path' | 'branch' | 'runtime' | 'time';
export interface TerminalPromptSegment {
  id: string;
  label: string;
  tone?: TerminalPromptTone;
}

function TerminalPromptContext({
  segments,
  context,
  renderSegment,
}: {
  segments: readonly TerminalPromptSegment[];
  context?: ReactNode;
  renderSegment: ((segment: TerminalPromptSegment) => ReactNode) | undefined;
}) {
  if (segments.length === 0 && context == null) return null;
  return (
    <div className="ui-terminal-prompt__context">
      {context ?? (
        <>
          <span className="ui-terminal-prompt__lead" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          {segments.map((segment) => (
            <span
              key={segment.id}
              className="ui-terminal-prompt__segment"
              data-tone={segment.tone ?? 'runtime'}
              title={segment.label}
            >
              {renderSegment ? renderSegment(segment) : segment.label}
            </span>
          ))}
        </>
      )}
    </div>
  );
}

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
  const [editor, setEditor] = useState({ atEnd: false, scroll: 0 });
  const current = value ?? internal;
  const syncEditor = () => {
    const node = input.current;
    const next = {
      atEnd:
        !!node &&
        node.selectionStart === node.value.length &&
        node.selectionEnd === node.value.length,
      scroll: node?.scrollLeft ?? 0,
    };
    setEditor((previous) =>
      previous.atEnd === next.atEnd && previous.scroll === next.scroll ? previous : next,
    );
  };
  // Selection can move when a controlled value or suggestion changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: Native selection changes after React commits a new input value.
  useEffect(syncEditor, [current, suggestion]);
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
  return (
    <div
      className={`ui-terminal-prompt ${className}`}
      style={style}
      data-error={error ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
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
            onFocus={(event) => {
              setFocused(true);
              syncEditor();
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            onChange={(event) => {
              setInternal(event.currentTarget.value);
              onValueChange?.(event.currentTarget.value);
              syncEditor();
              onChange?.(event);
            }}
            onSelect={(event) => {
              syncEditor();
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
        </span>
      </label>
    </div>
  );
}

export interface UiTerminalEchoProps extends HTMLAttributes<HTMLElement> {
  /** Recorded command text. Rendered as plain text; never interpreted. */
  text: string;
  symbol?: string;
  segments?: readonly TerminalPromptSegment[];
  error?: boolean;
  renderSegment?: (segment: TerminalPromptSegment) => ReactNode;
}

export function UiTerminalEcho({
  text,
  symbol = '❯',
  segments = [],
  error = false,
  renderSegment,
  className = '',
  children,
  ...rest
}: UiTerminalEchoProps) {
  return (
    <div
      {...rest}
      className={`ui-terminal-echo ${className}`}
      data-error={error ? 'true' : 'false'}
      data-readonly="true"
    >
      <TerminalPromptContext segments={segments} renderSegment={renderSegment} />
      <div className="ui-terminal-echo__entry">
        <span className="ui-terminal-prompt__symbol" aria-hidden="true">
          {symbol}
        </span>
        <span className="ui-terminal-echo__text">{text}</span>
      </div>
    </div>
  );
}

export interface UiTerminalSurfaceProps extends HTMLAttributes<HTMLElement> {
  title: string;
  ariaLabel?: string;
  density?: 'compact' | 'expanded';
  surface?: SurfacePreset;
  header?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
}

export function UiTerminalSurface({
  title,
  ariaLabel,
  density = 'compact',
  surface = 'glass-elevated',
  header,
  status,
  actions,
  className = '',
  children,
  ...rest
}: UiTerminalSurfaceProps) {
  return (
    <UiSurface
      {...rest}
      as="section"
      surface={surface}
      aria-label={ariaLabel ?? rest['aria-label'] ?? title}
      data-density={density}
      className={`ui-terminal-surface ${className}`}
    >
      <header className="ui-terminal-surface__header">
        {header ?? (
          <>
            <span className="ui-terminal-surface__title">{title}</span>
            {status != null ? <div className="ui-terminal-surface__status">{status}</div> : null}
            {actions != null ? (
              <div
                className="ui-terminal-surface__actions"
                role="toolbar"
                aria-label={`${title} actions`}
              >
                {actions}
              </div>
            ) : null}
          </>
        )}
      </header>
      <div className="ui-terminal-surface__body">{children}</div>
    </UiSurface>
  );
}

export interface UiTerminalLineProps extends HTMLAttributes<HTMLDivElement> {
  kind?: 'command' | 'text' | 'status';
  tone?: 'normal' | 'muted' | 'success' | 'error';
  preformatted?: boolean;
  text?: string;
}

export function UiTerminalLine({
  kind = 'text',
  tone = 'normal',
  preformatted = false,
  text,
  className = '',
  children,
  ...rest
}: UiTerminalLineProps) {
  return (
    <div
      {...rest}
      className={`ui-terminal-line ${className}`}
      data-kind={kind}
      data-tone={tone}
      data-preformatted={preformatted ? 'true' : 'false'}
    >
      {children ?? text}
    </div>
  );
}

export interface UiTerminalTranscriptProps extends HTMLAttributes<HTMLElement> {
  label?: string;
  followTail?: boolean;
  density?: 'compact' | 'comfortable';
  live?: 'polite' | 'off';
}

export function UiTerminalTranscript({
  label = 'Terminal output',
  followTail = true,
  density = 'comfortable',
  live = 'polite',
  className = '',
  children,
  ...rest
}: UiTerminalTranscriptProps) {
  const scroller = useRef<HTMLElement>(null);
  const follow = useRef(followTail);
  const sync = useRef<() => void>(() => undefined);
  follow.current = followTail;
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    let shouldFollow = true;
    let pending = false;
    let disposed = false;
    let width = element.clientWidth;
    let height = element.clientHeight;
    const atBottom = () => element.scrollHeight - element.clientHeight - element.scrollTop <= 3;
    const syncTail = () => {
      if (!follow.current || !shouldFollow || pending) return;
      pending = true;
      queueMicrotask(() => {
        pending = false;
        if (!disposed && follow.current && shouldFollow) element.scrollTop = element.scrollHeight;
      });
    };
    sync.current = syncTail;
    const onScroll = () => {
      const resized = width !== element.clientWidth || height !== element.clientHeight;
      width = element.clientWidth;
      height = element.clientHeight;
      if (resized && shouldFollow) syncTail();
      else shouldFollow = atBottom();
    };
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) shouldFollow = false;
    };
    const onTouchMove = () => {
      shouldFollow = false;
    };
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest('input, textarea, [contenteditable="true"]'))
        return;
      if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) shouldFollow = false;
    };
    if (follow.current) element.scrollTop = element.scrollHeight;
    shouldFollow = atBottom();
    element.addEventListener('scroll', onScroll, { passive: true });
    element.addEventListener('wheel', onWheel, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: true });
    element.addEventListener('keydown', onKeydown);
    const resize =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => {
            width = element.clientWidth;
            height = element.clientHeight;
            syncTail();
          });
    const observe = () => {
      resize?.disconnect();
      resize?.observe(element);
      for (const child of element.children) resize?.observe(child);
    };
    const mutation =
      typeof MutationObserver === 'undefined'
        ? undefined
        : new MutationObserver(() => {
            observe();
            syncTail();
          });
    mutation?.observe(element, { childList: true, subtree: true, characterData: true });
    observe();
    return () => {
      disposed = true;
      mutation?.disconnect();
      resize?.disconnect();
      element.removeEventListener('scroll', onScroll);
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('keydown', onKeydown);
      sync.current = () => undefined;
    };
  }, []);
  useEffect(() => {
    if (followTail) sync.current();
  }, [followTail]);
  return (
    <section
      {...rest}
      ref={scroller}
      className={`ui-terminal-transcript scrollbar-immersive ${className}`}
      data-density={density}
      aria-label={label}
    >
      <div role="log" aria-live={live} aria-relevant="additions text" aria-atomic="false">
        {children}
      </div>
    </section>
  );
}
