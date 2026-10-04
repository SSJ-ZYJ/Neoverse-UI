<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { TooltipSurfaceProps, TooltipSurfaceVariant } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TooltipSurfaceProps>(), {
  as: 'div',
  variant: 'neutral',
});
const attrs = useAttrs();
const classes = computed(() => [
  'ui-tooltip-surface',
  'material-glass-subtle',
  `ui-tooltip-surface--${props.variant as TooltipSurfaceVariant}`,
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
    data-surface="glass-subtle"
    data-neoverse-surface-hover="static"
    data-neoverse-surface-overflow="visible"
    data-neoverse-tooltip-surface
  >
    <slot />
  </component>
</template>
