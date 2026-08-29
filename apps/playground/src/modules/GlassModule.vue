<script setup lang="ts">
import { UiGlassSurface } from '@neoverse-ui/vue';
import { glassVariantLabels, glassVariants } from '../lab-data';
import { localize, moduleCopy } from '../playground-content';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <MaterialBackdrop>
    <div class="grid gap-grid md:grid-cols-3">
      <UiGlassSurface v-for="variant in glassVariants" :key="variant" :variant="variant">
        <div class="grid gap-2">
          <h3 class="text-label font-label text-primary">
            {{ localize(glassVariantLabels[variant], props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(moduleCopy.glass.sampleDescription, props.locale) }}
          </p>
        </div>
      </UiGlassSurface>
    </div>
  </MaterialBackdrop>
</template>
