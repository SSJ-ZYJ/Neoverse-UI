<script setup lang="ts">
import { type SurfacePreset, UiButton, UiIconButton, UiSurface } from '@neoverse-ui/vue';
import { glassVariantLabels, glassVariants } from '../lab-data';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized, moduleCopy } from '../playground-content';
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
    <MaterialBackdrop data-refraction-preview class="playground-refraction-preview">
      <div class="playground-refraction-scene rounded-card p-5">
        <div class="relative flex flex-wrap items-center justify-between gap-4">
          <UiButton variant="secondary" data-refraction-control="left">
            {{ localize(localized('Open', '打开'), props.locale) }}
          </UiButton>
          <UiButton variant="secondary" data-refraction-control="middle">
            {{ localize(localized('Share', '分享'), props.locale) }}
          </UiButton>
          <UiIconButton
            variant="secondary"
            class="rounded-pill"
            data-refraction-control="right"
            :label="localize(localized('Settings', '设置'), props.locale)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"
              />
            </svg>
          </UiIconButton>
        </div>
      </div>
      <p class="mt-3 text-caption text-secondary">
        {{ localize(localized('The same controls reveal different parts of the backdrop, with shared edge lighting and frost.', '相同控件透出所在位置的背景色；共享边缘高光与柔光玻璃。'), props.locale) }}
      </p>
    </MaterialBackdrop>
  </div>
</template>
