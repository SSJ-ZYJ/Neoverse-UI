<script setup lang="ts">
import { localize, moduleCopy } from '../playground-content';
import GlassModule from './GlassModule.vue';
import SurfaceModule from './SurfaceModule.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <section class="grid gap-3" aria-labelledby="materials-surface-title">
      <header class="grid gap-1">
        <h3 id="materials-surface-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.surface.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.surface.description, props.locale) }}
        </p>
      </header>
      <SurfaceModule :locale="props.locale" />
    </section>

    <section class="grid gap-3" aria-labelledby="materials-glass-title">
      <header class="grid gap-1">
        <h3 id="materials-glass-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.glass.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.glass.description, props.locale) }}
        </p>
      </header>
      <GlassModule :locale="props.locale" />
    </section>
  </div>
</template>
