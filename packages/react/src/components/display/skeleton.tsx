import type { CSSProperties, HTMLAttributes } from 'react';

export type SkeletonVariant = 'text' | 'title' | 'avatar' | 'circle' | 'rect';
export type SkeletonEffect = 'shimmer' | 'pulse' | 'none';

export interface UiSkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: SkeletonVariant;
  effect?: SkeletonEffect;
  width?: string | number;
  height?: string | number;
  radius?: string;
}

export function UiSkeleton({
  variant = 'text',
  effect = 'shimmer',
  width,
  height,
  radius,
  style,
  className = '',
  ...rest
}: UiSkeletonProps) {
  return (
    <span
      {...rest}
      aria-hidden="true"
      data-effect={effect}
      className={`ui-skeleton skeleton-surface ui-skeleton--${variant} ui-skeleton--${effect === 'none' ? 'static' : effect} ${className}`}
      style={
        {
          ...style,
          ...(width === undefined ? {} : { width }),
          ...(height === undefined ? {} : { height }),
          ...(variant === 'rect' && radius !== undefined ? { '--ui-skeleton-radius': radius } : {}),
        } as CSSProperties
      }
    />
  );
}
