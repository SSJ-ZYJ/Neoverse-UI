import { cloneElement, type ReactElement, type ReactNode } from 'react';
import { UiAction, type UiActionProps } from '../actions/action.js';

export type NavigationIndicatorPlacement = 'bottom' | 'start';
export interface UiNavigationItemProps
  extends Omit<UiActionProps, 'variant' | 'children' | 'leading'> {
  label: string;
  active?: boolean;
  compact?: boolean;
  indicatorPlacement?: NavigationIndicatorPlacement;
  icon?: ReactNode;
  /** Content inside the label, also included in its compact accessible text */
  suffix?: ReactNode;
  children?: ReactElement<{ children?: ReactNode }>;
}

export function UiNavigationItem({
  label,
  active = false,
  compact = false,
  stretch = false,
  surface = 'none',
  indicatorPlacement = 'bottom',
  icon,
  suffix,
  decoration,
  asChild = false,
  children,
  className = '',
  ...rest
}: UiNavigationItemProps) {
  if (asChild && !children)
    throw new Error('UiNavigationItem with asChild expects one routed element.');
  const content = (
    <span className={`ui-navigation-item__label${compact ? ' sr-only' : ''}`}>
      {label}
      {suffix}
    </span>
  );
  const indicator = <span className="ui-navigation-item__indicator" aria-hidden="true" />;
  return (
    <UiAction
      {...rest}
      asChild={asChild}
      variant="ghost"
      stretch={stretch}
      surface={surface}
      aria-current={rest['aria-current'] ?? (active ? 'page' : undefined)}
      className={`ui-navigation-item${active ? ' ui-navigation-item--active' : ''}${compact ? ' ui-navigation-item--compact' : ''}${stretch ? ' ui-navigation-item--stretch' : ''}${indicatorPlacement === 'start' ? ' ui-navigation-item--indicator-start' : ''} ${className}`}
      leading={icon}
      decoration={
        decoration == null ? (
          indicator
        ) : (
          <>
            {decoration}
            {indicator}
          </>
        )
      }
    >
      {asChild && children ? cloneElement(children, undefined, content) : content}
    </UiAction>
  );
}
