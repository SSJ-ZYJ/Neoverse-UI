import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  Children,
  cloneElement,
  createElement,
  type HTMLAttributes,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ActionSize = 'sm' | 'md' | 'lg';
export type ActionScale = 'md' | 'lg';
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
      <span className="ui-action__content min-w-0">{content}</span>
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
    return cloneElement(child as ReactElement<SlottableElementProps>, {
      ...rest,
      className: mergeClassNames(classes, childProps.className),
      href: disabled ? undefined : childProps.href,
      tabIndex: disabled ? -1 : childProps.tabIndex,
      'aria-disabled': disabled || undefined,
      'data-surface': surface,
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
    >
      {renderContent(children)}
    </a>
  );
}

export interface UiSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'aside' | 'nav' | 'header' | 'footer';
  surface?: SurfacePreset;
}

export function UiSurface({
  as = 'div',
  surface = 'none',
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
    },
    children,
  );
}
