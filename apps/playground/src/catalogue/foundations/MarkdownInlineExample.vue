<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
import { computed } from 'vue';
import { localize, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabSpecimenHeader from '../../features/stage/LabSpecimenHeader.vue';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.typography.inlineSyntax;
const sample = computed(() => localize(copy.sample, props.locale));
const code = computed(() => localize(copy.code, props.locale));
const link = computed(() => localize(copy.link, props.locale));
</script>

<template>
  <div class="playground-specimen-grid">
    <UiSurface
      as="article"
      surface="none"
      class="playground-specimen-panel grid gap-4"
      data-markdown-inline
    >
      <LabSpecimenHeader
        :title="localize(copy.label, props.locale)"
        :description="localize(copy.description, props.locale)"
      />

      <ol class="grid gap-3">
        <li class="markdown-inline-row" data-markdown-inline-row="bold">
          <code class="text-code text-muted">**{{ sample }}**</code>
          <div class="neoverse-prose min-w-0">
            <p><strong>{{ sample }}</strong></p>
          </div>
        </li>
        <li class="markdown-inline-row" data-markdown-inline-row="italic">
          <code class="text-code text-muted">*{{ sample }}*</code>
          <div class="neoverse-prose min-w-0">
            <p><em>{{ sample }}</em></p>
          </div>
        </li>
        <li class="markdown-inline-row" data-markdown-inline-row="bold-italic">
          <code class="text-code text-muted">***{{ sample }}***</code>
          <div class="neoverse-prose min-w-0">
            <p>
              <strong><em>{{ sample }}</em></strong>
            </p>
          </div>
        </li>
        <li class="markdown-inline-row" data-markdown-inline-row="code">
          <code class="text-code text-muted">`{{ code }}`</code>
          <div class="neoverse-prose min-w-0">
            <p><code>{{ code }}</code></p>
          </div>
        </li>
        <li class="markdown-inline-row" data-markdown-inline-row="code-bold">
          <code class="text-code text-muted">**`{{ code }}`**</code>
          <div class="neoverse-prose min-w-0">
            <p>
              <strong><code>{{ code }}</code></strong>
            </p>
          </div>
        </li>
        <li class="markdown-inline-row" data-markdown-inline-row="strike">
          <code class="text-code text-muted">~~{{ sample }}~~</code>
          <div class="neoverse-prose min-w-0">
            <p><del>{{ sample }}</del></p>
          </div>
        </li>
        <li class="markdown-inline-row" data-markdown-inline-row="link">
          <code class="text-code text-muted">[{{ link }}](#foundation-prose)</code>
          <div class="neoverse-prose min-w-0">
            <p><a href="#foundation-prose">{{ link }}</a></p>
          </div>
        </li>
        <li class="markdown-inline-row" data-markdown-inline-row="link-bold">
          <code class="text-code text-muted">[**{{ link }}**](#foundation-prose)</code>
          <div class="neoverse-prose min-w-0">
            <p>
              <a href="#foundation-prose"><strong>{{ link }}</strong></a>
            </p>
          </div>
        </li>
        <li class="markdown-inline-row" data-markdown-inline-row="link-strike">
          <code class="text-code text-muted">[~~{{ link }}~~](#foundation-prose)</code>
          <div class="neoverse-prose min-w-0">
            <p>
              <a href="#foundation-prose"><del>{{ link }}</del></a>
            </p>
          </div>
        </li>
      </ol>
    </UiSurface>
  </div>
</template>

<style scoped>
.markdown-inline-row {
  display: grid;
  grid-template-columns: minmax(12ch, 22ch) minmax(0, 1fr);
  align-items: baseline;
  column-gap: var(--neoverse-space-3);
  row-gap: var(--neoverse-space-1);
  padding-block-end: var(--neoverse-space-3);
  border-block-end: var(--neoverse-border-width-thin) solid var(--neoverse-color-border-subtle);
}

.markdown-inline-row:last-child {
  padding-block-end: 0;
  border-block-end: 0;
}

.markdown-inline-row > code {
  overflow-wrap: anywhere;
}
</style>
