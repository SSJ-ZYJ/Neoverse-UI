export const controlTransitionClasses = 'transition duration-fast ease-standard';
export const segmentedTransitionClasses = 'transition-colors duration-standard ease-emphasized';

export const controlFocusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2';

export const disabledControlClasses =
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';

export const buttonBaseClasses =
  'inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 rounded-control font-label';

export const buttonVariantClasses = {
  primary: 'ui-button--primary',
  secondary: 'ui-button--secondary',
  ghost: 'ui-button--ghost',
} as const;

export const buttonSizeClasses = {
  sm: 'h-7 px-3 text-caption',
  md: 'h-10 px-3 text-label',
  lg: 'h-11 px-4 text-label',
} as const;

export const iconButtonSizeClasses = {
  sm: 'size-7',
  md: 'size-10',
  lg: 'size-11',
} as const;

export const loadingIndicatorClasses =
  'size-4 motion-safe:animate-spin motion-reduce:animate-none rounded-pill border-2 border-current border-t-transparent';
