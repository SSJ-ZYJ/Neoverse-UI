<script setup lang="ts">
import { localize, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabSpecimenSection from '../../features/stage/LabSpecimenSection.vue';
import MotionDisclosureExample from './MotionDisclosureExample.vue';

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
