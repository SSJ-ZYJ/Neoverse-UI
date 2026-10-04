<script setup lang="ts">
import { type SurfacePreset, surfaceClasses, UiSurface } from '@neoverse-ui/vue';
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
  'chrome',
  'glass-subtle',
  'glass-elevated',
  'glass-immersive',
];
const copy = {
  description: localized(
    'Every sample is a real UiSurface instance. The displayed class is the shared implementation behind the semantic preset.',
    '每个示例都是真实的 UiSurface 实例；下方类名是对应语义预设所复用的共享实现。',
  ),
} as const;
</script>

<template>
  <MaterialBackdrop>
    <div class="grid gap-3">
      <p class="max-w-container-lg text-caption text-secondary">
        {{ localize(copy.description, props.locale) }}
      </p>
      <div class="playground-token-grid">
        <UiSurface
          v-for="preset in presets"
          :key="preset"
          :surface="preset"
          class="grid min-h-32 content-between gap-3 rounded-card border border-subtle p-5"
          :data-surface-preset="preset"
        >
          <h3 class="text-label font-label text-primary">{{ preset }}</h3>
          <code class="text-code text-secondary">
            {{ surfaceClasses[preset] || '(no material class)' }}
          </code>
        </UiSurface>
      </div>
    </div>
  </MaterialBackdrop>
</template>
