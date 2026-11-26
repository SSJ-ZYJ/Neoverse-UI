import { getSurfaceClass, type SurfacePreset } from '@neoverse-ui/tokens';
import { type ComponentPropsWithRef, createElement, type ElementType } from 'react';
import { mergeClassNames } from '../../internal.js';

export type UiCardProps<T extends ElementType = 'div'> = {
  as?: T;
  surface?: SurfacePreset;
  className?: string;
} & Omit<ComponentPropsWithRef<T>, 'as' | 'className' | 'surface'>;

/** Surface-backed card geometry; the consumer owns the native or routed root element. */
export function UiCard<T extends ElementType = 'div'>(props: UiCardProps<T>) {
  const { as, surface = 'auto', className, ...rest } = props;

  return createElement(as ?? 'div', {
    ...rest,
    className: mergeClassNames('ui-card', getSurfaceClass(surface, 'panel'), className),
    'data-surface': surface,
  });
}
