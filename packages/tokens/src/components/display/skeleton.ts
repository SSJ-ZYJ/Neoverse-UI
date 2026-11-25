export const skeletonCssVariables = {
  baseFill: '--neoverse-skeleton-base-fill',
  fill: '--neoverse-skeleton-fill',
  backdropFilter: '--neoverse-skeleton-backdrop-filter',
  highlight: '--neoverse-skeleton-highlight',
  edge: '--neoverse-skeleton-edge',
  textMinHeight: '--neoverse-skeleton-text-min-height',
  titleMinHeight: '--neoverse-skeleton-title-min-height',
  shimmerDuration: '--neoverse-skeleton-shimmer-duration',
  shimmerEasing: '--neoverse-skeleton-shimmer-easing',
  pulseMidOpacity: '--neoverse-skeleton-pulse-mid-opacity',
} as const;

export type SkeletonToken = keyof typeof skeletonCssVariables;
