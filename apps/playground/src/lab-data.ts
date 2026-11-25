import { motionDistances, motionDurations, motionEasings } from '@neoverse-ui/motion';
import { cssVariables } from '@neoverse-ui/tokens';
import { type LocalizedText, localized, localizedTerm, tokenCopy } from './playground-content';
import type { LayoutPreviewRole } from './playground-types';

export {
  type ColorToken,
  primitiveColorGroups,
  semanticColorGroups,
  type TokenGroup,
} from './lab-data/colors';

export interface TypographyToken {
  label: LocalizedText;
  className: string;
  variables: string[];
}

export interface NamedToken {
  label: LocalizedText;
  variable: string;
}

export interface LayoutRoleToken extends NamedToken {
  className: string;
  layoutRole: LayoutPreviewRole;
}

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
    localizedTerm('Display Large', '展示标题（大）'),
    'text-display-lg font-display leading-display-lg tracking-display-lg',
    typography.family.display,
    typography.scale.display.lg,
  ),
  typographyScaleToken(
    localizedTerm('Display Medium', '展示标题（中）'),
    'text-display-md font-display leading-display-md tracking-display-md',
    typography.family.display,
    typography.scale.display.md,
  ),
  typographyScaleToken(
    localizedTerm('Title Large', '标题（大）'),
    'text-title-lg font-title leading-title-lg tracking-title-lg',
    typography.family.title,
    typography.scale.title.lg,
  ),
  typographyScaleToken(
    localizedTerm('Title Medium', '标题（中）'),
    'text-title-md font-title leading-title-md tracking-title-md',
    typography.family.title,
    typography.scale.title.md,
  ),
  typographyScaleToken(
    localizedTerm('Title Small', '标题（小）'),
    'text-title-sm font-title leading-title-sm tracking-title-sm',
    typography.family.title,
    typography.scale.title.sm,
  ),
  typographyScaleToken(
    localizedTerm('Body Large', '正文（大）'),
    'text-body-lg font-body leading-body-lg tracking-body-lg',
    typography.family.body,
    typography.scale.body.lg,
  ),
  typographyScaleToken(
    localizedTerm('Body Medium', '正文（中）'),
    'text-body-md font-body leading-body-md tracking-body-md',
    typography.family.body,
    typography.scale.body.md,
  ),
  typographyScaleToken(
    localizedTerm('Body Small', '正文（小）'),
    'text-body-sm font-body leading-body-sm tracking-body-sm',
    typography.family.body,
    typography.scale.body.sm,
  ),
  typographyScaleToken(
    localizedTerm('Label Large', '标签（大）'),
    'text-label-lg font-label leading-label-lg tracking-label-lg',
    typography.family.label,
    typography.scale.label.lg,
  ),
  typographyScaleToken(
    localizedTerm('Label Medium', '标签（中）'),
    'text-label-md font-label leading-label-md tracking-label-md',
    typography.family.label,
    typography.scale.label.md,
  ),
  typographyScaleToken(
    localizedTerm('Label Small', '标签（小）'),
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

export const primitiveSpacingTokens = Object.entries(cssVariables.space).map(
  ([step, variable]) => ({
    step,
    variable,
  }),
);

export const semanticSpacingTokens = [
  {
    label: tokenCopy.spacing.inlineGutter,
    className: 'px-gutter-inline',
    variable: cssVariables.layout.gutter.inline,
    placement: 'inline',
  },
  {
    label: tokenCopy.spacing.blockGutter,
    className: 'py-gutter-block',
    variable: cssVariables.layout.gutter.block,
    placement: 'block',
  },
  {
    label: tokenCopy.spacing.gridGap,
    className: 'gap-grid',
    variable: cssVariables.layout.gridGap,
    placement: 'gap',
  },
] as const;

export const layoutRoleTokens: LayoutRoleToken[] = [
  {
    label: localized('Page max width', '页面最大宽度'),
    className: 'max-w-page',
    variable: cssVariables.layout.page.maxWidth,
    layoutRole: 'page',
  },
  {
    label: localized('Content max width', '内容最大宽度'),
    className: 'max-w-content',
    variable: cssVariables.layout.contentMaxWidth,
    layoutRole: 'content',
  },
  {
    label: localized('Reading width', '阅读宽度'),
    className: 'max-w-reading',
    variable: cssVariables.layout.reading.width,
    layoutRole: 'reading',
  },
  {
    label: localized('Wide reading width', '宽阅读宽度'),
    className: 'max-w-reading-wide',
    variable: cssVariables.layout.reading.wideWidth,
    layoutRole: 'reading-wide',
  },
  {
    label: localized('Page inline padding', '页面横向留白'),
    className: 'px-page-inline',
    variable: cssVariables.layout.page.paddingInline,
    layoutRole: 'padding-inline',
  },
  {
    label: localized('Page block padding', '页面纵向留白'),
    className: 'py-page-block',
    variable: cssVariables.layout.page.paddingBlock,
    layoutRole: 'padding-block',
  },
  {
    label: localized('Sidebar width', '侧栏宽度'),
    className: 'w-sidebar',
    variable: cssVariables.layout.sidebar.width,
    layoutRole: 'sidebar',
  },
  {
    label: localized('Sidebar drawer width', '侧栏抽屉宽度'),
    className: 'w-sidebar-drawer',
    variable: cssVariables.layout.sidebar.drawerWidth,
    layoutRole: 'sidebar-drawer',
  },
  {
    label: localized('Header minimum height', '顶栏最小高度'),
    className: 'min-h-header',
    variable: cssVariables.layout.headerMinHeight,
    layoutRole: 'header',
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

export const glassVariants = ['subtle', 'elevated', 'immersive'] as const;
export const glassVariantLabels: Record<(typeof glassVariants)[number], LocalizedText> = {
  subtle: tokenCopy.glassVariants.subtle,
  elevated: tokenCopy.glassVariants.elevated,
  immersive: tokenCopy.glassVariants.immersive,
};
export const motionBaseGroups = [
  { label: tokenCopy.motion.durations, values: motionDurations },
  { label: tokenCopy.motion.easings, values: motionEasings },
  { label: tokenCopy.motion.distances, values: motionDistances },
] as const;
