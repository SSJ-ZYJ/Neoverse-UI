export const noticeCssVariables = {
  radius: '--neoverse-notice-radius',
  gap: '--neoverse-notice-gap',
  paddingBlock: '--neoverse-notice-padding-block',
  paddingInline: '--neoverse-notice-padding-inline',
  fontSize: '--neoverse-notice-font-size',
  foreground: '--neoverse-notice-foreground',
  neutral: {
    background: '--neoverse-notice-neutral-background',
    shadow: '--neoverse-notice-neutral-shadow',
  },
  info: {
    background: '--neoverse-notice-info-background',
    shadow: '--neoverse-notice-info-shadow',
  },
  success: {
    background: '--neoverse-notice-success-background',
    shadow: '--neoverse-notice-success-shadow',
  },
  warning: {
    background: '--neoverse-notice-warning-background',
    shadow: '--neoverse-notice-warning-shadow',
  },
  danger: {
    background: '--neoverse-notice-danger-background',
    shadow: '--neoverse-notice-danger-shadow',
  },
} as const;

export type NoticeToken = keyof typeof noticeCssVariables;
