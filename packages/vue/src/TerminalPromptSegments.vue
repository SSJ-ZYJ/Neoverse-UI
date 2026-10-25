<script setup lang="ts">
import type { TerminalPromptSegment } from './types';

defineProps<{ segments: readonly TerminalPromptSegment[] }>();
defineSlots<{ segment?: (props: { segment: TerminalPromptSegment }) => unknown }>();
</script>

<template>
  <span class="ui-terminal-prompt__lead" aria-hidden="true">
    <span /><span /><span />
  </span>
  <span
    v-for="segment in segments"
    :key="segment.id"
    class="ui-terminal-prompt__segment"
    :data-tone="segment.tone ?? 'runtime'"
    :title="segment.label"
  >
    <slot name="segment" :segment="segment">{{ segment.label }}</slot>
  </span>
</template>
