import type { SurfacePreset } from '@neoverse-ui/tokens';
import { createElement, type HTMLAttributes, type ReactNode } from 'react';
import { mergeClassNames } from '../../internal.js';
import {
  type ControlSurfaceScale,
  type SurfaceEdgeMode,
  type SurfaceHoverMode,
  UiControlSurface,
  type UiControlSurfaceProps,
} from '../surfaces/control-surface.js';

export interface UiDockProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Native tag or React component that forwards the Dock's attributes and children */
  as?: NonNullable<UiControlSurfaceProps['as']>;
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
