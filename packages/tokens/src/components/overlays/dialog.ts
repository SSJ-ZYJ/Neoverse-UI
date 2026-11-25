export const dialogCssVariables = {
  widthSm: '--neoverse-dialog-width-sm',
  width: '--neoverse-dialog-width',
  widthLg: '--neoverse-dialog-width-lg',
  padding: '--neoverse-dialog-padding',
  radius: '--neoverse-dialog-radius',
  background: '--neoverse-dialog-background',
  scrim: '--neoverse-dialog-scrim',
} as const;

export type DialogToken = keyof typeof dialogCssVariables;
