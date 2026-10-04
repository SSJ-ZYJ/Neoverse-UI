<script setup lang="ts">
import { type SurfacePreset, UiSurface } from '@neoverse-ui/vue';
import { glassVariantLabels, glassVariants } from '../lab-data';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const glassSurfaces = {
  subtle: 'glass-subtle',
  elevated: 'glass-elevated',
  immersive: 'glass-immersive',
} satisfies Record<(typeof glassVariants)[number], SurfacePreset>;
</script>

<template>
  <div class="playground-token-grid">
    <MaterialBackdrop
      v-for="variant in glassVariants"
      :key="variant"
      data-glass-preview-stage
      :data-glass-preview-variant="variant"
      class="grid"
    >
      <UiSurface
        :surface="glassSurfaces[variant]"
        :data-glass-variant="variant"
        class="grid min-h-40 content-center rounded-card p-5"
      >
        <div class="grid gap-2">
          <h3 class="text-label font-label text-primary">
            {{ localize(glassVariantLabels[variant], props.locale) }}
          </h3>
          <p class="text-caption text-secondary">
            {{ localize(moduleCopy.glass.sampleDescription, props.locale) }}
          </p>
        </div>
      </UiSurface>
    </MaterialBackdrop>
  </div>
</template>
