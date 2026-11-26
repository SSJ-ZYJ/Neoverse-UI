import type { ControlSurfacePreset, SurfacePreset } from '@neoverse-ui/tokens';
import type { Component } from 'vue';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'warning'
  | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

export type { ControlSurfacePreset, SurfacePreset } from '@neoverse-ui/tokens';
export type GlassNestingMode = 'inherit' | 'local';
export type SurfaceOverflowMode = 'clip' | 'visible';

export interface SurfaceProps {
  as?: string | Component;
  surface?: SurfacePreset;
  glassNesting?: GlassNestingMode;
  contentOverflow?: SurfaceOverflowMode;
}

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
  stretch?: boolean;
  surface?: ControlSurfacePreset;
}

export type ActionSize = 'sm' | 'md' | 'lg';
export type ActionScale = 'md' | 'lg';

export interface ActionProps {
  as?: string | Component;
  href?: string;
  variant?: ButtonVariant;
  size?: ActionSize;
  scale?: ActionScale;
  type?: ButtonType;
  disabled?: boolean;
  stretch?: boolean;
  surface?: ControlSurfacePreset;
}

export type NavigationIndicatorPlacement = 'bottom' | 'start';

export interface NavigationItemProps {
  as?: string | Component;
  href?: string;
  label: string;
  size?: ActionSize;
  active?: boolean;
  compact?: boolean;
  disabled?: boolean;
  stretch?: boolean;
  surface?: ControlSurfacePreset;
  indicatorPlacement?: NavigationIndicatorPlacement;
}

export interface BreadcrumbItem {
  id?: string;
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps {
  items: readonly BreadcrumbItem[];
  ariaLabel?: string;
  separator?: string;
}

export interface IconButtonProps {
  as?: string | Component;
  href?: string;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
  stretch?: boolean;
  surface?: ControlSurfacePreset;
}

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export type SurfaceHoverMode = 'auto' | 'static';
export type SurfaceEdgeMode = 'auto' | 'local';
export type ControlSurfaceScale = 'md' | 'lg';

export interface ControlSurfaceProps {
  /** Move one indicator between content-sized navigation items. */
  navigationIndicator?: boolean;
  as?: string | Component;
  surface?: SurfacePreset;
  hoverMode?: SurfaceHoverMode;
  edgeMode?: SurfaceEdgeMode;
  /** Uniformly scale the whole grouped control while preserving internal proportions. */
  scale?: ControlSurfaceScale;
}

export interface DockProps {
  as?: string | Component;
  surface?: SurfacePreset;
  hoverMode?: SurfaceHoverMode;
  edgeMode?: SurfaceEdgeMode;
  scale?: ControlSurfaceScale;
  compact?: boolean;
  navigationIndicator?: boolean;
}

export interface CardProps {
  as?: string | Component;
  surface?: SurfacePreset;
}

export interface SegmentOption {
  value: string;
  label: string;
  disabled?: boolean;
  ariaLabel?: string;
  icon?: Component;
}

export type SegmentedControlSize = 'sm';
export type SegmentedControlShape = 'pill' | 'rounded';
/** Select the presentation without changing the radio behavior */
export type SegmentedControlVariant = 'text' | 'icon' | 'language';

export interface SegmentedControlProps {
  options: readonly SegmentOption[];
  modelValue?: string;
  defaultValue?: string;
  size?: SegmentedControlSize;
  shape?: SegmentedControlShape;
  variant?: SegmentedControlVariant;
  disabled?: boolean;
  ariaLabel?: string;
  surface?: ControlSurfacePreset;
}
