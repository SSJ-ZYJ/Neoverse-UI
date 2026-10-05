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
} from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type NoticeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ActionSize = 'sm' | 'md' | 'lg';
export type ActionScale = 'md' | 'lg';
export type ControlSurfaceScale = 'md' | 'lg';
export type SurfaceHoverMode = 'auto' | 'static';
export type SurfaceEdgeMode = 'auto' | 'local';
export type ControlSurfacePreset = 'none' | 'glass-subtle';
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

export type UiInputProps = ComponentPropsWithRef<'input'>;

export function UiInput({ className, onPointerDown, onBlur, ...props }: UiInputProps) {
  return (
    <input
      {...props}
      className={['ui-input', className].filter(Boolean).join(' ')}
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

export type UiTextareaProps = ComponentPropsWithRef<'textarea'>;

export function UiTextarea({ className, onPointerDown, onBlur, ...props }: UiTextareaProps) {
  return (
    <span className="ui-textarea-shell">
      <textarea
        {...props}
        className={['ui-textarea', className].filter(Boolean).join(' ')}
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

const selectPopoverCleanup = new WeakMap<HTMLElement, () => void>();

function supportsSelectPopover(element: HTMLElement): boolean {
  return typeof element.showPopover === 'function' && typeof element.hidePopover === 'function';
}

function isSelectPopoverOpen(element: HTMLElement): boolean {
  if (!supportsSelectPopover(element)) {
    return element.classList.contains('ui-select__popover--fallback-open');
  }
  return element.matches(':popover-open');
}

function stopSelectPopoverTracking(popover: HTMLElement) {
  selectPopoverCleanup.get(popover)?.();
  selectPopoverCleanup.delete(popover);
}

function resolveSelectCssLength(element: HTMLElement, value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;

  const normalized = value.trim().toLowerCase();
  if (normalized.endsWith('rem')) {
    return parsed * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  if (normalized.endsWith('em')) {
    return parsed * Number.parseFloat(getComputedStyle(element).fontSize);
  }
  return parsed;
}

function resolveSelectEffectiveZoom(element: HTMLElement): number {
  let zoom = 1;
  let node: HTMLElement | null = element;
  while (node !== null) {
    const value = Number.parseFloat(getComputedStyle(node).zoom);
    if (Number.isFinite(value) && value > 0) zoom *= value;
    node = node.parentElement;
  }
  return zoom;
}

function positionSelectPopover(details: HTMLDetailsElement, popover: HTMLElement) {
  const trigger = details.querySelector<HTMLElement>('.ui-select');
  if (trigger === null || !details.open || !isSelectPopoverOpen(popover)) return;

  const triggerRect = trigger.getBoundingClientRect();
  const popoverStyle = getComputedStyle(popover);
  const effectiveZoom = resolveSelectEffectiveZoom(popover);
  const gap =
    Math.max(
      0,
      resolveSelectCssLength(
        popover,
        popoverStyle.getPropertyValue('--neoverse-select-popover-gap'),
      ),
    ) * effectiveZoom;

  popover.style.setProperty(
    '--neoverse-select-popover-inline-size',
    `${triggerRect.width / effectiveZoom}px`,
  );

  const popoverRect = popover.getBoundingClientRect();
  const maxLeft = Math.max(gap, window.innerWidth - popoverRect.width - gap);
  const left = Math.min(Math.max(triggerRect.left, gap), maxLeft);
  const spaceBelow = window.innerHeight - triggerRect.bottom - gap;
  const spaceAbove = triggerRect.top - gap;
  const shouldOpenAbove = popoverRect.height > spaceBelow && spaceAbove >= popoverRect.height;
  const unclampedTop = shouldOpenAbove
    ? triggerRect.top - popoverRect.height - gap
    : triggerRect.bottom + gap;
  const maxTop = Math.max(gap, window.innerHeight - popoverRect.height - gap);
  const top = Math.min(Math.max(unclampedTop, gap), maxTop);

  popover.style.setProperty('--neoverse-select-popover-left', `${left / effectiveZoom}px`);
  popover.style.setProperty('--neoverse-select-popover-top', `${top / effectiveZoom}px`);
}

function openSelectPopover(details: HTMLDetailsElement) {
  const popover = details.querySelector<HTMLElement>('.ui-select__popover');
  if (popover === null) return;

  if (supportsSelectPopover(popover)) {
    if (!popover.matches(':popover-open')) popover.showPopover();
  } else {
    popover.classList.add('ui-select__popover--fallback-open');
  }

  positionSelectPopover(details, popover);
  stopSelectPopoverTracking(popover);
  const update = () => positionSelectPopover(details, popover);
  window.addEventListener('resize', update);
  window.addEventListener('scroll', update, true);
  selectPopoverCleanup.set(popover, () => {
    window.removeEventListener('resize', update);
    window.removeEventListener('scroll', update, true);
  });
}

function closeSelectPopover(details: HTMLDetailsElement) {
  const popover = details.querySelector<HTMLElement>('.ui-select__popover');
  if (popover === null) return;

  if (supportsSelectPopover(popover)) {
    if (popover.matches(':popover-open')) popover.hidePopover();
  } else {
    popover.classList.remove('ui-select__popover--fallback-open');
  }
  stopSelectPopoverTracking(popover);
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
  onValueChange?: (value: FormControlValue) => void;
}

export function UiSelect({
  options,
  value,
  placeholder,
  name,
  disabled = false,
  onValueChange,
  className,
  onClick,
  onPointerDown,
  onBlur,
  ...props
}: UiSelectProps) {
  const selected = options.find((option) => String(option.value) === String(value ?? ''));

  return (
    <details
      className={['ui-select-shell', disabled && 'ui-select-shell--disabled']
        .filter(Boolean)
        .join(' ')}
      onToggle={(event) => {
        const details = event.currentTarget;
        if (disabled && details.open) {
          details.open = false;
          return;
        }
        if (details.open) openSelectPopover(details);
        else closeSelectPopover(details);
      }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: summary is the native interactive trigger for details. */}
      <summary
        {...props}
        className={['ui-select', className].filter(Boolean).join(' ')}
        aria-haspopup="listbox"
        aria-disabled={disabled || undefined}
        onClick={(event) => {
          if (disabled) event.preventDefault();
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
        className="ui-select__popover"
        role="listbox"
        popover="auto"
        onToggle={(event) => {
          const popover = event.currentTarget;
          if (isSelectPopoverOpen(popover)) return;

          stopSelectPopoverTracking(popover);
          const details = popover.closest('details');
          if (details?.open) details.open = false;
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
                if (option.disabled || disabled) return;
                onValueChange?.(option.value);
                const details = event.currentTarget.closest('details');
                if (details) {
                  details.open = false;
                  closeSelectPopover(details);
                }
                details?.querySelector<HTMLElement>('.ui-select')?.focus();
              }}
            >
              <span>{option.label}</span>
              {selectedOption ? (
                <svg className="ui-select__check" viewBox="0 0 24 24" aria-hidden="true">
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
      <span className="ui-button__edge-field" aria-hidden="true" />
      {leading || loading ? (
        <span className="ui-button__leading">
          {loading && leading ? (
            <span className="ui-button__leading-placeholder" aria-hidden="true">
              {leading}
            </span>
          ) : null}
          {loading && (
            <span className="ui-button__spinner" aria-hidden="true">
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
    <svg className={loadingIndicatorClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
