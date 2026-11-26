import { attachSelectionIndicator } from '@neoverse-ui/motion';
import {
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

export interface UiTabOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Visual treatment for tabs without changing selection behavior */
export type UiTabsVariant = 'glass' | 'underline' | 'pill';

export interface UiTabsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'children' | 'onChange'> {
  options: readonly UiTabOption[];
  ariaLabel: string;
  variant?: UiTabsVariant;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode | ((value: string) => ReactNode);
}

export function UiTabs({
  options,
  ariaLabel,
  variant = 'glass',
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  ...rest
}: UiTabsProps) {
  const glass = variant === 'glass';
  const id = useId();
  const [internal, setInternal] = useState(
    defaultValue ?? options.find((item) => !item.disabled)?.value,
  );
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const track = trackRef.current;
    const indicator = indicatorRef.current;
    if (!track || !indicator) return;
    return attachSelectionIndicator(track, indicator, '[role="tab"][aria-selected="true"]');
  }, []);
  const enabled = options.flatMap((item, index) => (item.disabled ? [] : [index]));
  const requested = value ?? internal;
  const selected = options.some((item) => !item.disabled && item.value === requested)
    ? requested
    : options.find((item) => !item.disabled)?.value;
  const selectedIndex = options.findIndex((item) => item.value === selected);
  const tabStop =
    focusedIndex !== null && enabled.includes(focusedIndex) ? focusedIndex : selectedIndex;

  const select = (index: number, focus = false) => {
    const item = options[index];
    if (!item || item.disabled) return;
    setFocusedIndex(index);
    if (value === undefined) setInternal(item.value);
    if (item.value !== selected) onValueChange?.(item.value);
    if (focus) tabRefs.current[index]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (enabled.length === 0) return;
    const at = enabled.indexOf(index);
    const next =
      event.key === 'Home'
        ? enabled[0]
        : event.key === 'End'
          ? enabled[enabled.length - 1]
          : enabled[(at + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length];
    if (next !== undefined) select(next, true);
  };

  return (
    <div
      {...rest}
      className={['ui-tabs', className].filter(Boolean).join(' ')}
      data-variant={variant}
    >
      <div
        ref={trackRef}
        className={glass ? 'ui-tabs__list material-glass-subtle' : 'ui-tabs__list'}
        data-surface={glass ? 'glass-subtle' : undefined}
        data-neoverse-surface-hover={glass ? 'static' : undefined}
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
      >
        <span
          ref={indicatorRef}
          className="ui-tabs__indicator"
          aria-hidden="true"
          data-ready="false"
        />
        {options.map((item, index) => (
          <button
            key={item.value}
            id={`${id}-tab-${index}`}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            className={['ui-tabs__tab', selected === item.value && 'ui-tabs__tab--active']
              .filter(Boolean)
              .join(' ')}
            aria-selected={selected === item.value}
            aria-controls={`${id}-panel`}
            tabIndex={tabStop === index ? 0 : -1}
            disabled={item.disabled}
            onFocus={() => setFocusedIndex(index)}
            onClick={() => select(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {selected !== undefined && (
        <div
          className="ui-tabs__panel"
          id={`${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${selectedIndex}`}
        >
          <div key={selected} className="nv-appear" data-neoverse-motion="fade">
            {typeof children === 'function' ? children(selected) : children}
          </div>
        </div>
      )}
    </div>
  );
}
