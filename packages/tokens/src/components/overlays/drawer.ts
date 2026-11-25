export const drawerCssVariables = {
  width: '--neoverse-drawer-width',
  inset: '--neoverse-drawer-inset',
} as const;

export type DrawerToken = keyof typeof drawerCssVariables;
