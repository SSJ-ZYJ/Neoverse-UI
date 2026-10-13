<script setup lang="ts">
import type { StatCardProps } from './types';
import UiSurface from './UiSurface.vue';

const props = withDefaults(defineProps<StatCardProps>(), {
  surface: 'glass-elevated',
});
</script>

<template>
  <UiSurface :surface="props.surface" class="ui-stat-card">
    <dl class="ui-stat-card__metric">
      <dt class="ui-stat-card__label">
        <slot name="label">{{ props.label }}</slot>
      </dt>
      <dd class="ui-stat-card__value">
        <slot name="value">{{ props.value }}</slot>
        <span v-if="props.unit" class="ui-stat-card__unit">{{ props.unit }}</span>
      </dd>
    </dl>
    <p v-if="props.trend || $slots.trend" class="ui-stat-card__trend">
      <slot name="trend">{{ props.trend }}</slot>
    </p>
    <p v-if="props.footnote || $slots.footnote" class="ui-stat-card__footnote">
      <slot name="footnote">{{ props.footnote }}</slot>
    </p>
  </UiSurface>
</template>
