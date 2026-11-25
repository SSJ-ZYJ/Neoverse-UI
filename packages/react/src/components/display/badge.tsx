import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface UiBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function UiBadge({
  variant = 'neutral',
  size = 'sm',
  className = '',
  children,
  ...rest
}: UiBadgeProps) {
  const spacing = { sm: 'px-2 py-1', md: 'px-3 py-1', lg: 'px-4 py-2' }[size];
  return (
    <span
      {...rest}
      className={`ui-badge inline-flex items-center rounded-pill ui-badge--${variant} ui-badge--${size} ${spacing} ${className}`}
    >
      <span className="ui-badge__label">{children}</span>
    </span>
  );
}
