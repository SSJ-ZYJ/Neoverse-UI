import type { HTMLAttributes } from 'react';
import type { BadgeVariant } from './badge.js';

export type StatusIndicatorStatus = BadgeVariant;
export type StatusIndicatorSize = 'sm' | 'md';

export interface UiStatusIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  status?: StatusIndicatorStatus;
  size?: StatusIndicatorSize;
  pulse?: boolean;
  loading?: boolean;
}

export function UiStatusIndicator({
  status = 'neutral',
  size = 'sm',
  pulse = false,
  loading = false,
  className = '',
  children,
  ...rest
}: UiStatusIndicatorProps) {
  return (
    <span
      {...rest}
      className={`ui-status-indicator ui-status-indicator--${status} ui-status-indicator--${size}${pulse && !loading ? ' ui-status-indicator--pulse' : ''}${loading ? ' ui-status-indicator--loading' : ''} ${className}`}
    >
      <i className="ui-status-indicator__dot" aria-hidden="true" />
      <span className="ui-status-indicator__label">{children}</span>
    </span>
  );
}
