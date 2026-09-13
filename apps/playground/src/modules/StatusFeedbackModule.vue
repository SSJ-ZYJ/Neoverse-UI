<script setup lang="ts">
import { localize, moduleCopy } from '../playground-content';
import BadgeModule from './BadgeModule.vue';
import SkeletonModule from './SkeletonModule.vue';
import StatusIndicatorModule from './StatusIndicatorModule.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <section class="grid gap-3" aria-labelledby="status-feedback-badge-title">
      <header class="grid gap-1">
        <h3 id="status-feedback-badge-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.badge.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.badge.description, props.locale) }}
        </p>
      </header>
      <BadgeModule :locale="props.locale" />
    </section>

    <section class="grid gap-3" aria-labelledby="status-feedback-indicator-title">
      <header class="grid gap-1">
        <h3
          id="status-feedback-indicator-title"
          class="text-subtitle font-heading tracking-heading"
        >
          {{ localize(moduleCopy.statusIndicator.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.statusIndicator.description, props.locale) }}
        </p>
      </header>
      <StatusIndicatorModule :locale="props.locale" />
    </section>

    <section class="grid gap-3" aria-labelledby="status-feedback-skeleton-title">
      <header class="grid gap-1">
        <h3 id="status-feedback-skeleton-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.skeleton.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.skeleton.description, props.locale) }}
        </p>
      </header>
      <SkeletonModule :locale="props.locale" />
    </section>
  </div>
</template>
