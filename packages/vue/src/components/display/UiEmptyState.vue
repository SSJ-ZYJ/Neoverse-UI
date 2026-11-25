<script setup lang="ts">
import { useId } from 'vue';
import type { EmptyStateProps } from '../../types';

defineProps<EmptyStateProps>();
const titleId = `${useId()}-empty-state-title`;
const descriptionId = `${useId()}-empty-state-description`;
</script>

<template>
  <section
    class="ui-empty-state"
    :aria-labelledby="titleId"
    :aria-describedby="description ? descriptionId : undefined"
  >
    <div v-if="$slots.icon" class="ui-empty-state__icon" aria-hidden="true">
      <slot name="icon" />
    </div>
    <div class="ui-empty-state__content">
      <h3 :id="titleId" class="ui-empty-state__title">{{ title }}</h3>
      <p v-if="description" :id="descriptionId" class="ui-empty-state__description">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.action" class="ui-empty-state__action">
      <slot name="action" />
    </div>
  </section>
</template>
