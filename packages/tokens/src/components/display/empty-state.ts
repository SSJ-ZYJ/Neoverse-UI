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
} as const;

export type EmptyStateToken = keyof typeof emptyStateCssVariables;
