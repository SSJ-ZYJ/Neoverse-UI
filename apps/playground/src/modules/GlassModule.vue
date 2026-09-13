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
  card: 'glass-card',
  immersive: 'glass-immersive',
} satisfies Record<(typeof glassVariants)[number], SurfacePreset>;
</script>

<template>
  <MaterialBackdrop>
    <div class="grid gap-grid md:grid-cols-2 xl:grid-cols-4">
      <UiSurface
        v-for="variant in glassVariants"
        :key="variant"
        :surface="glassSurfaces[variant]"
        class="rounded-card p-4"
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
    </div>
  </MaterialBackdrop>
</template>
