<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { TerminalLineProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TerminalLineProps>(), {
  kind: 'text',
  tone: 'normal',
  preformatted: false,
});
const attrs = useAttrs();
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <div
    v-bind="forwardedAttrs"
    :class="['ui-terminal-line', attrs.class]"
    :style="attrs.style"
    :data-kind="props.kind"
    :data-tone="props.tone"
    :data-preformatted="props.preformatted ? 'true' : 'false'"
  >
    <slot>{{ props.text }}</slot>
  </div>
</template>
