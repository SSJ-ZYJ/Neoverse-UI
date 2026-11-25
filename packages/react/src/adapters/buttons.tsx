import type {
  ButtonHTMLAttributes,
  ComponentPropsWithRef,
  MouseEventHandler,
  ReactNode,
  Ref,
} from 'react';
import { type ButtonVariant, buttonVariantClasses, mergeClassNames } from '../internal.js';
import { surfaceClasses } from '../surface.js';
import {
  type ActionSize,
  ButtonMaterialShell,
  buttonSizeClasses,
  buttonStretchSizeClasses,
  type ControlSurfacePreset,
  iconButtonSizeClasses,
  iconButtonStretchSizeClasses,
  loadingIndicatorClass,
} from './shared.js';

export interface UiButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  size?: ActionSize;
  loading?: boolean;
  stretch?: boolean;
  surface?: ControlSurfacePreset;
  leading?: ReactNode;
  trailing?: ReactNode;
}

/** Native React 19 refs and attributes stay on the button, including form semantics.
 * `loading` uses the native disabled state to block repeat activation. */
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
    >
      <ButtonMaterialShell />
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

/** Accessible icon-only button or link that reuses the shared control and surface contract. */
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
      <ButtonMaterialShell />
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
    >
      {content}
    </button>
  );
}
