<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
import type { LabModuleProps } from '../modules/types';
import { localize, moduleCopy } from '../playground-content';

const props = defineProps<LabModuleProps>();
const levels = [1, 2, 3, 4, 5, 6] as const;
</script>

<template>
  <div class="playground-specimen-grid">
    <UiSurface
      as="article"
      surface="none"
      class="playground-specimen-panel grid gap-4"
      data-markdown-headings
    >
      <header class="grid gap-1">
        <h3 class="text-label-md font-label text-primary">
          {{ localize(moduleCopy.typography.headings.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.typography.headings.description, props.locale) }}
        </p>
      </header>

      <ol class="grid gap-3">
        <li
          v-for="level in levels"
          :key="level"
          class="markdown-heading-row"
          :data-markdown-heading="level"
        >
          <code class="text-code text-muted">{{ '#'.repeat(level) }}</code>
          <div class="neoverse-prose min-w-0">
            <component :is="`h${level}`" class="markdown-heading-row__sample">
              {{ localize(moduleCopy.typography.headings.sample, props.locale) }}
            </component>
          </div>
          <code class="text-code text-secondary"> --neoverse-prose-heading-h{{ level }}-size </code>
        </li>
      </ol>
    </UiSurface>
  </div>
</template>

<style scoped>
.markdown-heading-row {
  display: grid;
  grid-template-columns: 4.5ch minmax(0, 1fr);
  align-items: baseline;
  column-gap: var(--neoverse-space-3);
  row-gap: var(--neoverse-space-1);
  padding-block-end: var(--neoverse-space-3);
  border-block-end: var(--neoverse-border-width-thin) solid var(--neoverse-color-border-subtle);
}

.markdown-heading-row:last-child {
  padding-block-end: 0;
  border-block-end: 0;
}

.markdown-heading-row > code:last-child {
  grid-column: 2;
  overflow-wrap: anywhere;
}

.markdown-heading-row__sample {
  margin: 0;
}
</style>
