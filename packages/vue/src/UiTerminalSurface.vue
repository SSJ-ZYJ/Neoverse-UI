<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { TerminalSurfaceProps } from './types';
import UiSurface from './UiSurface.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TerminalSurfaceProps>(), {
  density: 'compact',
  surface: 'glass-elevated',
});
const attrs = useAttrs();
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <UiSurface
    as="section"
    v-bind="forwardedAttrs"
    :class="['ui-terminal-surface', attrs.class]"
    :style="attrs.style"
    :surface="props.surface"
    :aria-label="props.ariaLabel ?? props.title"
    :data-density="props.density"
  >
    <header class="ui-terminal-surface__header">
      <span class="ui-terminal-surface__title">{{ props.title }}</span>
      <div v-if="$slots.status" class="ui-terminal-surface__status"><slot name="status" /></div>
      <div
        v-if="$slots.actions"
        class="ui-terminal-surface__actions"
        role="toolbar"
        :aria-label="`${props.title} actions`"
      >
        <slot name="actions" />
      </div>
    </header>
    <div class="ui-terminal-surface__body"><slot /></div>
  </UiSurface>
</template>
