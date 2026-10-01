<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { getSurfaceClass } from './surface';
import type { CardProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<CardProps>(), {
  as: 'div',
  surface: 'glass-card',
});
const attrs = useAttrs();
const classes = computed(() => ['ui-card', getSurfaceClass(props.surface)]);
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <component
    :is="props.as"
    v-bind="forwardedAttrs"
    :class="[classes, attrs.class]"
    :style="attrs.style"
    :data-surface="props.surface"
  >
    <slot />
  </component>
</template>
