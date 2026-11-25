export const paginationCssVariables = {
  gap: '--neoverse-pagination-gap',
  buttonSize: '--neoverse-pagination-button-size',
  buttonRadius: '--neoverse-pagination-button-radius',
  buttonFontSize: '--neoverse-pagination-button-font-size',
  currentBackgroundImage: '--neoverse-pagination-current-background-image',
  currentBackgroundColor: '--neoverse-pagination-current-background-color',
  currentHoverBackgroundImage: '--neoverse-pagination-current-hover-background-image',
  currentHoverBackgroundColor: '--neoverse-pagination-current-hover-background-color',
  currentPressBackgroundImage: '--neoverse-pagination-current-press-background-image',
  currentPressBackgroundColor: '--neoverse-pagination-current-press-background-color',
  currentBorder: '--neoverse-pagination-current-border',
  currentForeground: '--neoverse-pagination-current-foreground',
  currentShadow: '--neoverse-pagination-current-shadow',
  currentFilter: '--neoverse-pagination-current-filter',
} as const;

export type PaginationToken = keyof typeof paginationCssVariables;
