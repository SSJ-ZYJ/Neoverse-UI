import { attachSelectionIndicator } from '@neoverse-ui/motion';
import { type HTMLAttributes, useEffect, useRef } from 'react';

export interface UiPaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  page: number;
  totalPages: number;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
  onPageChange: (page: number) => void;
}

export function UiPagination({
  page,
  totalPages,
  ariaLabel,
  previousLabel,
  nextLabel,
  pageLabel,
  onPageChange,
  className,
  ...rest
}: UiPaginationProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const track = trackRef.current;
    const indicator = indicatorRef.current;
    if (!track || !indicator) return;
    return attachSelectionIndicator(track, indicator, '[aria-current="page"]');
  }, []);
  const count = Number.isFinite(totalPages) ? Math.max(0, Math.floor(totalPages)) : 0;
  const current = count === 0 ? 0 : Math.min(Math.max(1, Math.floor(page)), count);
  const picked = new Set(count === 0 ? [] : [1, count]);
  const start = current <= 5 ? 1 : current >= count - 4 ? count - 4 : current - 2;
  const end = current <= 5 ? 5 : current >= count - 4 ? count : current + 2;
  for (let index = Math.max(1, start); index <= Math.min(count, end); index += 1) {
    picked.add(index);
  }
  const sorted = [...picked].filter((value) => value > 0).sort((a, b) => a - b);
  const pages: Array<number | { after: number }> = [];
  let previous = 0;
  for (const number of sorted) {
    if (previous > 0 && number - previous === 2) pages.push(previous + 1);
    else if (previous > 0 && number - previous > 2) pages.push({ after: previous });
    pages.push(number);
    previous = number;
  }
  const change = (next: number) => {
    if (count > 0 && next >= 1 && next <= count && next !== current) onPageChange(next);
  };
  return (
    <nav
      {...rest}
      className={['ui-pagination', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="ui-pagination__button"
        aria-label={previousLabel}
        disabled={current <= 1}
        onClick={() => change(current - 1)}
      >
        <span aria-hidden="true">‹</span>
      </button>
      <div ref={trackRef} className="ui-pagination__pages">
        <span
          ref={indicatorRef}
          className="ui-pagination__indicator"
          aria-hidden="true"
          data-ready="false"
        />
        {pages.map((entry) =>
          typeof entry === 'object' ? (
            <span
              key={`gap-after-${entry.after}`}
              className="ui-pagination__ellipsis"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              data-neoverse-motion="fade"
              className={[
                'ui-pagination__button nv-appear',
                entry === current && 'ui-pagination__button--current',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={`${pageLabel} ${entry}`}
              aria-current={entry === current ? 'page' : undefined}
              onClick={() => change(entry)}
            >
              {entry}
            </button>
          ),
        )}
      </div>
      <button
        type="button"
        className="ui-pagination__button"
        aria-label={nextLabel}
        disabled={current === 0 || current >= count}
        onClick={() => change(current + 1)}
      >
        <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
