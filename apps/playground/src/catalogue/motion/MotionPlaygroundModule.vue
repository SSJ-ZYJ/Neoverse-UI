<script setup lang="ts">
import { localize } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabSpecimenSection from '../../features/stage/LabSpecimenSection.vue';
import MotionPlaygroundExample from './MotionPlaygroundExample.vue';
import { motionPlaygroundCopy } from './motion-playground-copy';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div id="motion-playground-root" class="scroll-mt-24 grid gap-grid">
    <LabSpecimenSection
      id="foundation-motion-playground"
      :title="localize(motionPlaygroundCopy.label, props.locale)"
      :description="localize(motionPlaygroundCopy.description, props.locale)"
    >
      <MotionPlaygroundExample :locale="props.locale" />
    </LabSpecimenSection>
  </div>
</template>
