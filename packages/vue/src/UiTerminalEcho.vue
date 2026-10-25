<script setup lang="ts">
import { useAttrs } from 'vue';
import TerminalPromptSegments from './TerminalPromptSegments.vue';
import type { TerminalEchoProps, TerminalPromptSegment } from './types';

defineOptions({ name: 'UiTerminalEcho', inheritAttrs: false });

const props = withDefaults(defineProps<TerminalEchoProps>(), {
  symbol: '❯',
  segments: () => [],
  error: false,
});
defineSlots<{ segment?: (props: { segment: TerminalPromptSegment }) => unknown }>();
const attrs = useAttrs();
</script>

<template>
  <div
    v-bind="attrs"
    :class="['ui-terminal-echo', attrs.class]"
    :style="attrs.style"
    :data-error="props.error ? 'true' : 'false'"
    data-readonly="true"
  >
    <div v-if="props.segments.length > 0" class="ui-terminal-prompt__context">
      <TerminalPromptSegments :segments="props.segments">
        <template #segment="{ segment }">
          <slot name="segment" :segment="segment">{{ segment.label }}</slot>
        </template>
      </TerminalPromptSegments>
    </div>
    <div class="ui-terminal-echo__entry">
      <span class="ui-terminal-prompt__symbol" aria-hidden="true">{{ props.symbol }}</span>
      <span class="ui-terminal-echo__text">{{ props.text }}</span>
    </div>
  </div>
</template>
