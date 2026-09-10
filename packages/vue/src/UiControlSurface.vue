<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';
import type { ControlSurfaceProps, GlassSurfaceVariant } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ControlSurfaceProps>(), {
  as: 'div',
  variant: 'subtle',
});

const attrs = useAttrs();
const slots = useSlots();
const materialClasses: Record<GlassSurfaceVariant, string> = {
  subtle: 'material-glass-subtle',
  elevated: 'material-glass-elevated',
  card: 'material-glass-card',
  immersive: 'material-glass-immersive',
};
const classes = computed(() => [
  'ui-control-surface inline-flex max-w-full items-stretch rounded-control',
  materialClasses[props.variant as GlassSurfaceVariant] ?? materialClasses.subtle,
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
