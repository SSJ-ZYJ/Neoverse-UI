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
  selectedHoverBackgroundImage: '--neoverse-tabs-selected-hover-background-image',
  selectedHoverBackgroundColor: '--neoverse-tabs-selected-hover-background-color',
  selectedPressBackgroundImage: '--neoverse-tabs-selected-press-background-image',
  selectedPressBackgroundColor: '--neoverse-tabs-selected-press-background-color',
  selectedBorder: '--neoverse-tabs-selected-border',
  selectedForeground: '--neoverse-tabs-selected-foreground',
  selectedShadow: '--neoverse-tabs-selected-shadow',
  selectedFilter: '--neoverse-tabs-selected-filter',
  panelPaddingBlock: '--neoverse-tabs-panel-padding-block',
} as const;

export type TabsToken = keyof typeof tabsCssVariables;
