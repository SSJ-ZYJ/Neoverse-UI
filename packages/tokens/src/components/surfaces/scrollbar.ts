export const scrollbarCssVariables = {
  immersive: {
    size: '--neoverse-scrollbar-immersive-size',
    railInset: '--neoverse-scrollbar-immersive-rail-inset',
    thumbMinLength: '--neoverse-scrollbar-immersive-thumb-min-length',
    thumbBorderWidth: '--neoverse-scrollbar-immersive-thumb-border-width',
    thumbHoverBorderWidth: '--neoverse-scrollbar-immersive-thumb-hover-border-width',
    track: '--neoverse-scrollbar-immersive-track',
    thumb: '--neoverse-scrollbar-immersive-thumb',
    thumbHover: '--neoverse-scrollbar-immersive-thumb-hover',
    thumbActive: '--neoverse-scrollbar-immersive-thumb-active',
    thumbBackground: '--neoverse-scrollbar-immersive-thumb-background',
    thumbHoverBackground: '--neoverse-scrollbar-immersive-thumb-hover-background',
    thumbActiveBackground: '--neoverse-scrollbar-immersive-thumb-active-background',
    thumbEdge: '--neoverse-scrollbar-immersive-thumb-edge',
  },
  overlay: {
    insetBlock: '--neoverse-scrollbar-overlay-inset-block',
    insetInline: '--neoverse-scrollbar-overlay-inset-inline',
    thumbWidth: '--neoverse-scrollbar-overlay-thumb-width',
    thumbWidthHover: '--neoverse-scrollbar-overlay-thumb-width-hover',
  },
} as const;

export type ScrollbarToken = keyof typeof scrollbarCssVariables;
export type ImmersiveScrollbarToken = keyof typeof scrollbarCssVariables.immersive;
