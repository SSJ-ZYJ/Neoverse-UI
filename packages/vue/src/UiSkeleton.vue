<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { SkeletonEffect, SkeletonProps, SkeletonVariant } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SkeletonProps>(), {
  variant: 'text',
  effect: 'shimmer',
});

const attrs = useAttrs();

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'ui-skeleton--text rounded-control-inner',
  title: 'ui-skeleton--title',
  avatar: 'ui-skeleton--avatar aspect-square rounded-pill',
  circle: 'ui-skeleton--circle aspect-square rounded-pill',
  rect: 'ui-skeleton--rect',
};

const effectClasses: Record<SkeletonEffect, string> = {
  shimmer: 'ui-skeleton--shimmer',
  pulse: 'ui-skeleton--pulse',
  none: 'ui-skeleton--static',
};

const classes = computed(() => [
  'ui-skeleton skeleton-surface block',
  variantClasses[props.variant as SkeletonVariant] ?? variantClasses.text,
  effectClasses[props.effect as SkeletonEffect] ?? effectClasses.shimmer,
]);

const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

const skeletonStyle = computed<Record<string, string | number>>(() => {
  const style: Record<string, string | number> = {};
  if (props.width !== undefined) {
    style.width = props.width;
  }
  if (props.height !== undefined) {
    style.height = props.height;
  }
  if (props.radius !== undefined && props.variant === 'rect') {
    style['--ui-skeleton-radius'] = props.radius;
  }
  return style;
});
</script>

<template>
  <span
    v-bind="forwardedAttrs"
    :aria-hidden="true"
    :data-effect="props.effect"
    :class="[classes, attrs.class]"
    :style="[attrs.style, skeletonStyle]"
  />
</template>
