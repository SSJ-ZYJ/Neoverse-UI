<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';
import { getSurfaceClass, glassVariantToSurface } from './surface';
import type { ControlSurfaceProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ControlSurfaceProps>(), {
  as: 'div',
  variant: 'subtle',
});

const attrs = useAttrs();
const slots = useSlots();
const surface = computed(() => props.surface ?? glassVariantToSurface(props.variant));
const classes = computed(() => [
  'ui-control-surface inline-flex max-w-full items-stretch rounded-control',
  getSurfaceClass(surface.value),
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
    :data-surface="surface"
  >
    <div class="ui-control-surface__group ui-control-surface__group--primary">
      <slot />
    </div>
    <template v-if="slots.trailing">
      <span class="ui-control-surface__divider" aria-hidden="true" />
      <div class="ui-control-surface__group ui-control-surface__group--trailing">
        <slot name="trailing" />
      </div>
    </template>
  </component>
</template>
