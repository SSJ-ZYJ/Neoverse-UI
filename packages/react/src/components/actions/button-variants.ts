import type { ActionSize } from './action-size.js';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'warning'
  | 'accent';

/** Shared button variant classes; the overlay triggers reuse the same mapping. */
export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'ui-button--primary',
  secondary: 'ui-button--secondary',
  ghost: 'ui-button--ghost',
  danger: 'ui-button--danger',
  success: 'ui-button--success',
  warning: 'ui-button--warning',
  accent: 'ui-button--accent',
};

/** Shared button size classes reused by UiButton and overlay triggers. */
export const buttonSizeClasses: Record<ActionSize, string> = {
  sm: 'ui-button--sm',
  md: 'ui-button--md',
  lg: 'ui-button--lg',
};
