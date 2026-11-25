export const breadcrumbCssVariables = {
  gap: '--neoverse-breadcrumb-gap',
  itemGap: '--neoverse-breadcrumb-item-gap',
  fontSize: '--neoverse-breadcrumb-font-size',
  lineHeight: '--neoverse-breadcrumb-line-height',
  fontWeight: '--neoverse-breadcrumb-font-weight',
  linkForeground: '--neoverse-breadcrumb-link-foreground',
  linkHoverForeground: '--neoverse-breadcrumb-link-hover-foreground',
  currentForeground: '--neoverse-breadcrumb-current-foreground',
  separatorForeground: '--neoverse-breadcrumb-separator-foreground',
  separatorSize: '--neoverse-breadcrumb-separator-size',
  focusColor: '--neoverse-breadcrumb-focus-color',
  focusWidth: '--neoverse-breadcrumb-focus-width',
  focusOffset: '--neoverse-breadcrumb-focus-offset',
  focusRadius: '--neoverse-breadcrumb-focus-radius',
  linkPlateInset: '--neoverse-breadcrumb-link-plate-inset',
  linkPlateBackground: '--neoverse-breadcrumb-link-plate-background',
  linkPlateRestScale: '--neoverse-breadcrumb-link-plate-rest-scale',
  clipMargin: '--neoverse-breadcrumb-clip-margin',
} as const;

export type BreadcrumbToken = keyof typeof breadcrumbCssVariables;
