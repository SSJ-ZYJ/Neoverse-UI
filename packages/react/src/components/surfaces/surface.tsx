import { getSurfaceClass, type SurfacePreset } from '@neoverse-ui/tokens';
import { createElement, type ElementType, type HTMLAttributes } from 'react';
import { mergeClassNames } from '../../internal.js';

export interface UiSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  surface?: SurfacePreset;
  glassNesting?: 'inherit' | 'local';
  contentOverflow?: 'clip' | 'visible';
}

export function UiSurface({
  as = 'div',
  surface = 'none',
  glassNesting = 'local',
  contentOverflow = 'clip',
  className,
  children,
  ...rest
}: UiSurfaceProps) {
  return createElement(
    as,
    {
      ...rest,
      className: mergeClassNames('ui-surface', getSurfaceClass(surface, 'panel'), className),
      'data-surface': surface,
      'data-neoverse-glass-nesting': glassNesting,
      'data-neoverse-surface-overflow': contentOverflow,
    },
    children,
  );
}
