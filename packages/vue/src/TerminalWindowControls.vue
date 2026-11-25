<script setup lang="ts">
import { computed } from 'vue';
import type { TerminalWindowAction } from './types';

const props = defineProps<{
  variant: 'macos' | 'windows' | 'linux';
  maximized: boolean;
  closeLabel: string;
  minimizeLabel: string;
  maximizeLabel: string;
  restoreLabel: string;
  groupLabel: string;
}>();

const emit = defineEmits<{ action: [action: TerminalWindowAction] }>();

const buttons = computed(() => {
  const maximizeText = props.maximized ? props.restoreLabel : props.maximizeLabel;
  const descriptors: Record<
    TerminalWindowAction,
    { action: TerminalWindowAction; label: string; pressed?: boolean }
  > = {
    close: { action: 'close', label: props.closeLabel },
    minimize: { action: 'minimize', label: props.minimizeLabel },
    maximize: { action: 'maximize', label: maximizeText, pressed: props.maximized },
  };
  const order: readonly TerminalWindowAction[] =
    props.variant === 'macos'
      ? ['close', 'minimize', 'maximize']
      : ['minimize', 'maximize', 'close'];
  return order.map((key) => descriptors[key]);
});
</script>

<template>
  <div
    class="ui-terminal-surface__window-controls"
    :data-window-controls="props.variant"
    role="toolbar"
    :aria-label="props.groupLabel"
  >
    <button
      v-for="button in buttons"
      :key="button.action"
      type="button"
      class="ui-terminal-surface__window-button"
      :class="`ui-terminal-surface__window-button--${button.action}`"
      :data-window-action="button.action"
      :aria-label="button.label"
      :aria-pressed="button.pressed"
      :title="button.label"
      @click="emit('action', button.action)"
    >
      <svg
        v-if="props.variant === 'macos'"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path v-if="button.action === 'close'" d="m3.5 3.5 5 5m0-5-5 5" />
        <path v-else-if="button.action === 'minimize'" d="M2.8 6h6.4" />
        <path v-else d="M6 2.8v6.4M2.8 6h6.4" />
      </svg>
      <svg
        v-else
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.35"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path v-if="button.action === 'close'" d="m4.5 4.5 7 7m0-7-7 7" />
        <path v-else-if="button.action === 'minimize'" d="M4 8.5h8" />
        <path v-else-if="props.maximized" d="M6 4.5h5.5V10M4.5 6.5H10V12H4.5V6.5Z" />
        <rect v-else x="4.5" y="4.5" width="7" height="7" rx="0.75" />
      </svg>
    </button>
  </div>
</template>
