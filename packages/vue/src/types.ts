import type { Component } from 'vue';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

export type SurfacePreset =
  | 'none'
  | 'solid'
  | 'subtle'
  | 'elevated'
  | 'inset'
  | 'chrome'
  | 'glass-subtle'
  | 'glass-elevated'
  | 'glass-card'
  | 'glass-immersive';

export type ControlSurfacePreset = Extract<SurfacePreset, 'none' | 'glass-subtle'>;

export interface SurfaceProps {
  as?: string | Component;
  surface?: SurfacePreset;
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
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export type GlassSurfaceVariant = 'subtle' | 'elevated' | 'card' | 'immersive';
export type SurfaceHoverMode = 'auto' | 'static';
export type SurfaceEdgeMode = 'auto' | 'local';
export type ControlSurfaceScale = 'md' | 'lg';

export interface GlassSurfaceProps {
  as?: string | Component;
  variant?: GlassSurfaceVariant;
}
export interface ControlSurfaceProps {
  /** Move one indicator between content-sized navigation items. */
  navigationIndicator?: boolean;
  as?: string | Component;
  variant?: GlassSurfaceVariant;
  surface?: SurfacePreset;
  hoverMode?: SurfaceHoverMode;
  edgeMode?: SurfaceEdgeMode;
  /** Uniformly scale the whole grouped control while preserving internal proportions. */
  scale?: ControlSurfaceScale;
}

export interface CardProps {
  as?: string | Component;
  surface?: SurfacePreset;
}

export type StatusIndicatorStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type StatusIndicatorSize = 'sm' | 'md';
export type NoticeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface NoticeProps {
  as?: string | Component;
  variant?: NoticeVariant;
}

export type TooltipSurfaceVariant = 'neutral' | 'accent';

export interface TooltipSurfaceProps {
  as?: string | Component;
  variant?: TooltipSurfaceVariant;
}

export interface StatusIndicatorProps {
  status?: StatusIndicatorStatus;
  size?: StatusIndicatorSize;
  pulse?: boolean;
  loading?: boolean;
}

export interface SegmentOption {
  value: string;
  label: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export type SegmentedControlSize = 'sm';

export interface SegmentedControlProps {
  options: readonly SegmentOption[];
  modelValue?: string;
  defaultValue?: string;
  size?: SegmentedControlSize;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  surface?: ControlSurfacePreset;
}

export type SkeletonVariant = 'text' | 'title' | 'avatar' | 'circle' | 'rect';
export type SkeletonEffect = 'shimmer' | 'pulse' | 'none';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  effect?: SkeletonEffect;
  width?: string | number;
  height?: string | number;
  radius?: string;
}

export interface ScrollbarProps {
  autoHideMs?: number;
  minThumbRatio?: number;
  refreshKey?: string | number;
  hideNative?: boolean;
}
