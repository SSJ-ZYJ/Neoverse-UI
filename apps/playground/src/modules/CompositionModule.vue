<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, moduleCopy } from '../playground-content';
import CompositionSceneSet from './CompositionSceneSet.vue';
import ReducedTransparencyComposition from './ReducedTransparencyComposition.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.composition;
</script>

<template>
  <div class="grid gap-6">
    <LabSpecimenSection
      id="composition-standard-mode"
      :title="localize(copy.previewModes.standard.label, props.locale)"
      :description="localize(copy.previewModes.standard.description, props.locale)"
    >
      <CompositionSceneSet :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="composition-accessibility-mode"
      :title="localize(copy.previewModes.accessibility.label, props.locale)"
      :description="localize(copy.previewModes.accessibility.description, props.locale)"
    >
      <ReducedTransparencyComposition :locale="props.locale" />
    </LabSpecimenSection>
  </div>
</template>
