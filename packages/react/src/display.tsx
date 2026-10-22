import { presenceAppearClassName, presenceDataAttribute } from '@neoverse-ui/motion';
import {
  type CSSProperties,
  createElement,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { type SurfacePreset, UiSurface } from './index';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md' | 'lg';
export type StatusIndicatorStatus = BadgeVariant;
export type StatusIndicatorSize = 'sm' | 'md';
export type TooltipSurfaceVariant = 'neutral' | 'accent';
export type SkeletonVariant = 'text' | 'title' | 'avatar' | 'circle' | 'rect';
export type SkeletonEffect = 'shimmer' | 'pulse' | 'none';

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

export interface UiSkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: SkeletonVariant;
  effect?: SkeletonEffect;
  width?: string | number;
  height?: string | number;
  radius?: string;
}

export function UiSkeleton({
  variant = 'text',
  effect = 'shimmer',
  width,
  height,
  radius,
  style,
  className = '',
  ...rest
}: UiSkeletonProps) {
  return (
    <span
      {...rest}
      aria-hidden="true"
      data-effect={effect}
      className={`ui-skeleton skeleton-surface ui-skeleton--${variant} ui-skeleton--${effect === 'none' ? 'static' : effect} ${className}`}
      style={
        {
          ...style,
          ...(width === undefined ? {} : { width }),
          ...(height === undefined ? {} : { height }),
          ...(variant === 'rect' && radius !== undefined ? { '--ui-skeleton-radius': radius } : {}),
        } as CSSProperties
      }
    />
  );
}

export interface UiStatCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode;
  value: ReactNode;
  unit?: string;
  trend?: ReactNode;
  footnote?: ReactNode;
  surface?: SurfacePreset;
}

export function UiStatCard({
  label,
  value,
  unit,
  trend,
  footnote,
  surface = 'glass-elevated',
  className = '',
  ...rest
}: UiStatCardProps) {
  return (
    <UiSurface {...rest} surface={surface} className={`ui-stat-card ${className}`}>
      <dl className="ui-stat-card__metric">
        <dt className="ui-stat-card__label">{label}</dt>
        <dd className="ui-stat-card__value">
          {value}
          {unit ? <span className="ui-stat-card__unit">{unit}</span> : null}
        </dd>
      </dl>
      {trend != null ? <p className="ui-stat-card__trend">{trend}</p> : null}
      {footnote != null ? <p className="ui-stat-card__footnote">{footnote}</p> : null}
    </UiSurface>
  );
}

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  dateTime?: string;
}

export interface UiTimelineProps extends HTMLAttributes<HTMLOListElement> {
  items: readonly TimelineItem[];
  ariaLabel?: string;
  renderItem?: (state: { item: TimelineItem; index: number }) => ReactNode;
}

export function UiTimeline({
  items,
  ariaLabel,
  renderItem,
  className = '',
  ...rest
}: UiTimelineProps) {
  return (
    <ol
      {...rest}
      aria-label={ariaLabel ?? rest['aria-label']}
      className={`ui-timeline ${className}`}
    >
      {items.map((item, index) => (
        <li key={item.id} className="ui-timeline__item">
          <UiSurface
            as="span"
            surface="glass-subtle"
            className="ui-timeline__node"
            aria-hidden="true"
          />
          <UiSurface surface="glass-subtle" className="ui-timeline__content">
            {renderItem ? (
              renderItem({ item, index })
            ) : (
              <>
                {item.time ? (
                  <time className="ui-timeline__time" dateTime={item.dateTime || undefined}>
                    {item.time}
                  </time>
                ) : null}
                <p className="ui-timeline__title">{item.title}</p>
                {item.description ? (
                  <p className="ui-timeline__description">{item.description}</p>
                ) : null}
              </>
            )}
          </UiSurface>
        </li>
      ))}
    </ol>
  );
}

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
