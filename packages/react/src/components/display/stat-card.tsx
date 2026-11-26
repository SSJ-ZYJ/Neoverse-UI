import type { SurfacePreset } from '@neoverse-ui/tokens';
import type { HTMLAttributes, ReactNode } from 'react';
import { UiSurface } from '../surfaces/surface.js';

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
  surface = 'auto',
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
