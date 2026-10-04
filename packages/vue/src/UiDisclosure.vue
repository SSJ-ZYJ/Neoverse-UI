<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { DisclosureProps } from './types';

defineOptions({ inheritAttrs: false });

const props = defineProps<DisclosureProps>();
const emit = defineEmits<{
  toggle: [open: boolean];
  'update:open': [open: boolean];
}>();
const attrs = useAttrs();
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

function handleToggle(event: Event): void {
  const open = (event.currentTarget as HTMLDetailsElement).open;
  emit('toggle', open);
  emit('update:open', open);
}
</script>

<template>
  <details
    v-bind="forwardedAttrs"
    :open="props.open"
    :class="['ui-disclosure', attrs.class]"
    :style="attrs.style"
    @toggle="handleToggle"
  >
    <summary class="ui-disclosure__summary">
      <slot name="summary">{{ props.summary }}</slot>
    </summary>
    <div class="ui-disclosure__content">
      <slot />
    </div>
  </details>
</template>
