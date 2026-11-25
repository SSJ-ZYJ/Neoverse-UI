export const dialogCssVariables = {
  width: '--neoverse-dialog-width',
  padding: '--neoverse-dialog-padding',
  radius: '--neoverse-dialog-radius',
  scrim: '--neoverse-dialog-scrim',
} as const;

export type DialogToken = keyof typeof dialogCssVariables;
