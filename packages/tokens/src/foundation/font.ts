export const fontCssVariables = {
  family: {
    sans: '--neoverse-font-family-sans',
    code: '--neoverse-font-family-code',
    codeDefault: '--neoverse-font-family-code-default',
    codeMaple: '--neoverse-font-family-code-maple',
    mono: '--neoverse-font-family-mono',
  },
  size: {
    '2xs': '--neoverse-font-size-2xs',
    xs: '--neoverse-font-size-xs',
    sm: '--neoverse-font-size-sm',
    md: '--neoverse-font-size-md',
    lg: '--neoverse-font-size-lg',
    xl: '--neoverse-font-size-xl',
    '2xl': '--neoverse-font-size-2xl',
    '3xl': '--neoverse-font-size-3xl',
    '4xl': '--neoverse-font-size-4xl',
    display: '--neoverse-font-size-display',
  },
  weight: {
    regular: '--neoverse-font-weight-regular',
    medium: '--neoverse-font-weight-medium',
    semibold: '--neoverse-font-weight-semibold',
    bold: '--neoverse-font-weight-bold',
    display: '--neoverse-font-weight-display',
  },
  lineHeight: {
    tight: '--neoverse-line-height-tight',
    snug: '--neoverse-line-height-snug',
    normal: '--neoverse-line-height-normal',
    relaxed: '--neoverse-line-height-relaxed',
  },
  letterSpacing: {
    tight: '--neoverse-letter-spacing-tight',
    normal: '--neoverse-letter-spacing-normal',
    wide: '--neoverse-letter-spacing-wide',
  },
} as const;

export type FontFamilyToken = keyof typeof fontCssVariables.family;
export type FontSizeToken = keyof typeof fontCssVariables.size;
export type FontWeightToken = keyof typeof fontCssVariables.weight;
export type LineHeightToken = keyof typeof fontCssVariables.lineHeight;
export type LetterSpacingToken = keyof typeof fontCssVariables.letterSpacing;
