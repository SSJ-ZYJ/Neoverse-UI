<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { getSurfaceClass } from './surface';
import type { SurfaceProps, SurfacePreset } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SurfaceProps>(), {
  as: 'div',
  surface: 'none',
});
const attrs = useAttrs();

const classes = computed(() => getSurfaceClass(props.surface as SurfacePreset));
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
