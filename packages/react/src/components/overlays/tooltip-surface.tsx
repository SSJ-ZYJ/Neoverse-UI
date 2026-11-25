import { presenceAppearClassName, presenceDataAttribute } from '@neoverse-ui/motion';
import { createElement, type ElementType, type HTMLAttributes } from 'react';

export type TooltipSurfaceVariant = 'neutral' | 'accent';

export interface UiTooltipSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: TooltipSurfaceVariant;
}

export function UiTooltipSurface({
  as = 'div',
  variant = 'neutral',
  className = '',
  children,
  ...rest
}: UiTooltipSurfaceProps) {
  return createElement(
    as,
    {
      ...rest,
      [presenceDataAttribute]: 'veil',
      className: `ui-tooltip-surface ${presenceAppearClassName} material-glass-subtle ui-tooltip-surface--${variant} ${className}`,
      'data-surface': 'glass-subtle',
      'data-neoverse-surface-hover': 'static',
      'data-neoverse-surface-overflow': 'visible',
      'data-neoverse-tooltip-surface': '',
    },
    <span className={`ui-tooltip-surface__content ${presenceAppearClassName}`}>{children}</span>,
  );
}
