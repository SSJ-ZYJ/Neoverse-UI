<script setup lang="ts">
import { typographyTokens } from '../lab-data';
import { localize, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <article
      v-for="token in typographyTokens"
      :key="token.label.en"
      class="grid gap-3 rounded-control material-glass-subtle p-4"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-label font-label text-primary">
          {{ localize(token.label, props.locale) }}
        </h3>
        <code class="text-code text-secondary">{{ token.className }}</code>
      </div>
      <p :class="token.className">
        {{ localize(moduleCopy.typography.sample, props.locale) }}
      </p>
      <code class="text-code text-muted">{{ token.variables.join(' · ') }}</code>
    </article>
  </div>
</template>
