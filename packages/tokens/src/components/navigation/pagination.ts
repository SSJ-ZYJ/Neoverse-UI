export const paginationCssVariables = {
  gap: '--neoverse-pagination-gap',
  buttonSize: '--neoverse-pagination-button-size',
  buttonRadius: '--neoverse-pagination-button-radius',
  buttonFontSize: '--neoverse-pagination-button-font-size',
  currentBackgroundImage: '--neoverse-pagination-current-background-image',
  currentBackgroundColor: '--neoverse-pagination-current-background-color',
  currentBorder: '--neoverse-pagination-current-border',
  currentShadow: '--neoverse-pagination-current-shadow',
} as const;

export type PaginationToken = keyof typeof paginationCssVariables;
