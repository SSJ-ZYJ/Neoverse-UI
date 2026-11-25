export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/** Shared button variant classes; the overlay triggers reuse the same mapping. */
export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'ui-button--primary',
  secondary: 'ui-button--secondary',
  ghost: 'ui-button--ghost',
};
