import type { HTMLAttributes, ReactNode } from 'react';
import { UiBadge } from '../display/badge.js';
import { UiSurface } from '../surfaces/surface.js';

export type StepFlowStatus = 'pending' | 'current' | 'complete';
export interface StepFlowItem {
  id: string;
  title: string;
  description?: string;
  status?: StepFlowStatus;
  statusLabel?: string;
}
export interface UiStepFlowProps extends HTMLAttributes<HTMLOListElement> {
  items: readonly StepFlowItem[];
  ariaLabel?: string;
  renderItem?: (state: { item: StepFlowItem; index: number }) => ReactNode;
  renderStatus?: (state: { item: StepFlowItem; index: number }) => ReactNode;
}

export function UiStepFlow({
  items,
  ariaLabel,
  renderItem,
  renderStatus,
  className = '',
  ...rest
}: UiStepFlowProps) {
  return (
    <ol
      {...rest}
      aria-label={ariaLabel ?? rest['aria-label']}
      className={`ui-step-flow ${className}`}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          className={`ui-step-flow__item${item.status ? ` ui-step-flow__item--${item.status}` : ''}`}
          aria-current={item.status === 'current' ? 'step' : undefined}
        >
          <UiSurface
            as="span"
            surface="glass-subtle"
            className="ui-step-flow__marker"
            aria-hidden="true"
          >
            {item.status === 'complete' ? (
              <svg
                className="ui-step-flow__status-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            ) : (
              index + 1
            )}
          </UiSurface>
          <UiSurface surface="glass-subtle" className="ui-step-flow__content">
            {renderItem ? (
              renderItem({ item, index })
            ) : (
              <>
                <p className="ui-step-flow__title">{item.title}</p>
                {item.description !== undefined ? (
                  <p className="ui-step-flow__description">{item.description}</p>
                ) : null}
              </>
            )}
            {item.statusLabel || renderStatus ? (
              <span className="ui-step-flow__status">
                {renderStatus ? (
                  renderStatus({ item, index })
                ) : item.status === 'current' ? (
                  <UiBadge variant="info">{item.statusLabel}</UiBadge>
                ) : (
                  item.statusLabel
                )}
              </span>
            ) : null}
          </UiSurface>
        </li>
      ))}
    </ol>
  );
}
