<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import TerminalSegmentIconGlyph from './TerminalSegmentIconGlyph.vue';
import {
  readTerminalNavigatorHints,
  resolveTerminalSegmentIcon,
  type TerminalNavigatorHints,
} from './terminal-environment';
import type { TerminalPromptSegment } from './types';

const props = defineProps<{ segments: readonly TerminalPromptSegment[] }>();
defineSlots<{ segment?: (props: { segment: TerminalPromptSegment }) => unknown }>();

const browserHints = ref<TerminalNavigatorHints | undefined>(undefined);
onMounted(() => {
  browserHints.value = readTerminalNavigatorHints();
});

const resolvedSegments = computed(() =>
  props.segments.map((segment) => ({
    segment,
    icon:
      segment.icon === undefined
        ? undefined
        : resolveTerminalSegmentIcon(segment, browserHints.value),
  })),
);
</script>

<template>
  <span class="ui-terminal-prompt__lead" aria-hidden="true">
    <span /><span /><span />
  </span>
  <span
    v-for="entry in resolvedSegments"
    :key="entry.segment.id"
    class="ui-terminal-prompt__segment"
    :data-tone="entry.segment.tone ?? 'runtime'"
    :data-icon="entry.icon"
    :title="entry.segment.label"
  >
    <slot name="segment" :segment="entry.segment">
      <TerminalSegmentIconGlyph v-if="entry.icon" :name="entry.icon" />
      <span :class="{ 'sr-only': entry.segment.iconOnly }">{{ entry.segment.label }}</span>
    </slot>
  </span>
</template>
