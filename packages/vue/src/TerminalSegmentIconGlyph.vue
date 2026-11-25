<script setup lang="ts">
import { computed } from 'vue';
import type { ResolvedTerminalSegmentIcon } from './terminal-environment';
import { terminalSegmentGlyphs } from './terminal-icons';

const props = defineProps<{ name: ResolvedTerminalSegmentIcon }>();
const glyph = computed(() => terminalSegmentGlyphs[props.name]);
</script>

<template>
  <svg
    viewBox="0 0 16 16"
    :fill="glyph.mode === 'fill' ? 'currentColor' : 'none'"
    :stroke="glyph.mode === 'stroke' ? 'currentColor' : undefined"
    :stroke-width="glyph.mode === 'stroke' ? 1.5 : undefined"
    :stroke-linecap="glyph.mode === 'stroke' ? 'round' : undefined"
    :stroke-linejoin="glyph.mode === 'stroke' ? 'round' : undefined"
    aria-hidden="true"
    focusable="false"
  >
    <component
      v-for="(node, index) in glyph.nodes"
      :is="node.tag"
      :key="index"
      v-bind="node.attrs"
    />
  </svg>
</template>
