export const navigationItemCssVariables = {
  activeBackground: '--neoverse-navigation-item-active-background',
  activeFill: '--neoverse-navigation-item-active-fill',
  activeBorder: '--neoverse-navigation-item-active-border',
  activeForeground: '--neoverse-navigation-item-active-foreground',
  activeShadow: '--neoverse-navigation-item-active-shadow',
  filter: '--neoverse-navigation-item-filter',
  gap: '--neoverse-navigation-item-gap',
  compactGap: '--neoverse-navigation-item-compact-gap',
  height: {
    sm: '--neoverse-navigation-item-height-sm',
    md: '--neoverse-navigation-item-height-md',
    lg: '--neoverse-navigation-item-height-lg',
  },
  fontSize: {
    sm: '--neoverse-navigation-item-font-size-sm',
    md: '--neoverse-navigation-item-font-size-md',
    lg: '--neoverse-navigation-item-font-size-lg',
  },
  iconSize: '--neoverse-navigation-item-icon-size',
  iconSizes: {
    sm: '--neoverse-navigation-item-icon-size-sm',
    md: '--neoverse-navigation-item-icon-size-md',
    lg: '--neoverse-navigation-item-icon-size-lg',
  },
  paddingBlock: {
    sm: '--neoverse-navigation-item-padding-block-sm',
    md: '--neoverse-navigation-item-padding-block-md',
    lg: '--neoverse-navigation-item-padding-block-lg',
  },
  paddingInline: {
    sm: '--neoverse-navigation-item-padding-inline-sm',
    md: '--neoverse-navigation-item-padding-inline-md',
    lg: '--neoverse-navigation-item-padding-inline-lg',
  },
  compactPaddingInline: '--neoverse-navigation-item-compact-padding-inline',
  compactIndicatorWidth: '--neoverse-navigation-item-compact-indicator-width',
  indicatorColor: '--neoverse-navigation-item-indicator-color',
  indicatorWidth: '--neoverse-navigation-item-indicator-width',
  indicatorHeight: '--neoverse-navigation-item-indicator-height',
  indicatorInset: '--neoverse-navigation-item-indicator-inset',
  compactIndicatorInset: '--neoverse-navigation-item-compact-indicator-inset',
} as const;

export type NavigationItemToken = keyof typeof navigationItemCssVariables;
