<script setup lang="ts">
import { surfaceSamples } from '../lab-data';
import { localize } from '../playground-content';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <MaterialBackdrop>
    <div class="grid gap-grid md:grid-cols-2">
      <article
        v-for="sample in surfaceSamples"
        :key="sample.label.en"
        :class="['grid min-h-24 content-between gap-3 rounded-card p-4', sample.className]"
      >
        <h3 class="text-label font-label text-primary">
          {{ localize(sample.label, props.locale) }}
        </h3>
        <code class="text-code text-secondary">{{ sample.className }}</code>
      </article>
    </div>
  </MaterialBackdrop>
</template>
