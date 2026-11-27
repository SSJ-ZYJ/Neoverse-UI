export const statusIndicatorCssVariables = {
  gap: {
    sm: '--neoverse-status-indicator-gap-sm',
    md: '--neoverse-status-indicator-gap-md',
  },
  dotSize: {
    sm: '--neoverse-status-indicator-dot-size-sm',
    md: '--neoverse-status-indicator-dot-size-md',
  },
  glowOpacity: '--neoverse-status-indicator-glow-opacity',
  pulseOpacity: '--neoverse-status-indicator-pulse-opacity',
  pulseScale: '--neoverse-status-indicator-pulse-scale',
  pulseRestOpacity: '--neoverse-status-indicator-pulse-rest-opacity',
  pulseMidOpacity: '--neoverse-status-indicator-pulse-mid-opacity',
  neutral: {
    color: '--neoverse-status-indicator-neutral-color',
    glow: '--neoverse-status-indicator-neutral-glow',
    pulseBackground: '--neoverse-status-indicator-neutral-pulse-background',
    pulseShadow: '--neoverse-status-indicator-neutral-pulse-shadow',
  },
  info: {
    color: '--neoverse-status-indicator-info-color',
    glow: '--neoverse-status-indicator-info-glow',
    pulseBackground: '--neoverse-status-indicator-info-pulse-background',
    pulseShadow: '--neoverse-status-indicator-info-pulse-shadow',
  },
  success: {
    color: '--neoverse-status-indicator-success-color',
    glow: '--neoverse-status-indicator-success-glow',
    pulseBackground: '--neoverse-status-indicator-success-pulse-background',
    pulseShadow: '--neoverse-status-indicator-success-pulse-shadow',
  },
  warning: {
    color: '--neoverse-status-indicator-warning-color',
    glow: '--neoverse-status-indicator-warning-glow',
    pulseBackground: '--neoverse-status-indicator-warning-pulse-background',
    pulseShadow: '--neoverse-status-indicator-warning-pulse-shadow',
  },
  danger: {
    color: '--neoverse-status-indicator-danger-color',
    glow: '--neoverse-status-indicator-danger-glow',
    pulseBackground: '--neoverse-status-indicator-danger-pulse-background',
    pulseShadow: '--neoverse-status-indicator-danger-pulse-shadow',
  },
} as const;

export type StatusIndicatorToken = keyof typeof statusIndicatorCssVariables;
