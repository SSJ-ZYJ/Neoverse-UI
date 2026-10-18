<script setup lang="ts">
import { computed } from 'vue';
import type { BadgeProps, BadgeSize, BadgeVariant } from './types';

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'neutral',
  size: 'sm',
});

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'ui-badge--neutral',
  info: 'ui-badge--info',
  success: 'ui-badge--success',
  warning: 'ui-badge--warning',
  danger: 'ui-badge--danger',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'ui-badge--sm px-2 py-1',
  md: 'ui-badge--md px-3 py-1',
  lg: 'ui-badge--lg px-4 py-2',
};

const classes = computed(() => [
  'ui-badge inline-flex items-center rounded-pill',
  variantClasses[props.variant as BadgeVariant] ?? variantClasses.neutral,
  sizeClasses[props.size as BadgeSize] ?? sizeClasses.sm,
]);
</script>

<template>
  <span :class="classes">
    <span class="ui-badge__label"><slot /></span>
  </span>
</template>
