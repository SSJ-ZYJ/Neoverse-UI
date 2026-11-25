export const toastCssVariables = {
  width: '--neoverse-toast-width',
  bottom: '--neoverse-toast-bottom',
  padding: '--neoverse-toast-padding',
  accent: '--neoverse-toast-accent',
  background: '--neoverse-toast-background',
  foreground: '--neoverse-toast-foreground',
} as const;

export type ToastToken = keyof typeof toastCssVariables;
