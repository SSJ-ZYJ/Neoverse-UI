<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { getSurfaceClass, glassVariantToSurface } from './surface';
import type { GlassSurfaceProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<GlassSurfaceProps>(), {
  as: 'div',
  variant: 'subtle',
});
const attrs = useAttrs();
const surface = computed(() => glassVariantToSurface(props.variant));
const classes = computed(() => ['ui-glass-surface', getSurfaceClass(surface.value)]);
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
    :data-surface="surface"
  >
    <slot />
  </component>
</template>
