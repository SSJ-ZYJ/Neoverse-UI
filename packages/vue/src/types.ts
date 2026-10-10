import type { PresenceOrigin, PresenceVariant } from '@neoverse-ui/motion';
import type { OverlayPlacement } from '@neoverse-ui/overlay-runtime';
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
  | 'glass-immersive';

export type ControlSurfacePreset = Extract<SurfacePreset, 'none' | 'glass-subtle'>;
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
export type BadgeSize = 'sm' | 'md';

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

export interface TableProps {
  caption?: string;
  striped?: boolean;
  hoverable?: boolean;
}

export interface DisclosureProps {
  summary: string;
  open?: boolean;
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

export type FormControlValue = string | number;

export type FormControlValidation = 'none' | 'error' | 'warning' | 'success';

export interface FormControlStateProps {
  validation?: FormControlValidation;
  disabled?: boolean;
  readonly?: boolean;
}

export interface InputProps extends FormControlStateProps {
  modelValue?: FormControlValue;
}

export interface TextareaProps extends FormControlStateProps {
  modelValue?: string;
}

export interface SelectOption {
  value: FormControlValue;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends FormControlStateProps {
  modelValue?: FormControlValue;
  options: readonly SelectOption[];
  placeholder?: string;
}

export interface CheckboxProps extends FormControlStateProps {
  modelValue?: boolean;
}

export interface RadioOption {
  value: FormControlValue;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends FormControlStateProps {
  modelValue?: FormControlValue;
  options: readonly RadioOption[];
  name?: string;
  ariaLabel?: string;
}

export interface SwitchProps extends FormControlStateProps {
  modelValue?: boolean;
}

export interface FieldControlAttrs {
  id?: string;
  'aria-describedby'?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface FieldProps {
  controlId?: string;
  descriptionId?: string;
  messageId?: string;
  label?: string;
  description?: string;
  message?: string;
  validation?: FormControlValidation;
  required?: boolean;
  disabled?: boolean;
}

export interface PopoverProps {
  open?: boolean | undefined;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: OverlayPlacement;
  matchTriggerWidth?: boolean;
  ariaLabel?: string;
}

export type DropdownMenuItemTone = 'default' | 'danger';

export interface DropdownMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  tone?: DropdownMenuItemTone;
}

export interface DropdownMenuProps {
  items: readonly DropdownMenuItem[];
  open?: boolean | undefined;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: OverlayPlacement;
  ariaLabel: string;
}

export interface PresenceProps {
  show: boolean;
  variant?: PresenceVariant;
  origin?: PresenceOrigin;
  as?: string;
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
