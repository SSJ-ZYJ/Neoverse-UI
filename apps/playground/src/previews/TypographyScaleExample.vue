<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
import { typographyTokens } from '../lab-data';
import type { LabModuleProps } from '../modules/types';
import { localize, moduleCopy } from '../playground-content';
import MarkdownHeadingsExample from './MarkdownHeadingsExample.vue';
import MarkdownInlineExample from './MarkdownInlineExample.vue';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <MarkdownHeadingsExample :locale="props.locale" />
    <MarkdownInlineExample :locale="props.locale" />
    <div class="playground-specimen-grid">
      <UiSurface
        v-for="token in typographyTokens"
        :key="token.label.en"
        as="article"
        surface="none"
        class="playground-specimen-panel grid gap-3"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="text-label-md font-label text-primary">
            {{ localize(token.label, props.locale) }}
          </h3>
          <code class="text-code text-secondary">{{ token.className }}</code>
        </div>
        <p :class="token.className" :data-type-scale="token.label.en">
          {{ localize(moduleCopy.typography.sample, props.locale) }}
        </p>
        <code class="text-code text-muted">{{ token.variables.join(' · ') }}</code>
      </UiSurface>
    </div>
  </div>
</template>
