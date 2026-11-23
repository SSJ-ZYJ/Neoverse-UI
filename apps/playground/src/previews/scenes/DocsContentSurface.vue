<script setup lang="ts">
import { UiBadge, UiButton, UiSurface } from '@neoverse-ui/vue';
import LabIcon from '../../LabIcon.vue';
import type { LabModuleProps } from '../../modules/types';
import { localize, moduleCopy } from '../../playground-content';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.composition;
</script>

<template>
  <UiSurface
    as="article"
    surface="glass-elevated"
    class="grid gap-4 rounded-card p-4"
    data-composition-surface
  >
    <header class="grid max-w-container-lg gap-2">
      <UiBadge size="sm">
        {{ localize(copy.scenes.docsContentSurface.eyebrow, props.locale) }}
      </UiBadge>
      <h4 class="text-heading font-heading leading-heading tracking-heading text-primary">
        {{ localize(copy.scenes.docsContentSurface.title, props.locale) }}
      </h4>
      <p class="text-body text-secondary">
        {{ localize(copy.scenes.docsContentSurface.body, props.locale) }}
      </p>
    </header>

    <div class="grid gap-3 md:grid-cols-2">
      <p class="text-body text-secondary">
        {{ localize(copy.scenes.docsContentSurface.detail, props.locale) }}
      </p>
      <div class="grid gap-2 p-3">
        <p class="text-caption text-muted">
          {{ localize(copy.scenes.docsContentSurface.reference, props.locale) }}
        </p>
        <code class="break-all text-code text-secondary">--neoverse-color-text-primary</code>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-3">
      <UiButton variant="ghost" size="sm">
        {{ localize(copy.scenes.docsContentSurface.previous, props.locale) }}
      </UiButton>
      <UiButton variant="secondary" size="sm">
        {{ localize(copy.scenes.docsContentSurface.next, props.locale) }}
        <template #trailing><LabIcon name="arrow-right" /></template>
      </UiButton>
    </div>
  </UiSurface>
</template>
