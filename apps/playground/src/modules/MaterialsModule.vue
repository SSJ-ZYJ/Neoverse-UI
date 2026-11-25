<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, moduleCopy } from '../playground-content';
import SurfaceModule from './SurfaceModule.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <LabSpecimenSection
    id="materials-surface"
    :title="localize(moduleCopy.surface.label, props.locale)"
    :description="localize(moduleCopy.surface.description, props.locale)"
  >
    <SurfaceModule :locale="props.locale" />
  </LabSpecimenSection>
</template>
