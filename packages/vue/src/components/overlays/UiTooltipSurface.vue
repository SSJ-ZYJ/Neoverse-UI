<script setup lang="ts">
import { presenceAppearClassName } from '@neoverse-ui/motion';
import { getSurfaceClass } from '@neoverse-ui/tokens';
import { computed, useAttrs } from 'vue';
import type { TooltipSurfaceProps } from '../../types';
import { presence } from '../motion/presence';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TooltipSurfaceProps>(), {
  as: 'div',
  variant: 'neutral',
});
const attrs = useAttrs();
const classes = computed(() => [
  'ui-tooltip-surface',
  presenceAppearClassName,
  getSurfaceClass('auto', 'compactOverlay'),
  `ui-tooltip-surface--${props.variant}`,
]);
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <component
    :is="props.as"
    v-bind="{ ...forwardedAttrs, ...presence('veil') }"
    :class="[classes, attrs.class]"
    :style="attrs.style"
    data-surface="auto"
    data-neoverse-surface-hover="static"
    data-neoverse-surface-overflow="visible"
    data-neoverse-tooltip-surface
  >
    <span class="ui-tooltip-surface__content" :class="presenceAppearClassName"><slot /></span>
  </component>
</template>
