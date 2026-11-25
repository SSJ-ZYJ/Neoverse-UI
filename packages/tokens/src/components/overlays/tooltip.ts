export const tooltipCssVariables = {
  radius: '--neoverse-tooltip-radius',
  paddingBlock: '--neoverse-tooltip-padding-block',
  paddingInline: '--neoverse-tooltip-padding-inline',
  fontSize: '--neoverse-tooltip-font-size',
  fontWeight: '--neoverse-tooltip-font-weight',
  lineHeight: '--neoverse-tooltip-line-height',
  foreground: '--neoverse-tooltip-foreground',
  arrowSize: '--neoverse-tooltip-arrow-size',
  arrowOffset: '--neoverse-tooltip-arrow-offset',
  arrowBackground: '--neoverse-tooltip-arrow-background',
  arrowShadow: '--neoverse-tooltip-arrow-shadow',
  accentTint: '--neoverse-tooltip-accent-tint',
} as const;

export type TooltipToken = keyof typeof tooltipCssVariables;
