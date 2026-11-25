export const layoutCssVariables = {
  container: {
    sm: '--neoverse-layout-container-sm',
    md: '--neoverse-layout-container-md',
    lg: '--neoverse-layout-container-lg',
    xl: '--neoverse-layout-container-xl',
    '2xl': '--neoverse-layout-container-2xl',
  },
  gutter: {
    inline: '--neoverse-layout-gutter-inline',
    block: '--neoverse-layout-gutter-block',
  },
  page: {
    maxWidth: '--neoverse-layout-page-max-width',
    paddingInline: '--neoverse-layout-page-padding-inline',
    paddingBlock: '--neoverse-layout-page-padding-block',
  },
  contentMaxWidth: '--neoverse-layout-content-max-width',
  reading: {
    width: '--neoverse-layout-reading-width',
    wideWidth: '--neoverse-layout-reading-wide-width',
  },
  sidebar: {
    width: '--neoverse-layout-sidebar-width',
    drawerWidth: '--neoverse-layout-sidebar-drawer-width',
  },
  headerMinHeight: '--neoverse-layout-header-min-height',
  gridGap: '--neoverse-layout-grid-gap',
  presentationRootSize: '--neoverse-layout-presentation-root-size',
  layer: {
    base: '--neoverse-layout-layer-base',
    raised: '--neoverse-layout-layer-raised',
    sticky: '--neoverse-layout-layer-sticky',
    overlay: '--neoverse-layout-layer-overlay',
    modal: '--neoverse-layout-layer-modal',
    toast: '--neoverse-layout-layer-toast',
  },
} as const;

export const layoutBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type LayoutContainerToken = keyof typeof layoutCssVariables.container;
export type LayoutBreakpoint = keyof typeof layoutBreakpoints;
