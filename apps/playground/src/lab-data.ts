import { motionDurations, motionEasings, motionTransitions } from '@neoverse-ui/motion';
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
const primitiveColorFamilies = ['neutral', 'blue', 'cyan', 'mint', 'red', 'amber', 'green'] as const;
const primitiveColorGroup = (family: (typeof primitiveColorFamilies)[number]): TokenGroup<NamedToken> => ({
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

export const typographyTokens: TypographyToken[] = [
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

const radiusAliasNames = ['control', 'card', 'panel'];
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

export const glassVariants = ['subtle', 'elevated', 'immersive'] as const;
export const glassVariantLabels: Record<(typeof glassVariants)[number], LocalizedText> = {
  subtle: tokenCopy.glassVariants.subtle,
  elevated: tokenCopy.glassVariants.elevated,
  immersive: tokenCopy.glassVariants.immersive,
};
export const motionBaseGroups = [
  { label: tokenCopy.motion.durations, values: motionDurations },
  { label: tokenCopy.motion.easings, values: motionEasings },
] as const;

export const motionSamples = [
  {
    label: tokenCopy.motion.micro,
    className: 'transition-colors duration-fast ease-standard hover:bg-surface-raised',
    duration: motionDurations.fast,
    easing: motionEasings.standard,
    transition: motionTransitions.micro,
  },
  {
    label: tokenCopy.motion.state,
    className: 'transition-opacity duration-standard ease-standard hover:opacity-80',
    duration: motionDurations.standard,
    easing: motionEasings.standard,
    transition: motionTransitions.state,
  },
  {
    label: tokenCopy.motion.spatial,
    className: 'transition-transform duration-expressive ease-emphasized hover:translate-x-1',
    duration: motionDurations.expressive,
    easing: motionEasings.emphasized,
    transition: motionTransitions.spatial,
  },
];

export const motionVariableGroups = [
  { label: tokenCopy.motion.micro, values: motionTransitions.micro },
  { label: tokenCopy.motion.state, values: motionTransitions.state },
  { label: tokenCopy.motion.spatial, values: motionTransitions.spatial },
];

export const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2';
