export const badgeCssVariables = {
  labelOpticalOffset: '--neoverse-badge-label-optical-offset',
  fontFamily: '--neoverse-badge-font-family',
  fontWeight: '--neoverse-badge-font-weight',
  fontSize: {
    sm: '--neoverse-badge-font-size-sm',
    md: '--neoverse-badge-font-size-md',
    lg: '--neoverse-badge-font-size-lg',
  },
  lineHeight: {
    sm: '--neoverse-badge-line-height-sm',
    md: '--neoverse-badge-line-height-md',
    lg: '--neoverse-badge-line-height-lg',
  },
  background: '--neoverse-badge-background',
  backdropFilter: '--neoverse-badge-backdrop-filter',
  foreground: '--neoverse-badge-foreground',
  shadow: '--neoverse-badge-shadow',
  info: {
    background: '--neoverse-badge-info-background',
    foreground: '--neoverse-badge-info-foreground',
    shadow: '--neoverse-badge-info-shadow',
  },
  success: {
    background: '--neoverse-badge-success-background',
    foreground: '--neoverse-badge-success-foreground',
    shadow: '--neoverse-badge-success-shadow',
  },
  warning: {
    background: '--neoverse-badge-warning-background',
    foreground: '--neoverse-badge-warning-foreground',
    shadow: '--neoverse-badge-warning-shadow',
  },
  danger: {
    background: '--neoverse-badge-danger-background',
    foreground: '--neoverse-badge-danger-foreground',
    shadow: '--neoverse-badge-danger-shadow',
  },
} as const;

export type BadgeToken = keyof typeof badgeCssVariables;
