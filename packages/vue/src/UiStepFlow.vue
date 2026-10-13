<script setup lang="ts">
import type { StepFlowProps } from './types';

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
      <span class="ui-step-flow__marker" aria-hidden="true">{{ index + 1 }}</span>
      <div class="ui-step-flow__content">
        <slot name="item" :item="item" :index="index">
          <p class="ui-step-flow__title">{{ item.title }}</p>
          <p v-if="item.description !== undefined" class="ui-step-flow__description">
            {{ item.description }}
          </p>
        </slot>
        <span v-if="item.status !== undefined || $slots.status" class="ui-step-flow__status">
          <slot name="status" :item="item" :index="index">
            <span
              v-if="item.status"
              :role="item.statusLabel ? 'img' : undefined"
              :aria-label="item.statusLabel"
              :aria-hidden="item.statusLabel ? undefined : true"
            >
              <svg
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
                <path v-if="item.status === 'complete'" d="m5 12 4 4L19 6" />
                <path v-else-if="item.status === 'current'" d="M4 12h16m-6-6 6 6-6 6" />
                <circle v-else cx="12" cy="12" r="7" />
              </svg>
            </span>
          </slot>
        </span>
      </div>
    </li>
  </ol>
</template>
