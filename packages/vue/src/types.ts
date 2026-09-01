export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
}

export interface IconButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
}

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export type GlassSurfaceVariant = 'subtle' | 'elevated' | 'immersive';

export interface GlassSurfaceProps {
  variant?: GlassSurfaceVariant;
}

export interface SegmentOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SegmentedControlSize = 'sm';

export interface SegmentedControlProps {
  options: readonly SegmentOption[];
  modelValue?: string;
  defaultValue?: string;
  size?: SegmentedControlSize;
  disabled?: boolean;
  loading?: boolean;
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
