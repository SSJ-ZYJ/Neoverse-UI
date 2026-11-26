import { type ControlSurfacePreset, getSurfaceClass } from '@neoverse-ui/tokens';
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  Children,
  cloneElement,
  type HTMLAttributes,
  isValidElement,
  type MouseEventHandler,
  type PointerEventHandler,
  type ReactElement,
  type ReactNode,
} from 'react';
import { mergeClassNames } from '../../internal.js';
import type { ActionSize } from './action-size.js';
import { type ButtonVariant, buttonVariantClasses } from './button-variants.js';

export type ActionScale = 'md' | 'lg';

const actionSizeClasses: Record<ActionSize, string> = {
  sm: 'ui-action--sm',
  md: 'ui-action--md',
  lg: 'ui-action--lg',
};

const actionScaleClasses: Record<ActionScale, string> = {
  md: 'ui-action--scale-md',
  lg: 'ui-action--scale-lg',
};

const actionBaseClasses = 'ui-button ui-action';

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
  surface = 'auto',
  className,
}: ActionClassNameOptions = {}): string {
  return mergeClassNames(
    actionBaseClasses,
    getSurfaceClass(surface, 'control'),
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
  decoration?: ReactNode;
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
  surface = 'auto',
  type = 'button',
  leading,
  trailing,
  decoration,
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
      {decoration}
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
        onPointerDown={onPointerDown}
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
      onPointerDown={onPointerDown}
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
