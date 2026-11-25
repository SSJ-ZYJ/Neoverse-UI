export const emptyStateCssVariables = {
  minHeight: '--neoverse-empty-state-min-height',
  padding: '--neoverse-empty-state-padding',
  gap: '--neoverse-empty-state-gap',
  maxWidth: '--neoverse-empty-state-max-width',
  iconSize: '--neoverse-empty-state-icon-size',
  iconRadius: '--neoverse-empty-state-icon-radius',
  iconBackground: '--neoverse-empty-state-icon-background',
  iconColor: '--neoverse-empty-state-icon-color',
  titleSize: '--neoverse-empty-state-title-size',
  descriptionSize: '--neoverse-empty-state-description-size',
  compactPadding: '--neoverse-empty-state-compact-padding',
  compactGap: '--neoverse-empty-state-compact-gap',
  compactIconSize: '--neoverse-empty-state-compact-icon-size',
  outlineColor: '--neoverse-empty-state-outline-color',
} as const;

export type EmptyStateToken = keyof typeof emptyStateCssVariables;
