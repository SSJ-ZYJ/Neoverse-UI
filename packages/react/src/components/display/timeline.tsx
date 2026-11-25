import type { HTMLAttributes, ReactNode } from 'react';
import { UiSurface } from '../surfaces/surface.js';

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
