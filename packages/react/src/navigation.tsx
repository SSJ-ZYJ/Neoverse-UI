import {
  type CSSProperties,
  cloneElement,
  createElement,
  type ElementType,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
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
  UiPresence,
} from './index';
import { surfaceClasses } from './surface';

export interface UiControlSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  surface?: SurfacePreset;
  scale?: ControlSurfaceScale;
  hoverMode?: SurfaceHoverMode;
  edgeMode?: SurfaceEdgeMode;
  navigationIndicator?: boolean;
  trailing?: ReactNode;
}

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
  const [bounds, setBounds] = useState<CSSProperties>();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const group = primary.current;
    setReady(false);
    setBounds(undefined);
    if (!navigationIndicator || !group) return;
    let frame = 0;
    let readyFrame = 0;
    const measure = () => {
      const marker = group.querySelector<HTMLElement>(
        '.ui-navigation-item--active .ui-navigation-item__indicator',
      );
      if (!marker) {
        setBounds(undefined);
        setReady(false);
        return;
      }
      let zoom = 1;
      for (let element: HTMLElement | null = group; element; element = element.parentElement) {
        const factor = Number.parseFloat(getComputedStyle(element).zoom);
        if (Number.isFinite(factor) && factor > 0) zoom *= factor;
      }
      const origin = group.getBoundingClientRect();
      const rect = marker.getBoundingClientRect();
      const next = {
        left: (rect.left - origin.left) / zoom,
        top: (rect.top - origin.top) / zoom,
        width: rect.width / zoom,
        height: rect.height / zoom,
      };
      setBounds((previous) =>
        previous?.left === next.left &&
        previous.top === next.top &&
        previous.width === next.width &&
        previous.height === next.height
          ? previous
          : next,
      );
      cancelAnimationFrame(readyFrame);
      readyFrame = requestAnimationFrame(() => setReady(true));
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
        {navigationIndicator && bounds ? (
          <span
            className="ui-control-surface__indicator"
            style={bounds}
            data-ready={ready}
            aria-hidden="true"
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
}
export type SegmentedControlSize = 'sm';
export interface UiSegmentedControlProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children'> {
  options: readonly SegmentOption[];
  value?: string;
  defaultValue?: string;
  size?: SegmentedControlSize;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  surface?: 'none' | 'glass-subtle' | 'glass-elevated' | 'glass-immersive';
  onValueChange?: (value: string) => void;
}

export function UiSegmentedControl({
  options,
  value,
  defaultValue,
  size: _size = 'sm',
  disabled = false,
  loading = false,
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
  const [bounds, setBounds] = useState<{ offset: number; width: number }>();
  const [ready, setReady] = useState(false);
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: Re-measure replaced options even when the selected index is unchanged.
  useEffect(() => {
    const measure = () => {
      const button = buttons.current[active];
      const next = button ? { offset: button.offsetLeft, width: button.offsetWidth } : undefined;
      setBounds((previous) =>
        previous?.offset === next?.offset && previous?.width === next?.width ? previous : next,
      );
    };
    measure();
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    if (group.current) observer?.observe(group.current);
    for (const button of buttons.current) if (button) observer?.observe(button);
    const frame = requestAnimationFrame(() => setReady(true));
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [active, options]);
  const select = (index: number, focus = false) => {
    const option = options[index];
    if (!option || disabled || loading || option.disabled) return;
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
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || rest['aria-busy']}
      data-surface={surface}
      data-neoverse-glass-edge-pass={surface.startsWith('glass-') ? 'css' : undefined}
      data-neoverse-surface-hover="static"
      className={`ui-segmented-control ${surfaceClasses[surface]} ${className}`}
      style={
        {
          ...style,
          '--segment-count': Math.max(options.length, 1),
          '--segment-index': Math.max(active, 0),
          ...(bounds
            ? {
                '--segment-active-column': '1 / -1',
                '--segment-active-offset': `${bounds.offset}px`,
                '--segment-active-width': `${bounds.width}px`,
              }
            : {}),
        } as CSSProperties
      }
    >
      <span ref={group} className="ui-segmented-control__options">
        {active >= 0 ? (
          <span className="ui-segmented-control__slider" data-ready={ready} aria-hidden="true" />
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
            aria-label={option.ariaLabel}
            tabIndex={index === roving ? 0 : -1}
            disabled={disabled || loading || option.disabled}
            className={`ui-segmented-control__option${index === active ? ' ui-segmented-control__option--active' : ''}`}
            onClick={() => select(index)}
            onFocus={() => setFocused(index)}
            onKeyDown={(event) => {
              if (disabled || loading) return;
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
            {option.label}
          </button>
        ))}
      </span>
      <UiPresence
        as="span"
        show={loading}
        variant="pop"
        className="ui-segmented-control__loading"
        aria-hidden="true"
      >
        <svg className="ui-loading-indicator" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="28 10"
          />
        </svg>
      </UiPresence>
    </div>
  );
}
