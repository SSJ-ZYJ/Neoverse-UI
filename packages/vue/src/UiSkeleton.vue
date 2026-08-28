<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { SkeletonProps, SkeletonVariant } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SkeletonProps>(), {
  variant: 'text',
});

const attrs = useAttrs();

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'h-4 rounded-control',
  rect: 'rounded-control',
  circle: 'aspect-square rounded-pill',
};

const classes = computed(() => [
  'block bg-surface-subtle motion-safe:animate-pulse motion-reduce:animate-none',
  variantClasses[props.variant as SkeletonVariant] ?? variantClasses.text,
]);
</script>

<template>
  <div v-bind="attrs" :aria-hidden="true" :class="[classes, attrs.class]" />
</template>
