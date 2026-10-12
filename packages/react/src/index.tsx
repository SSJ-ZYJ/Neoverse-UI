import {
  type AnchoredOverlayOptions,
  hideAnchoredOverlay,
  isOverlayOpen,
  type OverlayPlacement,
  showAnchoredOverlay,
  stopOverlayTracking,
} from '@neoverse-ui/overlay-runtime';
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  Children,
  type ComponentPropsWithRef,
  cloneElement,
  createElement,
  type ElementType,
  type HTMLAttributes,
  isValidElement,
  type MouseEventHandler,
  type PointerEventHandler,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

export type { UiPresenceProps, UiPresenceState } from './presence';
export { UiPresence, useUiPresence } from './presence';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type NoticeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type FormControlValidation = 'none' | 'error' | 'warning' | 'success';
export type ActionSize = 'sm' | 'md' | 'lg';
export type ActionScale = 'md' | 'lg';
export type ControlSurfaceScale = 'md' | 'lg';
export type SurfaceHoverMode = 'auto' | 'static';
export type SurfaceEdgeMode = 'auto' | 'local';
export type ControlSurfacePreset = 'none' | 'glass-subtle' | 'glass-elevated' | 'glass-immersive';
export type SurfacePreset =
  | 'none'
  | 'solid'
  | 'subtle'
  | 'elevated'
  | 'inset'
  | 'chrome'
  | 'glass-subtle'
  | 'glass-elevated'
  | 'glass-immersive';

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'ui-button--primary',
  secondary: 'ui-button--secondary',
  ghost: 'ui-button--ghost',
};

const actionSizeClasses: Record<ActionSize, string> = {
  sm: 'ui-action--sm',
  md: 'ui-action--md',
  lg: 'ui-action--lg',
};

const actionScaleClasses: Record<ActionScale, string> = {
  md: 'ui-action--scale-md',
  lg: 'ui-action--scale-lg',
};

const buttonSizeClasses: Record<ActionSize, string> = {
  sm: 'ui-button--sm',
  md: 'ui-button--md',
  lg: 'ui-button--lg',
};

const buttonStretchSizeClasses: Record<ActionSize, string> = {
  sm: 'ui-button--sm ui-button--stretch',
  md: 'ui-button--md ui-button--stretch',
  lg: 'ui-button--lg ui-button--stretch',
};

const iconButtonSizeClasses: Record<ActionSize, string> = {
  sm: 'ui-icon-button--sm',
  md: 'ui-icon-button--md',
  lg: 'ui-icon-button--lg',
};

const iconButtonStretchSizeClasses: Record<ActionSize, string> = {
  sm: 'ui-icon-button--sm ui-icon-button--stretch',
  md: 'ui-icon-button--md ui-icon-button--stretch',
  lg: 'ui-icon-button--lg ui-icon-button--stretch',
};

const loadingIndicatorClass = 'ui-loading-indicator';

const surfaceClasses: Record<SurfacePreset, string> = {
  none: '',
  solid: 'ui-surface-solid',
  subtle: 'ui-surface-subtle',
  elevated: 'ui-surface-elevated',
  inset: 'ui-surface-inset',
  chrome: 'ui-surface-chrome',
  'glass-subtle': 'material-glass-subtle',
  'glass-elevated': 'material-glass-elevated',
  'glass-immersive': 'material-glass-immersive',
};

const actionBaseClasses = 'ui-button ui-action';

const mergeClassNames = (...values: Array<string | false | null | undefined>): string =>
  values.filter(Boolean).join(' ');

const clampPercentage = (value: number): number =>
  Math.round(Math.min(Math.max(value, 0), 100) * 100) / 100;

function updateButtonPointerGlow(event: Parameters<PointerEventHandler<HTMLElement>>[0]): void {
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  target.style.setProperty(
    '--neoverse-button-press-x',
    `${clampPercentage(((event.clientX - rect.left) / rect.width) * 100)}%`,
  );
  target.style.setProperty(
    '--neoverse-button-press-y',
    `${clampPercentage(((event.clientY - rect.top) / rect.height) * 100)}%`,
  );
}

export interface ActionClassNameOptions {
  variant?: ButtonVariant;
  size?: ActionSize;
  scale?: ActionScale;
  stretch?: boolean;
  surface?: ControlSurfacePreset;
  className?: string;
}

export function uiActionClassName({
  variant = 'primary',
  size = 'md',
  scale = 'md',
  stretch = false,
  surface = 'glass-subtle',
  className,
}: ActionClassNameOptions = {}): string {
  return mergeClassNames(
    actionBaseClasses,
    surfaceClasses[surface],
    buttonVariantClasses[variant],
    actionSizeClasses[size],
    actionScaleClasses[scale],
    stretch && 'ui-action--stretch',
    className,
  );
}

export interface UiActionProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  as?: 'a' | 'button';
  asChild?: boolean;
  href?: string;
  variant?: ButtonVariant;
  size?: ActionSize;
  scale?: ActionScale;
  disabled?: boolean;
  stretch?: boolean;
  surface?: ControlSurfacePreset;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  rel?: AnchorHTMLAttributes<HTMLAnchorElement>['rel'];
  target?: AnchorHTMLAttributes<HTMLAnchorElement>['target'];
  leading?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}

type SlottableElementProps = {
  className?: string | undefined;
  children?: ReactNode | undefined;
  href?: string | undefined;
  tabIndex?: number | undefined;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'] | undefined;
  onClick?: MouseEventHandler<HTMLElement> | undefined;
  onPointerDown?: PointerEventHandler<HTMLElement> | undefined;
  [key: `data-${string}`]: unknown;
  [key: `aria-${string}`]: unknown;
};

export function UiAction({
  as = 'a',
  asChild = false,
  href,
  variant = 'primary',
  size = 'md',
  scale = 'md',
  disabled = false,
  stretch = false,
  surface = 'glass-subtle',
  type = 'button',
  leading,
  trailing,
  children,
  className,
  onClick,
  onPointerDown,
  ...rest
}: UiActionProps) {
  const classes = uiActionClassName({
    variant,
    size,
    scale,
    stretch,
    surface,
    className: className ?? '',
  });
  const renderContent = (content: ReactNode) => (
    <>
      <span className="ui-button__tone-field" aria-hidden="true" />
      <span className="ui-button__edge-field" aria-hidden="true" />
      {leading ? (
        <span className="ui-action__leading" aria-hidden="true">
          {leading}
        </span>
      ) : null}
      <span className="ui-action__content">{content}</span>
      {trailing ? (
        <span className="ui-action__trailing" aria-hidden="true">
          {trailing}
        </span>
      ) : null}
    </>
  );

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement<SlottableElementProps>(child)) {
      throw new Error('UiAction with asChild expects one valid React element.');
    }

    const childProps = child.props;
    const childOnClick = childProps.onClick;
    const childOnPointerDown = childProps.onPointerDown;
    const handleChildClick: MouseEventHandler<HTMLElement> = (event) => {
      if (disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick?.(event);
      childOnClick?.(event);
    };
    const handleChildPointerDown: PointerEventHandler<HTMLElement> = (event) => {
      if (!disabled) updateButtonPointerGlow(event);
      onPointerDown?.(event);
      childOnPointerDown?.(event);
    };

    return cloneElement(child as ReactElement<SlottableElementProps>, {
      ...rest,
      className: mergeClassNames(classes, childProps.className),
      href: disabled ? undefined : (href ?? childProps.href),
      tabIndex: disabled ? -1 : childProps.tabIndex,
      'aria-disabled': disabled || undefined,
      'data-surface': surface,
      onClick: handleChildClick,
      onPointerDown: handleChildPointerDown,
      children: renderContent(childProps.children),
    });
  }

  if (as === 'button') {
    return (
      <button
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
        type={type}
        disabled={disabled}
        data-surface={surface}
        className={classes}
        onClick={onClick}
        onPointerDown={(event) => {
          if (!disabled) updateButtonPointerGlow(event);
          onPointerDown?.(event);
        }}
      >
        {renderContent(children)}
      </button>
    );
  }

  return (
    <a
      {...rest}
      href={disabled ? undefined : href}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : rest.tabIndex}
      data-surface={surface}
      className={classes}
      onPointerDown={(event) => {
        if (!disabled) updateButtonPointerGlow(event);
        onPointerDown?.(event);
      }}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      }}
    >
      {renderContent(children)}
    </a>
  );
}

export interface UiDockProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  as?: 'nav' | 'div';
  surface?: SurfacePreset;
  scale?: ControlSurfaceScale;
  compact?: boolean;
  hoverMode?: SurfaceHoverMode;
  edgeMode?: SurfaceEdgeMode;
  trailing?: ReactNode;
  children: ReactNode;
}

/** Reusable Dock shell. Product routing, navigation semantics, and trailing controls stay caller-owned. */
export function UiDock({
  as = 'nav',
  surface = 'chrome',
  scale = 'lg',
  compact = false,
  hoverMode = 'static',
  edgeMode = 'auto',
  trailing,
  children,
  className,
  ...rest
}: UiDockProps) {
  return createElement(
    as,
    {
      ...rest,
      className: mergeClassNames(
        'ui-control-surface',
        surfaceClasses[surface],
        `ui-control-surface--scale-${scale}`,
        'ui-dock',
        compact && 'ui-dock--compact',
        className,
      ),
      'data-surface': surface,
      'data-neoverse-surface-hover': hoverMode === 'static' ? 'static' : undefined,
      'data-neoverse-glass-edge-pass': edgeMode === 'local' ? 'css' : undefined,
    },
    createElement(
      'div',
      { className: 'ui-control-surface__group ui-control-surface__group--primary' },
      children,
    ),
    trailing !== undefined && trailing !== null
      ? createElement('span', {
          className: 'ui-control-surface__divider',
          'aria-hidden': true,
        })
      : null,
    trailing !== undefined && trailing !== null
      ? createElement(
          'div',
          { className: 'ui-control-surface__group ui-control-surface__group--trailing' },
          trailing,
        )
      : null,
  );
}

export interface BreadcrumbItem {
  id?: string;
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbRenderState {
  item: BreadcrumbItem;
  index: number;
  current: boolean;
}

export interface UiBreadcrumbProps
  extends Omit<ComponentPropsWithRef<'nav'>, 'aria-label' | 'children'> {
  items: readonly BreadcrumbItem[];
  ariaLabel?: string;
  separator?: ReactNode;
  renderItem?: (state: BreadcrumbRenderState) => ReactNode;
}

/** Compact route hierarchy with native breadcrumb semantics and local overflow handling.
 * 紧凑的路径层级导航，保留原生 breadcrumb 语义与局部截断策略。 */
export function UiBreadcrumb({
  items,
  ariaLabel = 'Breadcrumb',
  separator = '›',
  renderItem,
  className,
  ...rest
}: UiBreadcrumbProps) {
  const explicitCurrentIndex = items.findIndex((item) => item.current === true);

  return (
    <nav {...rest} aria-label={ariaLabel} className={mergeClassNames('ui-breadcrumb', className)}>
      <ol className="ui-breadcrumb__list">
        {items.map((item, index) => {
          const current =
            explicitCurrentIndex >= 0 ? index === explicitCurrentIndex : index === items.length - 1;
          const content =
            renderItem?.({ item, index, current }) ??
            (current ? (
              <span className="ui-breadcrumb__current" aria-current="page" title={item.label}>
                {item.label}
              </span>
            ) : item.href !== undefined ? (
              <a className="ui-breadcrumb__link" href={item.href} title={item.label}>
                {item.label}
              </a>
            ) : (
              <span className="ui-breadcrumb__label" title={item.label}>
                {item.label}
              </span>
            ));

          return (
            <li
              className="ui-breadcrumb__item"
              key={item.id ?? `${item.href ?? item.label}-${index}`}
            >
              {index > 0 ? (
                <span className="ui-breadcrumb__separator" aria-hidden="true">
                  {separator}
                </span>
              ) : null}
              {content}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface UiSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'aside' | 'nav' | 'header' | 'footer';
  surface?: SurfacePreset;
  glassNesting?: 'inherit' | 'local';
  contentOverflow?: 'clip' | 'visible';
}

export function UiSurface({
  as = 'div',
  surface = 'none',
  glassNesting = 'local',
  contentOverflow = 'clip',
  className,
  children,
  ...rest
}: UiSurfaceProps) {
  return createElement(
    as,
    {
      ...rest,
      className: mergeClassNames('ui-surface', surfaceClasses[surface], className),
      'data-surface': surface,
      'data-neoverse-glass-nesting': glassNesting,
      'data-neoverse-surface-overflow': contentOverflow,
    },
    children,
  );
}

export type UiCardProps<T extends ElementType = 'div'> = {
  as?: T;
  surface?: SurfacePreset;
  className?: string;
} & Omit<ComponentPropsWithRef<T>, 'as' | 'className' | 'surface'>;

/** Surface-backed card geometry with a consumer-owned native or routed root.
 * 复用 Surface 表面的卡片几何，根节点由消费端保留原生或路由语义。 */
export function UiCard<T extends ElementType = 'div'>(props: UiCardProps<T>) {
  const { as, surface = 'glass-elevated', className, ...rest } = props;

  return createElement(as ?? 'div', {
    ...rest,
    className: mergeClassNames('ui-card', surfaceClasses[surface], className),
    'data-surface': surface,
  });
}

export interface UiInputProps extends ComponentPropsWithRef<'input'> {
  validation?: FormControlValidation;
}

export function UiInput({
  validation = 'none',
  className,
  onPointerDown,
  onBlur,
  'aria-invalid': ariaInvalid,
  ...props
}: UiInputProps) {
  return (
    <input
      {...props}
      className={['ui-input', className].filter(Boolean).join(' ')}
      data-validation={validation}
      aria-invalid={ariaInvalid ?? (validation === 'error' || undefined)}
      onPointerDown={(event) => {
        event.currentTarget.dataset.neoverseFocusOrigin = 'pointer';
        onPointerDown?.(event);
      }}
      onBlur={(event) => {
        delete event.currentTarget.dataset.neoverseFocusOrigin;
        onBlur?.(event);
      }}
    />
  );
}

export interface UiTextareaProps extends ComponentPropsWithRef<'textarea'> {
  validation?: FormControlValidation;
}

export function UiTextarea({
  validation = 'none',
  className,
  onPointerDown,
  onBlur,
  'aria-invalid': ariaInvalid,
  ...props
}: UiTextareaProps) {
  return (
    <span className="ui-textarea-shell">
      <textarea
        {...props}
        className={['ui-textarea', className].filter(Boolean).join(' ')}
        data-validation={validation}
        aria-invalid={ariaInvalid ?? (validation === 'error' || undefined)}
        onPointerDown={(event) => {
          event.currentTarget.dataset.neoverseFocusOrigin = 'pointer';
          onPointerDown?.(event);
        }}
        onBlur={(event) => {
          delete event.currentTarget.dataset.neoverseFocusOrigin;
          onBlur?.(event);
        }}
      />
    </span>
  );
}

export type FormControlValue = string | number;

function selectOverlayOptions(details: HTMLDetailsElement): AnchoredOverlayOptions | undefined {
  const popover = details.querySelector<HTMLElement>('.ui-select__popover');
  const trigger = details.querySelector<HTMLElement>('.ui-select');
  if (popover === null || trigger === null) return undefined;

  return {
    trigger,
    overlay: popover,
    gapVariable: '--neoverse-select-popover-gap',
    leftVariable: '--neoverse-select-popover-left',
    topVariable: '--neoverse-select-popover-top',
    inlineSizeVariable: '--neoverse-select-popover-inline-size',
    matchTriggerWidth: true,
    fallbackOpenClass: 'ui-select__popover--fallback-open',
    onDismiss: () => {
      details.open = false;
    },
  };
}

function openSelectPopover(details: HTMLDetailsElement) {
  const options = selectOverlayOptions(details);
  if (options !== undefined) showAnchoredOverlay(options);
}

function closeSelectPopover(details: HTMLDetailsElement) {
  const options = selectOverlayOptions(details);
  if (options !== undefined) hideAnchoredOverlay(options);
}

export interface UiSelectOption {
  value: FormControlValue;
  label: ReactNode;
  disabled?: boolean;
}

export interface UiSelectProps
  extends Omit<ComponentPropsWithRef<'summary'>, 'children' | 'onChange'> {
  options: readonly UiSelectOption[];
  value?: FormControlValue;
  placeholder?: ReactNode;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  validation?: FormControlValidation;
  onValueChange?: (value: FormControlValue) => void;
}

export function UiSelect({
  options,
  value,
  placeholder,
  name,
  disabled = false,
  readOnly = false,
  validation = 'none',
  onValueChange,
  className,
  onClick,
  onPointerDown,
  onBlur,
  'aria-invalid': ariaInvalid,
  ...props
}: UiSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => String(option.value) === String(value ?? ''));

  const focusRelativeOption = (current: HTMLButtonElement, direction: 1 | -1) => {
    const optionElements = Array.from(
      current
        .closest('.ui-select__popover')
        ?.querySelectorAll<HTMLButtonElement>('.ui-select__option:not(:disabled)') ?? [],
    );
    if (optionElements.length === 0) return;
    const index = optionElements.indexOf(current);
    optionElements[(index + direction + optionElements.length) % optionElements.length]?.focus();
  };

  const onOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusRelativeOption(event.currentTarget, event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const optionElements = Array.from(
        event.currentTarget
          .closest('.ui-select__popover')
          ?.querySelectorAll<HTMLButtonElement>('.ui-select__option:not(:disabled)') ?? [],
      );
      (event.key === 'Home' ? optionElements[0] : optionElements.at(-1))?.focus();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      const details = event.currentTarget.closest('details');
      if (details !== null) {
        details.open = false;
        closeSelectPopover(details);
        details.querySelector<HTMLElement>('.ui-select')?.focus();
      }
      setOpen(false);
    }
  };

  return (
    <details
      className={[
        'ui-select-shell',
        disabled && 'ui-select-shell--disabled',
        readOnly && 'ui-select-shell--readonly',
      ]
        .filter(Boolean)
        .join(' ')}
      onToggle={(event) => {
        const details = event.currentTarget;
        if ((disabled || readOnly) && details.open) {
          details.open = false;
          setOpen(false);
          return;
        }
        setOpen(details.open);
        if (details.open) openSelectPopover(details);
        else closeSelectPopover(details);
      }}
    >
      <summary
        {...props}
        className={['ui-select', className].filter(Boolean).join(' ')}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled || readOnly || undefined}
        aria-invalid={ariaInvalid ?? (validation === 'error' || undefined)}
        data-validation={validation}
        onClick={(event) => {
          if (disabled || readOnly) event.preventDefault();
          onClick?.(event);
        }}
        onPointerDown={(event) => {
          event.currentTarget.dataset.neoverseFocusOrigin = 'pointer';
          onPointerDown?.(event);
        }}
        onBlur={(event) => {
          delete event.currentTarget.dataset.neoverseFocusOrigin;
          onBlur?.(event);
        }}
      >
        <span
          className={['ui-select__value', !selected && 'ui-select__value--placeholder']
            .filter(Boolean)
            .join(' ')}
        >
          {selected?.label ?? placeholder ?? ''}
        </span>
        <svg className="ui-select__indicator" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m5 12 4 4L19 6" />
        </svg>
      </summary>

      <div
        className="ui-select__popover nv-presence"
        role="listbox"
        popover="auto"
        data-neoverse-motion="pop"
        data-neoverse-motion-origin="top"
        onToggle={(event) => {
          const popover = event.currentTarget;
          if (isOverlayOpen(popover, 'ui-select__popover--fallback-open')) return;

          stopOverlayTracking(popover);
          const details = popover.closest('details');
          if (details?.open) details.open = false;
          setOpen(false);
        }}
      >
        {options.map((option) => {
          const selectedOption = String(option.value) === String(value ?? '');
          return (
            <button
              key={String(option.value)}
              className="ui-select__option"
              type="button"
              role="option"
              disabled={option.disabled}
              aria-selected={selectedOption}
              onPointerDown={(event) => {
                const trigger = event.currentTarget
                  .closest('details')
                  ?.querySelector<HTMLElement>('.ui-select');
                if (trigger) trigger.dataset.neoverseFocusOrigin = 'pointer';
              }}
              onClick={(event) => {
                if (option.disabled || disabled || readOnly) return;
                onValueChange?.(option.value);
                const details = event.currentTarget.closest('details');
                if (details) {
                  details.open = false;
                  closeSelectPopover(details);
                }
                setOpen(false);
                details?.querySelector<HTMLElement>('.ui-select')?.focus();
              }}
              onKeyDown={onOptionKeyDown}
            >
              <span>{option.label}</span>
              {selectedOption ? (
                <svg
                  className="ui-select__check nv-appear"
                  data-neoverse-motion="pop"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>

      {name ? <input type="hidden" name={name} value={value ?? ''} disabled={disabled} /> : null}
    </details>
  );
}

interface AnchoredOverlayControllerOptions {
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: OverlayPlacement;
  matchTriggerWidth?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function useAnchoredOverlayController({
  open,
  defaultOpen = false,
  disabled = false,
  placement = 'auto',
  matchTriggerWidth = false,
  onOpenChange,
}: AnchoredOverlayControllerOptions) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [syncRevision, setSyncRevision] = useState(0);
  const resolvedOpen = open ?? internalOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (open === undefined) setInternalOpen(value);
      else setSyncRevision((revision) => revision + 1);
      onOpenChange?.(value);
    },
    [open, onOpenChange],
  );

  const resolveOptions = useCallback((): AnchoredOverlayOptions | undefined => {
    const trigger = triggerRef.current;
    const overlay = panelRef.current;
    if (trigger === null || overlay === null) return undefined;

    return {
      trigger,
      overlay,
      gapVariable: '--neoverse-overlay-gap',
      leftVariable: '--neoverse-overlay-left',
      topVariable: '--neoverse-overlay-top',
      inlineSizeVariable: '--neoverse-overlay-inline-size',
      matchTriggerWidth,
      placement,
      fallbackOpenClass: 'ui-overlay-panel--fallback-open',
      onDismiss: () => setOpen(false),
    };
  }, [matchTriggerWidth, placement, setOpen]);

  useEffect(() => {
    // Controlled dismiss requests must resync even when the parent keeps open unchanged.
    void syncRevision;
    const options = resolveOptions();
    if (options === undefined) return;
    if (resolvedOpen && !disabled) showAnchoredOverlay(options);
    else hideAnchoredOverlay(options);
    return () => stopOverlayTracking(options.overlay);
  }, [resolvedOpen, disabled, resolveOptions, syncRevision]);

  const onPanelToggle = (event: React.SyntheticEvent<HTMLDivElement>) => {
    const panel = event.currentTarget;
    const newState = (event.nativeEvent as Event & { newState?: 'open' | 'closed' }).newState;
    if (newState === 'open' || isOverlayOpen(panel, 'ui-overlay-panel--fallback-open')) return;
    stopOverlayTracking(panel);
    if (resolvedOpen) setOpen(false);
  };

  return {
    triggerRef,
    panelRef,
    resolvedOpen,
    setOpen,
    toggle: () => {
      if (!disabled) setOpen(!resolvedOpen);
    },
    onPanelToggle,
  };
}

export interface UiPopoverProps extends Omit<ComponentPropsWithRef<'span'>, 'children' | 'ref'> {
  trigger: ReactNode;
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: OverlayPlacement;
  matchTriggerWidth?: boolean;
  ariaLabel?: string;
  onOpenChange?: (open: boolean) => void;
}

export function UiPopover({
  trigger,
  children,
  open,
  defaultOpen = false,
  disabled = false,
  placement = 'auto',
  matchTriggerWidth = false,
  ariaLabel,
  onOpenChange,
  className,
  ...props
}: UiPopoverProps) {
  const controller = useAnchoredOverlayController({
    ...(open === undefined ? {} : { open }),
    defaultOpen,
    disabled,
    placement,
    matchTriggerWidth,
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  });

  return (
    <span {...props} className={mergeClassNames('ui-popover', className)}>
      <button
        ref={controller.triggerRef}
        className="ui-popover__trigger ui-button ui-button--secondary ui-button--md"
        type="button"
        disabled={disabled}
        aria-expanded={controller.resolvedOpen}
        onClick={controller.toggle}
      >
        {trigger}
      </button>
      <div
        ref={controller.panelRef}
        className="ui-overlay-panel ui-popover__content material-glass-elevated nv-presence"
        popover="auto"
        role="dialog"
        aria-label={ariaLabel}
        data-neoverse-motion="pop"
        data-neoverse-motion-origin="top"
        onToggle={controller.onPanelToggle}
      >
        {children}
      </div>
    </span>
  );
}

export type UiDropdownMenuItemTone = 'default' | 'danger';

export interface UiDropdownMenuItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  tone?: UiDropdownMenuItemTone;
}

export interface UiDropdownMenuProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children' | 'ref' | 'onSelect'> {
  trigger: ReactNode;
  items: readonly UiDropdownMenuItem[];
  ariaLabel: string;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: OverlayPlacement;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (item: UiDropdownMenuItem) => void;
  renderItem?: (item: UiDropdownMenuItem) => ReactNode;
}

export function UiDropdownMenu({
  trigger,
  items,
  ariaLabel,
  open,
  defaultOpen = false,
  disabled = false,
  placement = 'auto',
  onOpenChange,
  onSelect,
  renderItem,
  className,
  ...props
}: UiDropdownMenuProps) {
  const controller = useAnchoredOverlayController({
    ...(open === undefined ? {} : { open }),
    defaultOpen,
    disabled,
    placement,
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  });

  const enabledItems = useCallback(
    () =>
      Array.from(
        controller.panelRef.current?.querySelectorAll<HTMLButtonElement>(
          '.ui-dropdown-menu__item:not(:disabled)',
        ) ?? [],
      ),
    [controller.panelRef],
  );

  useEffect(() => {
    if (!controller.resolvedOpen) return;
    requestAnimationFrame(() => enabledItems()[0]?.focus());
  }, [controller.resolvedOpen, enabledItems]);

  const selectItem = (item: UiDropdownMenuItem) => {
    if (item.disabled) return;
    onSelect?.(item);
    controller.setOpen(false);
    requestAnimationFrame(() => controller.triggerRef.current?.focus());
  };

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const current = event.target;
    if (!(current instanceof HTMLButtonElement)) return;
    const menuItems = enabledItems();

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const index = menuItems.indexOf(current);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      menuItems[(index + direction + menuItems.length) % menuItems.length]?.focus();
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      (event.key === 'Home' ? menuItems[0] : menuItems.at(-1))?.focus();
    }
  };

  return (
    <span {...props} className={mergeClassNames('ui-dropdown-menu', className)}>
      <button
        ref={controller.triggerRef}
        className="ui-dropdown-menu__trigger ui-button ui-button--secondary ui-button--md"
        type="button"
        aria-haspopup="menu"
        aria-expanded={controller.resolvedOpen}
        disabled={disabled}
        onClick={controller.toggle}
      >
        {trigger}
      </button>
      <div
        ref={controller.panelRef}
        className="ui-overlay-panel ui-dropdown-menu__panel material-glass-elevated nv-presence"
        popover="auto"
        role="menu"
        aria-label={ariaLabel}
        data-neoverse-motion="pop"
        data-neoverse-motion-origin="top"
        onToggle={controller.onPanelToggle}
        onKeyDown={onMenuKeyDown}
      >
        {items.map((item) => (
          <button
            key={item.id}
            className="ui-dropdown-menu__item"
            type="button"
            role="menuitem"
            disabled={item.disabled}
            data-tone={item.tone ?? 'default'}
            onClick={() => selectItem(item)}
          >
            {renderItem?.(item) ?? item.label}
          </button>
        ))}
      </div>
    </span>
  );
}

export interface UiCheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> {
  validation?: FormControlValidation;
  children?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
}

export function UiCheckbox({
  validation = 'none',
  readOnly = false,
  disabled = false,
  className,
  children,
  onClick,
  onChange,
  onCheckedChange,
  'aria-invalid': ariaInvalid,
  ...props
}: UiCheckboxProps) {
  return (
    <label
      className={mergeClassNames('ui-choice ui-checkbox', className)}
      data-validation={validation}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
    >
      <input
        {...props}
        className="ui-choice__native"
        type="checkbox"
        disabled={disabled}
        aria-disabled={disabled || readOnly || undefined}
        aria-invalid={ariaInvalid ?? (validation === 'error' || undefined)}
        onClick={(event) => {
          if (readOnly) event.preventDefault();
          onClick?.(event);
        }}
        onChange={(event) => {
          if (readOnly) return;
          onChange?.(event);
          onCheckedChange?.(event.currentTarget.checked);
        }}
      />
      <span className="ui-choice__control" aria-hidden="true">
        <svg className="ui-choice__indicator" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m5 12 4 4L19 6" />
        </svg>
      </span>
      <span className="ui-choice__content">{children}</span>
    </label>
  );
}

export interface UiRadioGroupOption {
  value: FormControlValue;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface UiRadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: readonly UiRadioGroupOption[];
  value?: FormControlValue;
  defaultValue?: FormControlValue;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  validation?: FormControlValidation;
  onValueChange?: (value: FormControlValue) => void;
}

export function UiRadioGroup({
  options,
  value,
  defaultValue,
  name,
  disabled = false,
  readOnly = false,
  validation = 'none',
  onValueChange,
  className,
  'aria-invalid': ariaInvalid,
  ...props
}: UiRadioGroupProps) {
  const resolvedAriaInvalid = ariaInvalid ?? (validation === 'error' || undefined);

  return (
    <div
      {...props}
      className={mergeClassNames('ui-radio-group', className)}
      role="radiogroup"
      aria-disabled={disabled || readOnly || undefined}
      aria-invalid={resolvedAriaInvalid}
      data-validation={validation}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
    >
      {options.map((option) => {
        const selected = value !== undefined && String(option.value) === String(value);
        const defaultSelected =
          value === undefined &&
          defaultValue !== undefined &&
          String(option.value) === String(defaultValue);
        const optionDisabled = disabled || option.disabled === true;

        return (
          <label
            key={String(option.value)}
            className="ui-choice ui-radio"
            data-disabled={optionDisabled || undefined}
            data-readonly={readOnly || undefined}
          >
            <input
              className="ui-choice__native"
              type="radio"
              name={name}
              value={option.value}
              checked={value === undefined ? undefined : selected}
              defaultChecked={defaultSelected}
              disabled={optionDisabled}
              aria-disabled={optionDisabled || readOnly || undefined}
              aria-invalid={resolvedAriaInvalid}
              onClick={(event) => {
                if (readOnly) event.preventDefault();
              }}
              onChange={(event) => {
                if (readOnly || !event.currentTarget.checked) return;
                onValueChange?.(option.value);
              }}
            />
            <span className="ui-choice__control" aria-hidden="true">
              <span className="ui-choice__indicator" />
            </span>
            <span className="ui-choice__content">
              <span className="ui-choice__label">{option.label}</span>
              {option.description !== undefined && option.description !== null ? (
                <span className="ui-choice__description">{option.description}</span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export interface UiSwitchProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> {
  validation?: FormControlValidation;
  children?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
}

export function UiSwitch({
  validation = 'none',
  readOnly = false,
  disabled = false,
  className,
  children,
  onClick,
  onChange,
  onCheckedChange,
  'aria-invalid': ariaInvalid,
  ...props
}: UiSwitchProps) {
  return (
    <label
      className={mergeClassNames('ui-choice ui-switch', className)}
      data-validation={validation}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
    >
      <input
        {...props}
        className="ui-choice__native ui-switch__native"
        type="checkbox"
        // biome-ignore lint/a11y/useAriaPropsForRole: WAI-ARIA Switch pattern uses native checkbox checked state instead of aria-checked.
        role="switch"
        disabled={disabled}
        aria-disabled={disabled || readOnly || undefined}
        aria-invalid={ariaInvalid ?? (validation === 'error' || undefined)}
        onClick={(event) => {
          if (readOnly) event.preventDefault();
          onClick?.(event);
        }}
        onChange={(event) => {
          if (readOnly) return;
          onChange?.(event);
          onCheckedChange?.(event.currentTarget.checked);
        }}
      />
      <span className="ui-choice__control ui-switch__control" aria-hidden="true">
        <span className="ui-switch__thumb" />
      </span>
      <span className="ui-choice__content">{children}</span>
    </label>
  );
}

export interface UiFieldControlAttrs {
  id?: string;
  'aria-describedby'?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface UiFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  controlId?: string;
  descriptionId?: string;
  messageId?: string;
  label?: ReactNode;
  description?: ReactNode;
  message?: ReactNode;
  validation?: FormControlValidation;
  required?: boolean;
  disabled?: boolean;
  children?: ReactNode | ((controlAttrs: UiFieldControlAttrs) => ReactNode);
}

export function UiField({
  controlId,
  descriptionId,
  messageId,
  label,
  description,
  message,
  validation = 'none',
  required = false,
  disabled = false,
  className,
  children,
  ...props
}: UiFieldProps) {
  const generatedId = useId();
  const hasDescription =
    description !== undefined &&
    description !== null &&
    description !== false &&
    description !== '';
  const hasMessage =
    message !== undefined && message !== null && message !== false && message !== '';
  const resolvedDescriptionId = descriptionId ?? `${controlId ?? generatedId}-description`;
  const resolvedMessageId = messageId ?? `${controlId ?? generatedId}-message`;
  const describedBy = [
    hasDescription ? resolvedDescriptionId : undefined,
    hasMessage ? resolvedMessageId : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  const controlAttrs: UiFieldControlAttrs = {
    ...(controlId ? { id: controlId } : {}),
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(required ? { required: true } : {}),
    ...(disabled ? { disabled: true } : {}),
  };
  return (
    <div
      {...props}
      className={mergeClassNames('ui-field', className)}
      data-validation={validation}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      {(label !== undefined && label !== null) || required ? (
        <div className="ui-field__label-row">
          {createElement(
            controlId ? 'label' : 'span',
            {
              className: 'ui-field__label',
              ...(controlId ? { htmlFor: controlId } : {}),
            },
            label,
          )}
          {required ? (
            <span className="ui-field__required" aria-hidden="true">
              *
            </span>
          ) : null}
        </div>
      ) : null}
      {hasDescription ? (
        <p id={resolvedDescriptionId} className="ui-field__description">
          {description}
        </p>
      ) : null}
      <div className="ui-field__control">
        {typeof children === 'function' ? children(controlAttrs) : children}
      </div>
      {hasMessage ? (
        <p id={resolvedMessageId} className="ui-field__message">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export interface UiTableProps extends Omit<ComponentPropsWithRef<'table'>, 'children'> {
  caption?: ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  children?: ReactNode;
}

/** Native table semantics with a shared inset data surface and local horizontal overflow. */
export function UiTable({
  caption,
  striped = true,
  hoverable = true,
  className,
  children,
  ...rest
}: UiTableProps) {
  return (
    <div className="ui-table-region" data-ui-table-region="">
      <table
        {...rest}
        className={mergeClassNames(
          'ui-table',
          striped && 'ui-table--striped',
          hoverable && 'ui-table--hoverable',
          className,
        )}
      >
        {caption !== undefined && caption !== null ? (
          <caption className="ui-table__caption">{caption}</caption>
        ) : null}
        {children}
      </table>
    </div>
  );
}

export interface UiDisclosureProps extends Omit<ComponentPropsWithRef<'details'>, 'children'> {
  summary: ReactNode;
  children?: ReactNode;
}

/** Native details/summary semantics with the shared inset progressive-disclosure material. */
export function UiDisclosure({ summary, className, children, ...rest }: UiDisclosureProps) {
  return (
    <details {...rest} className={mergeClassNames('ui-disclosure', className)}>
      <summary className="ui-disclosure__summary">{summary}</summary>
      <div className="ui-disclosure__content">{children}</div>
    </details>
  );
}

export interface UiNoticeProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'aside' | 'section';
  variant?: NoticeVariant;
  action?: ReactNode;
}

/** Status callout surface shared by Vue and React consumers.
 * Vue 与 React 消费端共用的状态提示容器。 */
export function UiNotice({
  as = 'div',
  variant = 'neutral',
  action,
  className,
  children,
  ...rest
}: UiNoticeProps) {
  return createElement(
    as,
    {
      ...rest,
      className: mergeClassNames('ui-notice', `ui-notice--${variant}`, className),
    },
    createElement('div', { className: 'ui-notice__content' }, children),
    action !== undefined && action !== null
      ? createElement('div', { className: 'ui-notice__action' }, action)
      : null,
  );
}
export interface UiButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  size?: ActionSize;
  loading?: boolean;
  stretch?: boolean;
  surface?: ControlSurfacePreset;
  leading?: ReactNode;
  trailing?: ReactNode;
}

/** Native React 19 ref and attributes stay on the button, including form semantics.
 * 原生 ref 和属性保留在按钮上；loading 使用原生 disabled 阻止重复操作。 */
export function UiButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  stretch = false,
  surface = 'glass-subtle',
  type = 'button',
  leading,
  trailing,
  children,
  className,
  onPointerDown,
  ...rest
}: UiButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? true : rest['aria-busy']}
      data-surface={surface}
      className={mergeClassNames(
        'ui-button',
        buttonVariantClasses[variant],
        stretch ? buttonStretchSizeClasses[size] : buttonSizeClasses[size],
        surfaceClasses[surface],
        className,
      )}
      onPointerDown={(event) => {
        updateButtonPointerGlow(event);
        onPointerDown?.(event);
      }}
    >
      <span className="ui-button__tone-field" aria-hidden="true" />
      <span className="ui-button__edge-field" aria-hidden="true" />
      {leading || loading ? (
        <span className="ui-button__leading">
          {loading && leading ? (
            <span className="ui-button__leading-placeholder" aria-hidden="true">
              {leading}
            </span>
          ) : null}
          {loading && (
            <span
              className="ui-button__spinner nv-appear"
              data-neoverse-motion="pop"
              aria-hidden="true"
            >
              <svg
                className={loadingIndicatorClass}
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
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
            </span>
          )}
          {!loading ? leading : null}
        </span>
      ) : null}
      <span className="ui-button__content">{children}</span>
      {trailing ? <span className="ui-button__trailing">{trailing}</span> : null}
    </button>
  );
}

interface UiIconButtonSharedProps {
  label: string;
  variant?: ButtonVariant;
  size?: ActionSize;
  disabled?: boolean;
  loading?: boolean;
  stretch?: boolean;
  surface?: ControlSurfacePreset;
  children: ReactNode;
}

export type UiIconButtonProps =
  | (UiIconButtonSharedProps &
      Omit<
        ComponentPropsWithRef<'button'>,
        'aria-label' | 'children' | 'disabled' | 'size' | 'type'
      > & {
        as?: 'button';
        type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
      })
  | (UiIconButtonSharedProps &
      Omit<ComponentPropsWithRef<'a'>, 'aria-label' | 'children' | 'href' | 'size'> & {
        as: 'a';
        href?: string;
        type?: never;
      });

/** Accessible icon-only button or link using the same control and Surface contract.
 * 复用共享控件与 Surface 契约的无障碍纯图标按钮或链接。 */
export function UiIconButton(props: UiIconButtonProps) {
  const {
    as = 'button',
    label,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    stretch = false,
    surface = 'glass-subtle',
    type = 'button',
    children,
    className,
    ref,
    ...rest
  } = props;
  const href = 'href' in props ? props.href : undefined;
  const isDisabled = disabled || loading;
  const classes = mergeClassNames(
    'ui-button ui-icon-button',
    buttonVariantClasses[variant],
    stretch ? iconButtonStretchSizeClasses[size] : iconButtonSizeClasses[size],
    surfaceClasses[surface],
    className,
  );
  const ariaBusy = loading ? true : rest['aria-busy'];
  const icon = loading ? (
    <svg
      className={`${loadingIndicatorClass} nv-appear`}
      data-neoverse-motion="pop"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
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
  ) : (
    children
  );
  const content = (
    <>
      <span className="ui-button__tone-field" aria-hidden="true" />
      <span className="ui-button__edge-field" aria-hidden="true" />
      <span className="ui-icon-button__content" aria-hidden="true">
        {icon}
      </span>
    </>
  );

  if (as === 'a') {
    const anchorProps = rest as Omit<
      ComponentPropsWithRef<'a'>,
      'aria-label' | 'children' | 'href' | 'size'
    >;
    const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
      if (isDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      anchorProps.onClick?.(event);
    };

    return (
      <a
        {...anchorProps}
        ref={ref as Ref<HTMLAnchorElement>}
        href={isDisabled ? undefined : href}
        aria-label={label}
        aria-disabled={isDisabled || undefined}
        aria-busy={ariaBusy}
        tabIndex={isDisabled ? -1 : anchorProps.tabIndex}
        data-surface={surface}
        className={classes}
        onPointerDown={(event) => {
          if (!isDisabled) updateButtonPointerGlow(event);
          anchorProps.onPointerDown?.(event);
        }}
        onClick={handleClick}
      >
        {content}
      </a>
    );
  }

  const buttonProps = rest as Omit<
    ComponentPropsWithRef<'button'>,
    'aria-label' | 'children' | 'disabled' | 'size' | 'type'
  >;

  return (
    <button
      {...buttonProps}
      ref={ref as Ref<HTMLButtonElement>}
      type={type}
      disabled={isDisabled}
      aria-label={label}
      aria-busy={ariaBusy}
      data-surface={surface}
      className={classes}
      onPointerDown={(event) => {
        if (!isDisabled) updateButtonPointerGlow(event);
        buttonProps.onPointerDown?.(event);
      }}
    >
      {content}
    </button>
  );
}
