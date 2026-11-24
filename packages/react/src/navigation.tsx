import { attachSegmentedControlSlider } from '@neoverse-ui/motion';
import {
  type CSSProperties,
  cloneElement,
  createElement,
  type ElementType,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type TransitionEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  type ControlSurfaceScale,
  type SurfaceEdgeMode,
  type SurfaceHoverMode,
  type SurfacePreset,
  UiAction,
  type UiActionProps,
} from './index.js';
import { surfaceClasses } from './surface.js';

export interface UiControlSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  surface?: SurfacePreset;
  scale?: ControlSurfaceScale;
  hoverMode?: SurfaceHoverMode;
  edgeMode?: SurfaceEdgeMode;
  navigationIndicator?: boolean;
  trailing?: ReactNode;
}

type IndicatorRect = { left: number; top: number; width: number; height: number };

// A stable style object keeps React from rewriting the visibility the
// measurement writes imperatively on every re-render.
const indicatorHiddenStyle: CSSProperties = { visibility: 'hidden' };

const sameIndicatorRect = (first: IndicatorRect, second: IndicatorRect): boolean =>
  first.left === second.left &&
  first.top === second.top &&
  first.width === second.width &&
  first.height === second.height;

const writeIndicatorGeometry = (element: HTMLElement, rect: IndicatorRect): void => {
  element.style.left = `${rect.left}px`;
  element.style.top = `${rect.top}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
  element.style.transform = '';
  element.style.visibility = 'visible';
};

// The commit must land while the transform transition is disabled; otherwise
// restoring the base geometry retargets the flight back toward the old item.
const commitIndicator = (element: HTMLElement, rect: IndicatorRect): void => {
  element.style.transition = 'none';
  writeIndicatorGeometry(element, rect);
  void element.offsetWidth;
  element.style.transition = '';
};

const indicatorTransitionDisabled = (element: HTMLElement): boolean =>
  getComputedStyle(element)
    .transitionDuration.split(',')
    .every((value) => Number.parseFloat(value) === 0);

export function UiControlSurface({
  as = 'div',
  surface = 'glass-subtle',
  scale = 'md',
  hoverMode = 'auto',
  edgeMode = 'auto',
  navigationIndicator = false,
  trailing,
  children,
  className = '',
  ...rest
}: UiControlSurfaceProps) {
  const primary = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  // Committed geometry lives in left/top/width/height; the flight between
  // selections is a compositor translate + scale away from that base, so the
  // indicator never runs per-frame layout inside a glass surface.
  const indicatorBase = useRef<IndicatorRect | undefined>(undefined);
  const indicatorTarget = useRef<IndicatorRect | undefined>(undefined);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const group = primary.current;
    setReady(false);
    indicatorBase.current = undefined;
    indicatorTarget.current = undefined;
    if (!navigationIndicator || !group) return;
    let frame = 0;
    let readyFrame = 0;
    const measure = () => {
      const element = indicator.current;
      const marker = group.querySelector<HTMLElement>(
        '.ui-navigation-item--active .ui-navigation-item__indicator',
      );
      if (!marker || !element) {
        indicatorBase.current = undefined;
        indicatorTarget.current = undefined;
        setReady(false);
        if (element) {
          element.style.visibility = 'hidden';
          element.style.transform = '';
        }
        return;
      }
      let zoom = 1;
      for (let element: HTMLElement | null = group; element; element = element.parentElement) {
        const factor = Number.parseFloat(getComputedStyle(element).zoom);
        if (Number.isFinite(factor) && factor > 0) zoom *= factor;
      }
      const origin = group.getBoundingClientRect();
      const rect = marker.getBoundingClientRect();
      const target = {
        left: (rect.left - origin.left) / zoom,
        top: (rect.top - origin.top) / zoom,
        width: rect.width / zoom,
        height: rect.height / zoom,
      };
      indicatorTarget.current = target;
      const base = indicatorBase.current;
      if (!base) {
        writeIndicatorGeometry(element, target);
        indicatorBase.current = target;
        cancelAnimationFrame(readyFrame);
        readyFrame = requestAnimationFrame(() => setReady(true));
        return;
      }
      if (sameIndicatorRect(target, base)) {
        // Returning to the committed item: CSS interpolates the flight back to none.
        if (element.style.transform !== '') element.style.transform = '';
        return;
      }
      if (base.width === 0 || base.height === 0 || indicatorTransitionDisabled(element)) {
        commitIndicator(element, target);
        indicatorBase.current = target;
        return;
      }
      const translateX = target.left - base.left;
      const translateY = target.top - base.top;
      const scaleX = target.width / base.width;
      const scaleY = target.height / base.height;
      element.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
    };
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    const observe = () => {
      resize?.disconnect();
      resize?.observe(group);
      for (const item of group.querySelectorAll('.ui-navigation-item')) resize?.observe(item);
    };
    const mutation =
      typeof MutationObserver === 'undefined'
        ? undefined
        : new MutationObserver((records) => {
            if (
              records.every((record) =>
                (record.target as HTMLElement).classList?.contains('ui-control-surface__indicator'),
              )
            )
              return;
            observe();
            measure();
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
          });
    observe();
    mutation?.observe(group, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'aria-current'],
    });
    measure();
    return () => {
      resize?.disconnect();
      mutation?.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(readyFrame);
    };
  }, [navigationIndicator]);
  const settleIndicator = (event: TransitionEvent<HTMLSpanElement>) => {
    if (event.propertyName !== 'transform' || event.target !== indicator.current) return;
    const element = indicator.current;
    const target = indicatorTarget.current;
    const base = indicatorBase.current;
    if (!element || !target || !base) return;
    if (sameIndicatorRect(target, base) && element.style.transform === '') return;
    commitIndicator(element, target);
    indicatorBase.current = target;
  };
  return createElement(
    as,
    {
      ...rest,
      className: `ui-control-surface ${surfaceClasses[surface]} ui-control-surface--scale-${scale}${navigationIndicator ? ' ui-control-surface--shared-indicator' : ''} ${className}`,
      'data-surface': surface,
      'data-neoverse-navigation-indicator-ready': navigationIndicator && ready ? 'true' : undefined,
      'data-neoverse-surface-hover': hoverMode === 'static' ? 'static' : undefined,
      'data-neoverse-glass-edge-pass': edgeMode === 'local' ? 'css' : undefined,
    },
    <>
      <div ref={primary} className="ui-control-surface__group ui-control-surface__group--primary">
        {children}
        {navigationIndicator ? (
          <span
            ref={indicator}
            className="ui-control-surface__indicator"
            style={indicatorHiddenStyle}
            data-ready={ready}
            aria-hidden="true"
            onTransitionEnd={settleIndicator}
          />
        ) : null}
      </div>
      {trailing != null ? (
        <>
          <span className="ui-control-surface__divider" aria-hidden="true" />
          <div className="ui-control-surface__group ui-control-surface__group--trailing">
            {trailing}
          </div>
        </>
      ) : null}
    </>,
  );
}

export type NavigationIndicatorPlacement = 'bottom' | 'start';
export interface UiNavigationItemProps
  extends Omit<UiActionProps, 'variant' | 'children' | 'leading' | 'decoration'> {
  label: string;
  active?: boolean;
  compact?: boolean;
  indicatorPlacement?: NavigationIndicatorPlacement;
  icon?: ReactNode;
  children?: ReactElement<{ children?: ReactNode }>;
}

export function UiNavigationItem({
  label,
  active = false,
  compact = false,
  stretch = false,
  surface = 'none',
  indicatorPlacement = 'bottom',
  icon,
  asChild = false,
  children,
  className = '',
  ...rest
}: UiNavigationItemProps) {
  if (asChild && !children)
    throw new Error('UiNavigationItem with asChild expects one routed element.');
  const content = (
    <span className={`ui-navigation-item__label${compact ? ' sr-only' : ''}`}>{label}</span>
  );
  return (
    <UiAction
      {...rest}
      asChild={asChild}
      variant="ghost"
      stretch={stretch}
      surface={surface}
      aria-current={rest['aria-current'] ?? (active ? 'page' : undefined)}
      className={`ui-navigation-item${active ? ' ui-navigation-item--active' : ''}${compact ? ' ui-navigation-item--compact' : ''}${stretch ? ' ui-navigation-item--stretch' : ''}${indicatorPlacement === 'start' ? ' ui-navigation-item--indicator-start' : ''} ${className}`}
      leading={icon}
      decoration={<span className="ui-navigation-item__indicator" aria-hidden="true" />}
    >
      {asChild && children ? cloneElement(children, undefined, content) : content}
    </UiAction>
  );
}

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
