export const actionCssVariables = {
  gap: '--neoverse-action-gap',
  height: {
    sm: '--neoverse-action-height-sm',
    md: '--neoverse-action-height-md',
    lg: '--neoverse-action-height-lg',
  },
  paddingInline: {
    sm: '--neoverse-action-padding-inline-sm',
    md: '--neoverse-action-padding-inline-md',
    lg: '--neoverse-action-padding-inline-lg',
  },
  fontSize: {
    sm: '--neoverse-action-font-size-sm',
    md: '--neoverse-action-font-size-md',
    lg: '--neoverse-action-font-size-lg',
  },
  iconSize: {
    sm: '--neoverse-action-icon-size-sm',
    md: '--neoverse-action-icon-size-md',
    lg: '--neoverse-action-icon-size-lg',
  },
} as const;

export type ActionToken = keyof typeof actionCssVariables;
