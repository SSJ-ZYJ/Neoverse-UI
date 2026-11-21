<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
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
      <MaterialBackdrop>
        <CompositionSceneSet :locale="props.locale" />
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="composition-accessibility-mode"
      :title="localize(copy.previewModes.accessibility.label, props.locale)"
      :description="localize(copy.previewModes.accessibility.description, props.locale)"
    >
      <MaterialBackdrop>
        <ReducedTransparencyComposition :locale="props.locale" />
      </MaterialBackdrop>
    </LabSpecimenSection>
  </div>
</template>
