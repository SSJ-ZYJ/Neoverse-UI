<script setup lang="ts">
import {
  type SurfacePreset,
  surfaceClasses,
  UiButton,
  UiIconButton,
  UiSurface,
} from '@neoverse-ui/vue';
import { glassVariantLabels, type glassVariants } from '../lab-data';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const presets: readonly SurfacePreset[] = [
  'none',
  'solid',
  'subtle',
  'elevated',
  'inset',
  'glass-subtle',
  'glass-elevated',
  'glass-immersive',
];
const glassLabels = {
  'glass-subtle': glassVariantLabels.subtle,
  'glass-elevated': glassVariantLabels.elevated,
  'glass-immersive': glassVariantLabels.immersive,
} as const;
const glassPresetVariants = {
  'glass-subtle': 'subtle',
  'glass-elevated': 'elevated',
  'glass-immersive': 'immersive',
} as const satisfies Record<string, (typeof glassVariants)[number]>;
const copy = {
  description: localized(
    'Every sample is a real UiSurface instance. The displayed class is the shared implementation behind the semantic preset.',
    '每个示例都是真实的 UiSurface 实例；下方类名是对应语义预设所复用的共享实现。',
  ),
  refraction: localized(
    'The same controls reveal different parts of the backdrop, with shared Aurora Glass edge lighting and frost effects.',
    '相同控件透出所在位置的背景色；共享极光玻璃的边缘高光与柔化效果。',
  ),
} as const;
</script>

<template>
  <div class="grid min-w-0 gap-3">
    <MaterialBackdrop data-glass-preview-stage>
      <div class="grid gap-3">
        <p class="max-w-container-lg text-caption text-secondary">
          {{ localize(copy.description, props.locale) }}
        </p>
        <div class="playground-token-grid">
          <UiSurface
            v-for="preset in presets"
            :key="preset"
            :surface="preset"
            class="grid min-h-32 content-between gap-3 rounded-card p-5"
            :data-surface-preset="preset"
            :data-glass-variant="
              preset in glassPresetVariants
                ? glassPresetVariants[preset as keyof typeof glassPresetVariants]
                : undefined
            "
          >
            <h3 class="text-label font-label text-primary">
              {{
                preset in glassLabels
                  ? localize(glassLabels[preset as keyof typeof glassLabels], props.locale)
                  : preset
              }}
            </h3>
            <code class="text-code text-secondary">
              {{ surfaceClasses[preset] || '(no material class)' }}
            </code>
          </UiSurface>
        </div>
      </div>
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
        {{ localize(copy.refraction, props.locale) }}
      </p>
    </MaterialBackdrop>
  </div>
</template>
