export const dockCssVariables = {
  navigationTypeFactor: '--neoverse-dock-navigation-type-factor',
  scale: {
    md: '--neoverse-dock-scale-md',
    lg: '--neoverse-dock-scale-lg',
  },
} as const;

export type DockToken = keyof typeof dockCssVariables;
