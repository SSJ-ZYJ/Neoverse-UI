export const tabsCssVariables = {
  listGap: '--neoverse-tabs-list-gap',
  listPadding: '--neoverse-tabs-list-padding',
  listRadius: '--neoverse-tabs-list-radius',
  tabRadius: '--neoverse-tabs-tab-radius',
  tabHeight: '--neoverse-tabs-tab-height',
  tabPadding: '--neoverse-tabs-tab-padding',
  tabFontSize: '--neoverse-tabs-tab-font-size',
  selectedBackgroundImage: '--neoverse-tabs-selected-background-image',
  selectedBackgroundColor: '--neoverse-tabs-selected-background-color',
  selectedBorder: '--neoverse-tabs-selected-border',
  selectedShadow: '--neoverse-tabs-selected-shadow',
  panelPaddingBlock: '--neoverse-tabs-panel-padding-block',
} as const;

export type TabsToken = keyof typeof tabsCssVariables;
