<script setup lang="ts">
import { localize, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import MaterialLegend from '../materials/MaterialLegend.vue';
import CompositionSceneSet from './CompositionSceneSet.vue';
import ReducedTransparencyComposition from './ReducedTransparencyComposition.vue';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.composition;
const modes = [
  { id: 'composition-standard-mode', copy: copy.previewModes.standard, scene: CompositionSceneSet },
  {
    id: 'composition-accessibility-mode',
    copy: copy.previewModes.accessibility,
    scene: ReducedTransparencyComposition,
  },
] as const;
</script>

<template>
  <div class="grid gap-6">
    <section
      v-for="mode in modes"
      :id="mode.id"
      :key="mode.id"
      class="scroll-mt-24 grid min-w-0 gap-5"
      :aria-labelledby="`${mode.id}-title`"
    >
      <header class="grid gap-1 border-b border-subtle pb-3">
        <h3 :id="`${mode.id}-title`" class="text-title-sm font-title text-primary">
          {{ localize(mode.copy.label, props.locale) }}
        </h3>
        <p class="max-w-reading-wide text-body-sm text-secondary">
          {{ localize(mode.copy.description, props.locale) }}
        </p>
      </header>
      <component :is="mode.scene" :locale="props.locale" />
      <MaterialLegend :locale="props.locale" />
    </section>
  </div>
</template>
