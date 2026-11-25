import { cssVariables } from '@neoverse-ui/tokens';
import { type LocalizedText, localized, localizedTerm, tokenCopy } from '../playground-content';

export interface ColorToken {
  label: LocalizedText;
  variable: string;
  className: string;
}

export interface TokenGroup<T> {
  label: LocalizedText;
  items: T[];
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

export const primitiveColorGroups = [
  ...primitiveColorFamilies.map((family) => ({
    label: localized(family, family),
    pattern: `--neoverse-color-${family}-*`,
    items: Object.entries(color.primitive[family]).map(([step, variable]) => ({
      step,
      variable,
    })),
  })),
  {
    label: localizedTerm('Utility', '通用色'),
    pattern: '--neoverse-color-*',
    items: (['white', 'black', 'transparent'] as const).map((step) => ({
      step,
      variable: color.primitive[step],
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
