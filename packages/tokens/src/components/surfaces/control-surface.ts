export const controlSurfaceCssVariables = {
  gap: '--neoverse-control-surface-gap',
  itemGap: '--neoverse-control-surface-item-gap',
  groupHeight: '--neoverse-control-surface-group-height',
  controlHeight: '--neoverse-control-surface-control-height',
  navigationHeight: '--neoverse-control-surface-navigation-height',
  segmentedHeight: '--neoverse-control-surface-segmented-height',
  segmentedGroupHeight: '--neoverse-control-surface-segmented-group-height',
  padding: '--neoverse-control-surface-padding',
  paddingBlock: '--neoverse-control-surface-padding-block',
  paddingInline: '--neoverse-control-surface-padding-inline',
  trailingPadding: '--neoverse-control-surface-trailing-padding',
  trailingPaddingInline: '--neoverse-control-surface-trailing-padding-inline',
  navigationEdgeInset: '--neoverse-control-surface-navigation-edge-inset',
  dividerHeight: '--neoverse-control-surface-divider-height',
  dividerGap: '--neoverse-control-surface-divider-gap',
  dividerColor: '--neoverse-control-surface-divider-color',
  indicatorDuration: '--neoverse-control-surface-indicator-duration',
  indicatorEasing: '--neoverse-control-surface-indicator-easing',
} as const;

export type ControlSurfaceToken = keyof typeof controlSurfaceCssVariables;
