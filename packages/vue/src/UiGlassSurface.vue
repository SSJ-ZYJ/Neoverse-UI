<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { GlassSurfaceProps, GlassSurfaceVariant } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<GlassSurfaceProps>(), {
  as: 'div',
  variant: 'subtle',
});
const attrs = useAttrs();

const materialClasses: Record<GlassSurfaceVariant, string> = {
  subtle: 'material-glass-subtle',
  elevated: 'material-glass-elevated',
  card: 'material-glass-card',
  immersive: 'material-glass-immersive',
};

const classes = computed(() => [
  materialClasses[props.variant as GlassSurfaceVariant] ?? materialClasses.subtle,
  'rounded-card p-4',
]);
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
  >
    <slot />
  </component>
</template>
