export const typographyCssVariables = {
  family: {
    display: '--neoverse-typography-display-font-family',
    title: '--neoverse-typography-title-font-family',
    body: '--neoverse-typography-body-font-family',
    label: '--neoverse-typography-label-font-family',
    caption: '--neoverse-typography-caption-font-family',
    code: '--neoverse-typography-code-font-family',
  },
  scale: {
    display: {
      lg: {
        size: '--neoverse-typography-display-lg-size',
        lineHeight: '--neoverse-typography-display-lg-line-height',
        weight: '--neoverse-typography-display-lg-weight',
        letterSpacing: '--neoverse-typography-display-lg-letter-spacing',
      },
      md: {
        size: '--neoverse-typography-display-md-size',
        lineHeight: '--neoverse-typography-display-md-line-height',
        weight: '--neoverse-typography-display-md-weight',
        letterSpacing: '--neoverse-typography-display-md-letter-spacing',
      },
    },
    title: {
      lg: {
        size: '--neoverse-typography-title-lg-size',
        lineHeight: '--neoverse-typography-title-lg-line-height',
        weight: '--neoverse-typography-title-lg-weight',
        letterSpacing: '--neoverse-typography-title-lg-letter-spacing',
      },
      md: {
        size: '--neoverse-typography-title-md-size',
        lineHeight: '--neoverse-typography-title-md-line-height',
        weight: '--neoverse-typography-title-md-weight',
        letterSpacing: '--neoverse-typography-title-md-letter-spacing',
      },
      sm: {
        size: '--neoverse-typography-title-sm-size',
        lineHeight: '--neoverse-typography-title-sm-line-height',
        weight: '--neoverse-typography-title-sm-weight',
        letterSpacing: '--neoverse-typography-title-sm-letter-spacing',
      },
    },
    body: {
      lg: {
        size: '--neoverse-typography-body-lg-size',
        lineHeight: '--neoverse-typography-body-lg-line-height',
        weight: '--neoverse-typography-body-lg-weight',
        letterSpacing: '--neoverse-typography-body-lg-letter-spacing',
      },
      md: {
        size: '--neoverse-typography-body-md-size',
        lineHeight: '--neoverse-typography-body-md-line-height',
        weight: '--neoverse-typography-body-md-weight',
        letterSpacing: '--neoverse-typography-body-md-letter-spacing',
      },
      sm: {
        size: '--neoverse-typography-body-sm-size',
        lineHeight: '--neoverse-typography-body-sm-line-height',
        weight: '--neoverse-typography-body-sm-weight',
        letterSpacing: '--neoverse-typography-body-sm-letter-spacing',
      },
    },
    label: {
      lg: {
        size: '--neoverse-typography-label-lg-size',
        lineHeight: '--neoverse-typography-label-lg-line-height',
        weight: '--neoverse-typography-label-lg-weight',
        letterSpacing: '--neoverse-typography-label-lg-letter-spacing',
      },
      md: {
        size: '--neoverse-typography-label-md-size',
        lineHeight: '--neoverse-typography-label-md-line-height',
        weight: '--neoverse-typography-label-md-weight',
        letterSpacing: '--neoverse-typography-label-md-letter-spacing',
      },
      sm: {
        size: '--neoverse-typography-label-sm-size',
        lineHeight: '--neoverse-typography-label-sm-line-height',
        weight: '--neoverse-typography-label-sm-weight',
        letterSpacing: '--neoverse-typography-label-sm-letter-spacing',
      },
    },
  },
  caption: {
    fontFamily: '--neoverse-typography-caption-font-family',
    size: '--neoverse-typography-caption-size',
    lineHeight: '--neoverse-typography-caption-line-height',
    weight: '--neoverse-typography-caption-weight',
    letterSpacing: '--neoverse-typography-caption-letter-spacing',
  },
  code: {
    fontFamily: '--neoverse-typography-code-font-family',
    size: '--neoverse-typography-code-size',
    lineHeight: '--neoverse-typography-code-line-height',
    weight: '--neoverse-typography-code-weight',
    letterSpacing: '--neoverse-typography-code-letter-spacing',
  },
} as const;

export type TypographyRole = keyof typeof typographyCssVariables;
