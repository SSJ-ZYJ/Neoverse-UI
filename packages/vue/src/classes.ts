/*
 * Component geometry belongs to the component stylesheet.  These class maps
 * intentionally expose semantic selectors rather than Tailwind utilities so
 * consumers do not need to scan, preserve, or override our internal size and
 * state implementation.
 */
export const buttonBaseClasses = 'ui-button';

export const buttonVariantClasses = {
  primary: 'ui-button--primary',
  secondary: 'ui-button--secondary',
  ghost: 'ui-button--ghost',
} as const;

export const buttonSizeClasses = {
  sm: 'ui-button--sm',
  md: 'ui-button--md',
  lg: 'ui-button--lg',
} as const;
export const actionSizeClasses = {
  sm: 'ui-action--sm',
  md: 'ui-action--md',
  lg: 'ui-action--lg',
} as const;

export const actionScaleClasses = {
  md: 'ui-action--scale-md',
  lg: 'ui-action--scale-lg',
} as const;

export const actionStretchClasses = 'ui-action--stretch';

export const iconButtonSizeClasses = {
  sm: 'ui-icon-button--sm',
  md: 'ui-icon-button--md',
  lg: 'ui-icon-button--lg',
} as const;

export const buttonStretchSizeClasses = {
  sm: 'ui-button--sm ui-button--stretch',
  md: 'ui-button--md ui-button--stretch',
  lg: 'ui-button--lg ui-button--stretch',
} as const;

export const iconButtonStretchSizeClasses = {
  sm: 'ui-icon-button--sm ui-icon-button--stretch',
  md: 'ui-icon-button--md ui-icon-button--stretch',
  lg: 'ui-icon-button--lg ui-icon-button--stretch',
} as const;
