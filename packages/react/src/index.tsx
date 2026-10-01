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
  | 'glass-card'
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
  'glass-card': 'material-glass-card',
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
  const { as, surface = 'glass-card', className, ...rest } = props;

  return createElement(as ?? 'div', {
    ...rest,
    className: mergeClassNames('ui-card', surfaceClasses[surface], className),
    'data-surface': surface,
  });
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
