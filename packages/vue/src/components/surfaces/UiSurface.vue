<script setup lang="ts">
import { getSurfaceClass } from '@neoverse-ui/tokens';
import { computed, useAttrs } from 'vue';
import type { SurfaceProps } from '../../types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SurfaceProps>(), {
  as: 'div',
  surface: 'none',
  glassNesting: 'local',
  contentOverflow: 'clip',
});
const attrs = useAttrs();

const classes = computed(() => ['ui-surface', getSurfaceClass(props.surface)]);
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
    :data-neoverse-glass-nesting="props.glassNesting"
    :data-neoverse-surface-overflow="props.contentOverflow"
  >
    <slot />
  </component>
</template>
