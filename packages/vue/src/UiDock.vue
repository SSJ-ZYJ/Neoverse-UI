<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';
import type { DockProps } from './types';
import UiControlSurface from './UiControlSurface.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<DockProps>(), {
  as: 'nav',
  surface: 'chrome',
  hoverMode: 'static',
  edgeMode: 'auto',
  scale: 'lg',
  compact: false,
  navigationIndicator: true,
});

const attrs = useAttrs();
const slots = useSlots();
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <UiControlSurface
    v-bind="forwardedAttrs"
    :as="props.as"
    :surface="props.surface"
    :hover-mode="props.hoverMode"
    :edge-mode="props.edgeMode"
    :scale="props.scale"
    :navigation-indicator="props.navigationIndicator"
    :class="['ui-dock', { 'ui-dock--compact': props.compact }, attrs.class]"
    :style="attrs.style"
  >
    <slot />
    <template v-if="slots.trailing" #trailing>
      <slot name="trailing" />
    </template>
  </UiControlSurface>
</template>
