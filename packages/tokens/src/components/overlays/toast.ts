export const toastCssVariables = {
  width: '--neoverse-toast-width',
  bottom: '--neoverse-toast-bottom',
  padding: '--neoverse-toast-padding',
  accent: '--neoverse-toast-accent',
  background: '--neoverse-toast-background',
  foreground: '--neoverse-toast-foreground',
  dismissSize: '--neoverse-toast-dismiss-size',
  dismissIconSize: '--neoverse-toast-dismiss-icon-size',
  dismissBackground: '--neoverse-toast-dismiss-background',
  dismissBorder: '--neoverse-toast-dismiss-border',
  dismissShadow: '--neoverse-toast-dismiss-shadow',
  dismissForeground: '--neoverse-toast-dismiss-foreground',
} as const;

export type ToastToken = keyof typeof toastCssVariables;
