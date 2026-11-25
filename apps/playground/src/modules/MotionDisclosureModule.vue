<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, moduleCopy } from '../playground-content';
import MotionDisclosureExample from '../previews/MotionDisclosureExample.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const disclosureCopy = moduleCopy.motion.disclosure;
</script>

<template>
  <div id="motion-disclosure-root" class="scroll-mt-24 grid gap-grid">
    <LabSpecimenSection
      id="foundation-motion-disclosure"
      :title="localize(disclosureCopy.label, props.locale)"
      :description="localize(disclosureCopy.description, props.locale)"
    >
      <MotionDisclosureExample :locale="props.locale" />
    </LabSpecimenSection>
  </div>
</template>
