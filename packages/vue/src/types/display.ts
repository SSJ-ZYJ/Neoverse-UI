import type { PresenceOrigin, PresenceVariant } from '@neoverse-ui/motion';
import type { SurfacePreset } from './controls';

export type DialogSize = 'sm' | 'md' | 'lg';
export type DialogRole = 'dialog' | 'alertdialog';

export interface DialogProps {
  open?: boolean;
  title: string;
  description?: string;
  size?: DialogSize;
  role?: DialogRole;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  /** Visual source at open time; omitted uses the focused element, null disables the morph. */
  motionSource?: HTMLElement | null;
}

export interface TabOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  options: readonly TabOption[];
  ariaLabel: string;
  modelValue?: string;
  defaultValue?: string;
}

export type AvatarShape = 'circle' | 'rounded';
/** What a source-less avatar paints: derived initials or the neutral person glyph. */
export type AvatarPlaceholder = 'initials' | 'icon';

export interface AvatarProps {
  name: string;
  src?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: AvatarShape;
  placeholder?: AvatarPlaceholder;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  variant?: 'default' | 'outlined' | 'compact' | 'subtle';
}

export interface ToastProps {
  open?: boolean;
  message: string;
  dismissLabel: string;
  variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  /** Defaults to compact, or action when the action slot is supplied. */
  presentation?: 'compact' | 'action' | 'notification';
  /** Auto-dismiss delay in milliseconds. Defaults to 4 seconds, or zero for notification. */
  duration?: number;
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
  as?: string;
  variant?: NoticeVariant;
}

export type TooltipSurfaceVariant = 'neutral' | 'accent';

export interface TooltipSurfaceProps {
  as?: string;
  variant?: TooltipSurfaceVariant;
}

export interface StatusIndicatorProps {
  status?: StatusIndicatorStatus;
  size?: StatusIndicatorSize;
  pulse?: boolean;
  loading?: boolean;
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
