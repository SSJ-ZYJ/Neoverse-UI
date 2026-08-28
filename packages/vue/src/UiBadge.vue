<script setup lang="ts">
import { computed } from 'vue';
import type { BadgeProps, BadgeSize, BadgeVariant } from './types';

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'neutral',
  size: 'sm',
});

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-subtle text-secondary',
  info: 'bg-status-info text-status-info-foreground',
  success: 'bg-status-success text-status-success-foreground',
  warning: 'bg-status-warning text-status-warning-foreground',
  danger: 'bg-status-danger text-status-danger-foreground',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-1 text-caption',
  md: 'px-3 py-1 text-label',
};

const classes = computed(() => [
  'inline-flex items-center rounded-pill font-label',
  variantClasses[props.variant as BadgeVariant] ?? variantClasses.neutral,
  sizeClasses[props.size as BadgeSize] ?? sizeClasses.sm,
]);
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
