import type { PresenceOrigin, PresenceVariant } from '@neoverse-ui/motion';
import type { OverlayPlacement, OverlayPoint } from '@neoverse-ui/overlay-runtime';
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
  | 'glass-subtle'
  | 'glass-elevated'
  | 'glass-immersive';

export type ControlSurfacePreset = Extract<
  SurfacePreset,
  'none' | 'glass-subtle' | 'glass-elevated' | 'glass-immersive'
>;
export type GlassNestingMode = 'inherit' | 'local';
export type SurfaceOverflowMode = 'clip' | 'visible';

export interface SurfaceProps {
  as?: string | Component;
  surface?: SurfacePreset;
  glassNesting?: GlassNestingMode;
  contentOverflow?: SurfaceOverflowMode;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  footnote?: string;
  surface?: SurfacePreset;
}

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  dateTime?: string;
}

export interface TimelineProps {
  items: readonly TimelineItem[];
  ariaLabel?: string;
}

export type StepFlowStatus = 'pending' | 'current' | 'complete';

export interface StepFlowItem {
  id: string;
  title: string;
  description?: string;
  status?: StepFlowStatus;
  statusLabel?: string;
}

export interface StepFlowProps {
  items: readonly StepFlowItem[];
  ariaLabel?: string;
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
  incrementLabel?: string;
  decrementLabel?: string;
}

export type TerminalPromptTone = 'host' | 'path' | 'branch' | 'runtime' | 'time';

export interface TerminalPromptSegment {
  id: string;
  label: string;
  tone?: TerminalPromptTone;
}

export interface TerminalPromptProps {
  id?: string;
  label: string;
  modelValue?: string;
  /** Full suggested value. Only the suffix is displayed; acceptance belongs to the consumer. */
  suggestion?: string;
  type?: 'text' | 'password' | 'search';
  symbol?: string;
  segments?: readonly TerminalPromptSegment[];
  disabled?: boolean;
  readonly?: boolean;
  error?: boolean;
}

export interface TerminalEchoProps {
  /** Recorded command text. Rendered as plain text; never interpreted. */
  text: string;
  symbol?: string;
  segments?: readonly TerminalPromptSegment[];
  error?: boolean;
}

export interface TerminalSurfaceProps {
  title: string;
  ariaLabel?: string;
  density?: 'compact' | 'expanded';
  surface?: SurfacePreset;
}

export interface TerminalLineProps {
  kind?: 'command' | 'text' | 'status';
  tone?: 'normal' | 'muted' | 'success' | 'error';
  preformatted?: boolean;
  text?: string;
}

export interface TerminalTranscriptProps {
  label?: string;
  followTail?: boolean;
  density?: 'compact' | 'comfortable';
  live?: 'polite' | 'off';
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
  /** Button variant of the rendered trigger; ghost reuses the shared washes for chrome. */
  triggerVariant?: ButtonVariant;
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
  /** Button variant of the rendered trigger; ghost reuses the shared washes for chrome. */
  triggerVariant?: ButtonVariant;
}

export type ContextMenuItemTone = 'default' | 'danger';

/**
 * One selectable row. `checked` turns the row into a checkable item; rows that
 * share a `group` behave as one radio set when `selection` is `single`.
 */
export interface ContextMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  tone?: ContextMenuItemTone;
  shortcut?: string;
  checked?: boolean;
  group?: string;
  selection?: 'none' | 'single' | 'multiple';
  /**
   * Rows of a submenu. A row with children opens the submenu on click or ArrowRight
   * instead of emitting `select`; only top-level rows may carry children.
   * 二级菜单的行。带 children 的行通过点击、悬停或右方向键展开二级菜单，而不是触发 select；
   * 只有顶层行可以携带 children。
   */
  children?: readonly ContextMenuItem[];
}

/** Non-selectable structure: a separator or a labelled group heading. */
export interface ContextMenuSeparator {
  type: 'separator';
  id?: string;
}

export interface ContextMenuHeading {
  type: 'heading';
  id?: string;
  label: string;
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator | ContextMenuHeading;

export interface ContextMenuProps {
  entries: readonly ContextMenuEntry[];
  /** The menu is a transient overlay; the caller owns when it is open. */
  open: boolean;
  ariaLabel: string;
  /** Viewport pointer coordinates in CSS pixels. */
  point?: OverlayPoint | undefined;
  /** Element that receives focus when the menu closes; defaults to the open-time focus owner. */
  focusReturn?: HTMLElement | undefined;
  /**
   * Focus the first row on open. A pointer open leaves it false so the editor keeps
   * focus and its selection highlight; arrow keys still reach the rows.
   * 打开时聚焦首行。指针打开时保持为 false，使编辑器保留焦点与选区高亮；方向键仍可进入菜单行。
   */
  autoFocus?: boolean;
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
