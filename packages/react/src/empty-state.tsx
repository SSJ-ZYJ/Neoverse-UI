import { type HTMLAttributes, type ReactNode, useId } from 'react';

export interface UiEmptyStateProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function UiEmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...rest
}: UiEmptyStateProps) {
  const id = useId();
  return (
    <section
      {...rest}
      className={['ui-empty-state', className].filter(Boolean).join(' ')}
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
    </section>
  );
}
