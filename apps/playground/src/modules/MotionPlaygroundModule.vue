<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize } from '../playground-content';
import MotionPlaygroundExample from '../previews/MotionPlaygroundExample.vue';
import { motionPlaygroundCopy } from '../previews/motion-playground-copy';
import type { LabModuleProps } from './types';

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
