<script setup lang="ts">
import { computed } from 'vue';
import type { StatusIndicatorProps, StatusIndicatorSize, StatusIndicatorStatus } from './types';

const props = withDefaults(defineProps<StatusIndicatorProps>(), {
  status: 'neutral',
  size: 'sm',
  pulse: false,
});

const classes = computed(() => [
  'ui-status-indicator inline-flex items-center font-label',
  `ui-status-indicator--${props.status as StatusIndicatorStatus}`,
  `ui-status-indicator--${props.size as StatusIndicatorSize}`,
  { 'ui-status-indicator--pulse': props.pulse },
]);
</script>

<template>
  <span :class="classes">
    <i class="ui-status-indicator__dot" aria-hidden="true" />
    <span class="ui-status-indicator__label"><slot /></span>
  </span>
</template>
