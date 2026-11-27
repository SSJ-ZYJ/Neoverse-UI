<script setup lang="ts">
import { UiCard, UiSurface } from '@neoverse-ui/vue';
import { localize, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import { scrollbarItems } from './scrollbar-items';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.scrollbar;
</script>

<template>
  <UiCard as="article" class="grid min-h-0 gap-3 p-5" data-scrollbar-preview-card>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-label font-label text-primary">
          {{ localize(copy.preview.viewportLabel, props.locale) }}
        </h3>
        <p class="mt-1 text-caption text-secondary">
          {{ localize(copy.preview.viewportHint, props.locale) }}
        </p>
      </div>
      <code class="text-code text-muted"> scrollbar-immersive </code>
    </div>

    <UiSurface
      as="section"
      surface="inset"
      class="scrollbar-immersive max-h-72 overflow-y-auto rounded-control p-2"
      data-scrollbar-preview-viewport
      tabindex="0"
      :aria-label="localize(copy.preview.viewportLabel, props.locale)"
    >
      <ol class="grid divide-y divide-subtle">
        <li
          v-for="item in scrollbarItems"
          :key="item.number"
          class="flex items-center gap-3 px-3 py-3"
        >
          <span class="shrink-0 text-code text-accent-primary">{{ item.number }}</span>
          <div class="min-w-0">
            <p class="truncate text-label font-label text-primary">
              {{ localize(item.label, props.locale) }}
            </p>
            <p class="truncate text-caption text-secondary">
              {{ localize(item.detail, props.locale) }}
            </p>
          </div>
        </li>
      </ol>
    </UiSurface>
  </UiCard>
</template>
