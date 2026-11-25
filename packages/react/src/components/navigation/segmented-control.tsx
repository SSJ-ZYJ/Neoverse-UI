import { attachSegmentedControlSlider } from '@neoverse-ui/motion';
import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { surfaceClasses } from '../surfaces/surface-presets.js';

export interface SegmentOption {
  value: string;
  label: string;
  disabled?: boolean;
  ariaLabel?: string;
  icon?: ReactNode;
}
export type SegmentedControlSize = 'sm';
export type SegmentedControlShape = 'pill' | 'rounded';
/** Select the presentation without changing the radio behavior */
export type SegmentedControlVariant = 'text' | 'icon' | 'language';
export interface UiSegmentedControlProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children'> {
  options: readonly SegmentOption[];
  value?: string;
  defaultValue?: string;
  size?: SegmentedControlSize;
  shape?: SegmentedControlShape;
  variant?: SegmentedControlVariant;
  disabled?: boolean;
  ariaLabel?: string;
  surface?: 'none' | 'glass-subtle' | 'glass-elevated' | 'glass-immersive';
  onValueChange?: (value: string) => void;
}

export function UiSegmentedControl({
  options,
  value,
  defaultValue,
  size: _size = 'sm',
  shape = 'pill',
  variant = 'text',
  disabled = false,
  ariaLabel,
  surface = 'glass-subtle',
  onValueChange,
  className = '',
  style,
  ...rest
}: UiSegmentedControlProps) {
  const [internal, setInternal] = useState(
    () =>
      options.find((option) => !option.disabled && option.value === defaultValue)?.value ??
      options.find((option) => !option.disabled)?.value,
  );
  const [focused, setFocused] = useState<number | null>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const group = useRef<HTMLSpanElement>(null);
  const current = value === undefined ? internal : value;
  const active = options.findIndex((option) => !option.disabled && option.value === current);
  const enabled = options.flatMap((option, index) => (option.disabled ? [] : [index]));
  const roving =
    focused !== null && enabled.includes(focused) ? focused : active >= 0 ? active : enabled[0];
  useEffect(() => {
    if (value !== undefined) {
      setInternal(value);
      return;
    }
    if (!options.some((option) => !option.disabled && option.value === internal))
      setInternal(options.find((option) => !option.disabled)?.value);
  }, [options, value, internal]);
  useEffect(() => {
    if (group.current) return attachSegmentedControlSlider(group.current);
  }, []);
  const select = (index: number, focus = false) => {
    const option = options[index];
    if (!option || disabled || option.disabled) return;
    setFocused(index);
    setInternal(option.value);
    if (option.value !== current) onValueChange?.(option.value);
    if (focus) buttons.current[index]?.focus();
  };
  return (
    <div
      {...rest}
      role="radiogroup"
      aria-orientation="horizontal"
      aria-label={ariaLabel ?? rest['aria-label']}
      aria-disabled={disabled || undefined}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setFocused(null);
      }}
      data-shape={shape}
      data-variant={variant}
      data-surface={surface}
      data-neoverse-surface-hover="static"
      className={`ui-segmented-control ui-segmented-control--${shape} ${surfaceClasses[surface]} ${className}`}
      style={
        {
          ...style,
          '--segment-count': Math.max(options.length, 1),
          '--segment-index': Math.max(active, 0),
        } as CSSProperties
      }
    >
      <span ref={group} className="ui-segmented-control__options">
        {active >= 0 ? (
          <span className="ui-segmented-control__slider-track" aria-hidden="true">
            <span className="ui-segmented-control__slider" />
          </span>
        ) : null}
        {options.map((option, index) => (
          // biome-ignore lint/a11y/useSemanticElements: Custom radio widget uses button keyboard behavior, matching Vue.
          <button
            key={option.value}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={index === active}
            aria-label={option.ariaLabel ?? (variant === 'icon' ? option.label : undefined)}
            tabIndex={index === roving ? 0 : -1}
            disabled={disabled || option.disabled}
            className={`ui-segmented-control__option${index === active ? ' ui-segmented-control__option--active' : ''}`}
            onClick={() => select(index)}
            onFocus={() => setFocused(index)}
            onKeyDown={(event) => {
              if (disabled) return;
              let target: number | undefined;
              if (event.key === 'Home') target = enabled[0];
              else if (event.key === 'End') target = enabled[enabled.length - 1];
              else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft')
                target =
                  enabled[
                    (enabled.indexOf(index) +
                      (event.key === 'ArrowRight' ? 1 : -1) +
                      enabled.length) %
                      enabled.length
                  ];
              else return;
              event.preventDefault();
              if (target !== undefined) select(target, true);
            }}
          >
            {variant === 'icon' && option.icon != null ? (
              <span className="ui-segmented-control__icon" aria-hidden="true">
                {option.icon}
              </span>
            ) : (
              option.label
            )}
          </button>
        ))}
      </span>
    </div>
  );
}
