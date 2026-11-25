import {
  type ComponentPropsWithRef,
  createElement,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { mergeClassNames } from '../internal.js';
import { UiControlSurface } from '../navigation.js';
import { type SurfacePreset, surfaceClasses } from '../surface.js';
import type { ControlSurfaceScale, SurfaceEdgeMode, SurfaceHoverMode } from './shared.js';

export interface UiDockProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  as?: 'nav' | 'div';
  surface?: SurfacePreset;
  scale?: ControlSurfaceScale;
  compact?: boolean;
  hoverMode?: SurfaceHoverMode;
  edgeMode?: SurfaceEdgeMode;
  navigationIndicator?: boolean;
  trailing?: ReactNode;
  children?: ReactNode;
}

/** Reusable Dock shell. Product routing, navigation semantics, and trailing controls stay caller-owned. */
export function UiDock({
  as = 'nav',
  surface = 'glass-elevated',
  scale = 'lg',
  compact = false,
  hoverMode = 'static',
  edgeMode = 'auto',
  navigationIndicator = true,
  trailing,
  children,
  className,
  ...rest
}: UiDockProps) {
  return createElement(
    UiControlSurface,
    {
      ...rest,
      as,
      surface,
      scale,
      hoverMode,
      edgeMode,
      navigationIndicator,
      trailing,
      className: mergeClassNames('ui-dock', compact && 'ui-dock--compact', className),
    },
    children,
  );
}

export interface BreadcrumbItem {
  id?: string;
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbRenderState {
  item: BreadcrumbItem;
  index: number;
  current: boolean;
}

export interface UiBreadcrumbProps
  extends Omit<ComponentPropsWithRef<'nav'>, 'aria-label' | 'children'> {
  items: readonly BreadcrumbItem[];
  ariaLabel?: string;
  separator?: ReactNode;
  renderItem?: (state: BreadcrumbRenderState) => ReactNode;
}

/** Compact route hierarchy with native breadcrumb semantics and local overflow handling. */
export function UiBreadcrumb({
  items,
  ariaLabel = 'Breadcrumb',
  separator = '›',
  renderItem,
  className,
  ...rest
}: UiBreadcrumbProps) {
  const explicitCurrentIndex = items.findIndex((item) => item.current === true);

  return (
    <nav {...rest} aria-label={ariaLabel} className={mergeClassNames('ui-breadcrumb', className)}>
      <ol className="ui-breadcrumb__list">
        {items.map((item, index) => {
          const current =
            explicitCurrentIndex >= 0 ? index === explicitCurrentIndex : index === items.length - 1;
          const content =
            renderItem?.({ item, index, current }) ??
            (current ? (
              <span className="ui-breadcrumb__current" aria-current="page" title={item.label}>
                {item.label}
              </span>
            ) : item.href !== undefined ? (
              <a className="ui-breadcrumb__link" href={item.href} title={item.label}>
                {item.label}
              </a>
            ) : (
              <span className="ui-breadcrumb__label" title={item.label}>
                {item.label}
              </span>
            ));

          return (
            <li
              className="ui-breadcrumb__item"
              key={item.id ?? `${item.href ?? item.label}-${index}`}
            >
              {index > 0 ? (
                <span className="ui-breadcrumb__separator" aria-hidden="true">
                  {separator}
                </span>
              ) : null}
              {content}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

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
      className: mergeClassNames('ui-surface', surfaceClasses[surface], className),
      'data-surface': surface,
      'data-neoverse-glass-nesting': glassNesting,
      'data-neoverse-surface-overflow': contentOverflow,
    },
    children,
  );
}

export type UiCardProps<T extends ElementType = 'div'> = {
  as?: T;
  surface?: SurfacePreset;
  className?: string;
} & Omit<ComponentPropsWithRef<T>, 'as' | 'className' | 'surface'>;

/** Surface-backed card geometry; the consumer owns the native or routed root element. */
export function UiCard<T extends ElementType = 'div'>(props: UiCardProps<T>) {
  const { as, surface = 'glass-elevated', className, ...rest } = props;

  return createElement(as ?? 'div', {
    ...rest,
    className: mergeClassNames('ui-card', surfaceClasses[surface], className),
    'data-surface': surface,
  });
}
