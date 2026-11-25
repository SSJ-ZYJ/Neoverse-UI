import { type HTMLAttributes, type ReactNode, useId } from 'react';
import { UiSurface } from '../surfaces/surface.js';

export interface UiEmptyStateProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  title: string;
  description?: string;
  variant?: 'default' | 'outlined' | 'compact' | 'subtle';
  icon?: ReactNode;
  action?: ReactNode;
}

export function UiEmptyState({
  title,
  description,
  variant = 'default',
  icon,
  action,
  className,
  ...rest
}: UiEmptyStateProps) {
  const id = useId();
  return (
    <UiSurface
      {...rest}
      as="section"
      className={['ui-empty-state', className].filter(Boolean).join(' ')}
      surface={variant === 'default' ? 'glass-elevated' : variant === 'subtle' ? 'subtle' : 'none'}
      data-empty-state-variant={variant}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
    >
      {icon != null && (
        <div className="ui-empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="ui-empty-state__content">
        <h3 className="ui-empty-state__title" id={`${id}-title`}>
          {title}
        </h3>
        {description && (
          <p className="ui-empty-state__description" id={`${id}-description`}>
            {description}
          </p>
        )}
      </div>
      {action != null && <div className="ui-empty-state__action">{action}</div>}
    </UiSurface>
  );
}
