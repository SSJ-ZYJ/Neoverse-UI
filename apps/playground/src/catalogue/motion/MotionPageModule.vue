<script setup lang="ts">
import { localize, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabSpecimenSection from '../../features/stage/LabSpecimenSection.vue';
import MotionPageExample from './MotionPageExample.vue';

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
