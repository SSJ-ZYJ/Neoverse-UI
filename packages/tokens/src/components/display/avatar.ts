export const avatarCssVariables = {
  sizeSm: '--neoverse-avatar-size-sm',
  sizeMd: '--neoverse-avatar-size-md',
  sizeLg: '--neoverse-avatar-size-lg',
  radius: '--neoverse-avatar-radius',
  roundedRadius: '--neoverse-avatar-rounded-radius',
  fallbackBackground: '--neoverse-avatar-fallback-background',
  fallbackForeground: '--neoverse-avatar-fallback-foreground',
  fontSize: '--neoverse-avatar-font-size',
} as const;

export type AvatarToken = keyof typeof avatarCssVariables;
