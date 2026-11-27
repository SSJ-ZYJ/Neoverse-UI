export const focusCssVariables = {
  ringColor: '--neoverse-color-focus-ring',
  ringWidth: '--neoverse-focus-ring-width',
  ringOffset: '--neoverse-focus-ring-offset',
  ringOffsetColor: '--neoverse-focus-ring-offset-color',
} as const;

export type FocusToken = keyof typeof focusCssVariables;
