<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, moduleCopy } from '../playground-content';
import GlassModule from './GlassModule.vue';
import SurfaceModule from './SurfaceModule.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <LabSpecimenSection
      id="materials-surface"
      :title="localize(moduleCopy.surface.label, props.locale)"
      :description="localize(moduleCopy.surface.description, props.locale)"
    >
      <SurfaceModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="materials-glass"
      :title="localize(moduleCopy.glass.label, props.locale)"
      :description="localize(moduleCopy.glass.description, props.locale)"
    >
      <GlassModule :locale="props.locale" />
    </LabSpecimenSection>
  </div>
</template>
