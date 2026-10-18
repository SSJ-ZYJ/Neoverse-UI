<script setup lang="ts">
import type { StepFlowProps } from './types';
import UiBadge from './UiBadge.vue';
import UiSurface from './UiSurface.vue';

const props = defineProps<StepFlowProps>();
</script>

<template>
  <ol class="ui-step-flow" :aria-label="props.ariaLabel">
    <li
      v-for="(item, index) in props.items"
      :key="item.id"
      class="ui-step-flow__item"
      :class="item.status ? `ui-step-flow__item--${item.status}` : undefined"
      :aria-current="item.status === 'current' ? 'step' : undefined"
    >
      <UiSurface as="span" surface="glass-subtle" class="ui-step-flow__marker" aria-hidden="true">
        <svg
          v-if="item.status === 'complete'"
          class="ui-step-flow__status-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
        <template v-else>{{ index + 1 }}</template>
      </UiSurface>
      <UiSurface surface="glass-subtle" class="ui-step-flow__content">
        <slot name="item" :item="item" :index="index">
          <p class="ui-step-flow__title">{{ item.title }}</p>
          <p v-if="item.description !== undefined" class="ui-step-flow__description">
            {{ item.description }}
          </p>
        </slot>
        <span v-if="item.statusLabel || $slots.status" class="ui-step-flow__status">
          <slot name="status" :item="item" :index="index">
            <UiBadge v-if="item.status === 'current'" variant="info">
              {{ item.statusLabel }}
            </UiBadge>
            <template v-else>{{ item.statusLabel }}</template>
          </slot>
        </span>
      </UiSurface>
    </li>
  </ol>
</template>
