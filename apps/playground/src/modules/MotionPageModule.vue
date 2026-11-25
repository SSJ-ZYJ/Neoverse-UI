<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, moduleCopy } from '../playground-content';
import MotionPageExample from '../previews/MotionPageExample.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const pageCopy = moduleCopy.motion.page;
</script>

<template>
  <div id="motion-page-root" class="scroll-mt-24 grid gap-grid">
    <MotionPageExample
      id="foundation-motion-page"
      :locale="props.locale"
      :frame="LabSpecimenSection"
      :title="localize(pageCopy.label, props.locale)"
      :description="localize(pageCopy.description, props.locale)"
    />
  </div>
</template>
