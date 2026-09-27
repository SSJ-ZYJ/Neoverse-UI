import { motionDurations, motionEasings, motionRoles } from '@neoverse-ui/motion';
import { cssVariables } from '@neoverse-ui/tokens';
import { type LocalizedText, localized, tokenCopy } from './playground-content';

export interface ColorToken {
  label: LocalizedText;
  variable: string;
  className: string;
}

export interface TokenGroup<T> {
  label: LocalizedText;
  items: T[];
}

export interface TypographyToken {
  label: LocalizedText;
  className: string;
  variables: string[];
}

export interface NamedToken {
  label: LocalizedText;
  variable: string;
}

const color = cssVariables.color;
const primitiveColorFamilies = [
  'neutral',
  'blue',
  'cyan',
  'mint',
  'red',
  'amber',
  'green',
] as const;
const primitiveColorGroup = (
  family: (typeof primitiveColorFamilies)[number],
): TokenGroup<NamedToken> => ({
  label: localized(family, family),
  items: Object.entries(color.primitive[family]).map(([shade, variable]) => ({
    label: localized(`${family}-${shade}`, `${family}-${shade}`),
    variable,
  })),
});

export const primitiveColorGroups: TokenGroup<NamedToken>[] = [
  ...primitiveColorFamilies.map(primitiveColorGroup),
  {
    label: localized('Utility', '实用'),
    items: (['white', 'black', 'transparent'] as const).map((name) => ({
      label: localized(name, name),
      variable: color.primitive[name],
    })),
  },
];

export const semanticColorGroups: TokenGroup<ColorToken>[] = [
  {
    label: tokenCopy.colorGroups.surface,
    items: [
      {
        label: tokenCopy.colors.canvas,
        variable: color.surface.canvas,
        className: 'bg-surface-canvas',
      },
      {
        label: tokenCopy.colors.subtle,
        variable: color.surface.subtle,
        className: 'bg-surface-subtle',
      },
      {
        label: tokenCopy.colors.raised,
        variable: color.surface.raised,
        className: 'bg-surface-raised',
      },
      {
        label: tokenCopy.colors.glass,
        variable: color.surface.glass,
        className: 'bg-surface-glass',
      },
      {
        label: tokenCopy.colors.overlay,
        variable: color.surface.overlay,
        className: 'bg-surface-overlay',
      },
    ],
  },
  {
    label: tokenCopy.colorGroups.text,
    items: [
      { label: tokenCopy.colors.primary, variable: color.text.primary, className: 'text-primary' },
      {
        label: tokenCopy.colors.secondary,
        variable: color.text.secondary,
        className: 'text-secondary',
      },
      { label: tokenCopy.colors.muted, variable: color.text.muted, className: 'text-muted' },
      {
        label: tokenCopy.colors.disabled,
        variable: color.text.disabled,
        className: 'text-disabled',
      },
      { label: tokenCopy.colors.inverse, variable: color.text.inverse, className: 'text-inverse' },
      {
        label: tokenCopy.colors.onAccent,
        variable: color.text.onAccent,
        className: 'text-on-accent',
      },
    ],
  },
  {
    label: tokenCopy.colorGroups.border,
    items: [
      {
        label: tokenCopy.colors.subtle,
        variable: color.border.subtle,
        className: 'border-subtle',
      },
      {
        label: tokenCopy.colors.default,
        variable: color.border.default,
        className: 'border-default',
      },
      {
        label: tokenCopy.colors.strong,
        variable: color.border.strong,
        className: 'border-strong',
      },
      {
        label: tokenCopy.colors.interactive,
        variable: color.border.interactive,
        className: 'border-interactive',
      },
    ],
  },
  {
    label: tokenCopy.colorGroups.accent,
    items: [
      {
        label: tokenCopy.colors.primary,
        variable: color.accent.primary,
        className: 'bg-accent-primary',
      },
      {
        label: tokenCopy.colors.primaryForeground,
        variable: color.accent.primaryForeground,
        className: 'text-accent-primary-foreground',
      },
      {
        label: tokenCopy.colors.secondary,
        variable: color.accent.secondary,
        className: 'bg-accent-secondary',
      },
      {
        label: tokenCopy.colors.secondaryForeground,
        variable: color.accent.secondaryForeground,
        className: 'text-accent-secondary-foreground',
      },
      {
        label: tokenCopy.colors.tertiary,
        variable: color.accent.tertiary,
        className: 'bg-accent-tertiary',
      },
      {
        label: tokenCopy.colors.tertiaryForeground,
        variable: color.accent.tertiaryForeground,
        className: 'text-accent-tertiary-foreground',
      },
      { label: tokenCopy.colors.soft, variable: color.accent.soft, className: 'bg-accent-soft' },
    ],
  },
  {
    label: tokenCopy.colorGroups.action,
    items: [
      {
        label: tokenCopy.colors.primary,
        variable: color.action.primary,
        className: 'bg-action-primary',
      },
      {
        label: tokenCopy.colors.primaryHover,
        variable: color.action.primaryHover,
        className: 'hover:bg-action-primary-hover',
      },
      {
        label: tokenCopy.colors.primaryActive,
        variable: color.action.primaryActive,
        className: 'active:bg-action-primary-active',
      },
      {
        label: tokenCopy.colors.primaryForeground,
        variable: color.action.primaryForeground,
        className: 'text-action-primary-foreground',
      },
      {
        label: tokenCopy.colors.secondary,
        variable: color.action.secondary,
        className: 'bg-action-secondary',
      },
      {
        label: tokenCopy.colors.secondaryHover,
        variable: color.action.secondaryHover,
        className: 'hover:bg-action-secondary-hover',
      },
      {
        label: tokenCopy.colors.secondaryActive,
        variable: color.action.secondaryActive,
        className: 'active:bg-action-secondary-active',
      },
      {
        label: tokenCopy.colors.secondaryForeground,
        variable: color.action.secondaryForeground,
        className: 'text-action-secondary-foreground',
      },
      {
        label: tokenCopy.colors.disabled,
        variable: color.action.disabled,
        className: 'bg-action-disabled',
      },
      {
        label: tokenCopy.colors.disabledForeground,
        variable: color.action.disabledForeground,
        className: 'text-action-disabled-foreground',
      },
    ],
  },
  {
    label: tokenCopy.colorGroups.status,
    items: [
      { label: tokenCopy.colors.info, variable: color.status.info, className: 'bg-status-info' },
      {
        label: tokenCopy.colors.infoForeground,
        variable: color.status.infoForeground,
        className: 'text-status-info-foreground',
      },
      {
        label: tokenCopy.colors.success,
        variable: color.status.success,
        className: 'bg-status-success',
      },
      {
        label: tokenCopy.colors.successForeground,
        variable: color.status.successForeground,
        className: 'text-status-success-foreground',
      },
      {
        label: tokenCopy.colors.warning,
        variable: color.status.warning,
        className: 'bg-status-warning',
      },
      {
        label: tokenCopy.colors.warningForeground,
        variable: color.status.warningForeground,
        className: 'text-status-warning-foreground',
      },
      {
        label: tokenCopy.colors.danger,
        variable: color.status.danger,
        className: 'bg-status-danger',
      },
      {
        label: tokenCopy.colors.dangerForeground,
        variable: color.status.dangerForeground,
        className: 'text-status-danger-foreground',
      },
    ],
  },
  {
    label: tokenCopy.colorGroups.focusOverlay,
    items: [
      { label: tokenCopy.colors.focusRing, variable: color.focus.ring, className: 'ring-focus' },
      { label: tokenCopy.colors.scrim, variable: color.overlay.scrim, className: 'bg-scrim' },
    ],
  },
];

const typography = cssVariables.typography;

const typographyScaleToken = (
  label: LocalizedText,
  className: string,
  family: string,
  scale: Record<string, string>,
): TypographyToken => ({
  label,
  className,
  variables: [family, ...Object.values(scale)],
});

export const typographyTokens: TypographyToken[] = [
  typographyScaleToken(
    localized('Display Large', '展示 大'),
    'text-display-lg font-display leading-display-lg tracking-display-lg',
    typography.family.display,
    typography.scale.display.lg,
  ),
  typographyScaleToken(
    localized('Display Medium', '展示 中'),
    'text-display-md font-display leading-display-md tracking-display-md',
    typography.family.display,
    typography.scale.display.md,
  ),
  typographyScaleToken(
    localized('Title Large', '标题 大'),
    'text-title-lg font-title leading-title-lg tracking-title-lg',
    typography.family.title,
    typography.scale.title.lg,
  ),
  typographyScaleToken(
    localized('Title Medium', '标题 中'),
    'text-title-md font-title leading-title-md tracking-title-md',
    typography.family.title,
    typography.scale.title.md,
  ),
  typographyScaleToken(
    localized('Title Small', '标题 小'),
    'text-title-sm font-title leading-title-sm tracking-title-sm',
    typography.family.title,
    typography.scale.title.sm,
  ),
  typographyScaleToken(
    localized('Body Large', '正文 大'),
    'text-body-lg font-body leading-body-lg tracking-body-lg',
    typography.family.body,
    typography.scale.body.lg,
  ),
  typographyScaleToken(
    localized('Body Medium', '正文 中'),
    'text-body-md font-body leading-body-md tracking-body-md',
    typography.family.body,
    typography.scale.body.md,
  ),
  typographyScaleToken(
    localized('Body Small', '正文 小'),
    'text-body-sm font-body leading-body-sm tracking-body-sm',
    typography.family.body,
    typography.scale.body.sm,
  ),
  typographyScaleToken(
    localized('Label Large', '标签 大'),
    'text-label-lg font-label leading-label-lg tracking-label-lg',
    typography.family.label,
    typography.scale.label.lg,
  ),
  typographyScaleToken(
    localized('Label Medium', '标签 中'),
    'text-label-md font-label leading-label-md tracking-label-md',
    typography.family.label,
    typography.scale.label.md,
  ),
  typographyScaleToken(
    localized('Label Small', '标签 小'),
    'text-label-sm font-label leading-label-sm tracking-label-sm',
    typography.family.label,
    typography.scale.label.sm,
  ),
  {
    label: tokenCopy.typography.caption,
    className: 'text-caption font-caption leading-caption tracking-caption',
    variables: Object.values(typography.caption),
  },
  {
    label: tokenCopy.typography.code,
    className: 'text-code font-code leading-code tracking-code',
    variables: Object.values(typography.code),
  },
];

export const typographyCompatibilityTokens: TypographyToken[] = [
  {
    label: tokenCopy.typography.display,
    className: 'text-display font-display leading-display tracking-display',
    variables: Object.values(typography.display),
  },
  {
    label: tokenCopy.typography.heading,
    className: 'text-heading font-heading leading-heading tracking-heading',
    variables: Object.values(typography.heading),
  },
  {
    label: tokenCopy.typography.subtitle,
    className: 'text-subtitle font-subtitle leading-subtitle tracking-subtitle',
    variables: Object.values(typography.subtitle),
  },
  {
    label: tokenCopy.typography.body,
    className: 'text-body font-body leading-body tracking-body',
    variables: Object.values(typography.body),
  },
  {
    label: tokenCopy.typography.label,
    className: 'text-label font-label leading-label tracking-label',
    variables: Object.values(typography.label),
  },
];

export const primitiveSpacingTokens: NamedToken[] = Object.entries(cssVariables.space).map(
  ([label, variable]) => ({ label: localized(label, label), variable }),
);

export const semanticSpacingTokens = [
  {
    label: tokenCopy.spacing.inlineGutter,
    className: 'px-gutter-inline',
    variable: cssVariables.layout.gutter.inline,
  },
  {
    label: tokenCopy.spacing.blockGutter,
    className: 'py-gutter-block',
    variable: cssVariables.layout.gutter.block,
  },
  {
    label: tokenCopy.spacing.gridGap,
    className: 'gap-grid',
    variable: cssVariables.layout.gridGap,
  },
];

export const layoutRoleTokens = [
  {
    label: localized('Page max width', '页面最大宽度'),
    className: 'max-w-page',
    variable: cssVariables.layout.page.maxWidth,
  },
  {
    label: localized('Content max width', '内容最大宽度'),
    className: 'max-w-content',
    variable: cssVariables.layout.contentMaxWidth,
  },
  {
    label: localized('Reading width', '阅读宽度'),
    className: 'max-w-reading',
    variable: cssVariables.layout.reading.width,
  },
  {
    label: localized('Wide reading width', '宽阅读宽度'),
    className: 'max-w-reading-wide',
    variable: cssVariables.layout.reading.wideWidth,
  },
  {
    label: localized('Page inline padding', '页面横向留白'),
    className: 'px-page-inline',
    variable: cssVariables.layout.page.paddingInline,
  },
  {
    label: localized('Page block padding', '页面纵向留白'),
    className: 'py-page-block',
    variable: cssVariables.layout.page.paddingBlock,
  },
  {
    label: localized('Sidebar width', '侧栏宽度'),
    className: 'w-sidebar',
    variable: cssVariables.layout.sidebar.width,
  },
  {
    label: localized('Sidebar drawer width', '侧栏抽屉宽度'),
    className: 'w-sidebar-drawer',
    variable: cssVariables.layout.sidebar.drawerWidth,
  },
  {
    label: localized('Header minimum height', '顶栏最小高度'),
    className: 'min-h-header',
    variable: cssVariables.layout.headerMinHeight,
  },
];

const radiusAliasNames = ['pill', 'control', 'controlInner', 'card', 'panel'];
const radiusTokenEntries = Object.entries(cssVariables.radius);
const toRadiusToken = ([label, variable]: [string, string]): NamedToken => ({
  label: localized(label, label),
  variable,
});

export const primitiveRadiusTokens: NamedToken[] = radiusTokenEntries
  .filter(([label]) => !radiusAliasNames.includes(label))
  .map(toRadiusToken);

export const semanticRadiusTokens: NamedToken[] = radiusTokenEntries
  .filter(([label]) => radiusAliasNames.includes(label))
  .map(toRadiusToken);

export const borderWidthTokens: NamedToken[] = Object.entries(cssVariables.border.width).map(
  ([label, variable]) => ({ label: localized(label, label), variable }),
);

export const borderStyleTokens: NamedToken[] = Object.entries(cssVariables.border.style).map(
  ([label, variable]) => ({ label: localized(label, label), variable }),
);

const shadowAliasNames = ['control', 'raised', 'card', 'overlay', 'modal'];
const shadowTokenEntries = Object.entries(cssVariables.shadow);
const toShadowToken = ([label, variable]: [string, string]): NamedToken => ({
  label: localized(label, label),
  variable,
});

export const primitiveShadowTokens: NamedToken[] = shadowTokenEntries
  .filter(([label]) => !shadowAliasNames.includes(label))
  .map(toShadowToken);

export const semanticShadowTokens: NamedToken[] = shadowTokenEntries
  .filter(([label]) => shadowAliasNames.includes(label))
  .map(toShadowToken);

export const surfaceSamples = [
  { label: tokenCopy.surface.canvas, className: 'bg-surface-canvas border border-subtle' },
  { label: tokenCopy.surface.subtle, className: 'bg-surface-subtle border border-subtle' },
  {
    label: tokenCopy.surface.raised,
    className: 'bg-surface-raised border border-default shadow-raised',
  },
  {
    label: tokenCopy.surface.overlay,
    className: 'bg-surface-overlay border border-strong shadow-overlay',
  },
];

export const glassVariants = ['subtle', 'elevated', 'card', 'immersive'] as const;
export const glassVariantLabels: Record<(typeof glassVariants)[number], LocalizedText> = {
  subtle: tokenCopy.glassVariants.subtle,
  elevated: tokenCopy.glassVariants.elevated,
  card: tokenCopy.glassVariants.card,
  immersive: tokenCopy.glassVariants.immersive,
};
export const motionBaseGroups = [
  { label: tokenCopy.motion.durations, values: motionDurations },
  { label: tokenCopy.motion.easings, values: motionEasings },
] as const;

export const motionVariableGroups = [
  { label: tokenCopy.motion.feedback, values: motionRoles.feedback },
  { label: tokenCopy.motion.state, values: motionRoles.state },
  { label: tokenCopy.motion.spatial, values: motionRoles.spatial },
];

export const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2';
