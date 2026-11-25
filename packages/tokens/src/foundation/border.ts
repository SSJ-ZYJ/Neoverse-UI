export const borderCssVariables = {
  width: {
    none: '--neoverse-border-width-none',
    thin: '--neoverse-border-width-thin',
    strong: '--neoverse-border-width-strong',
  },
  style: {
    solid: '--neoverse-border-style-solid',
  },
} as const;

export type BorderWidthToken = keyof typeof borderCssVariables.width;
