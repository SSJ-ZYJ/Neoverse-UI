<script setup lang="ts">
import { localize, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabSpecimenSection from '../../features/stage/LabSpecimenSection.vue';
import MotionPresenceExample from './MotionPresenceExample.vue';
import MotionStaggerExample from './MotionStaggerExample.vue';

const props = defineProps<LabModuleProps>();
const presenceCopy = moduleCopy.motion.presence;
</script>

<template>
  <div id="motion-presence-root" class="scroll-mt-24 grid gap-grid">
    <MotionPresenceExample
      id="foundation-motion-presence"
      :locale="props.locale"
      :frame="LabSpecimenSection"
      :title="localize(presenceCopy.label, props.locale)"
      :description="localize(presenceCopy.description, props.locale)"
    />

    <MotionStaggerExample
      id="foundation-motion-presence-group"
      :locale="props.locale"
      :frame="LabSpecimenSection"
      :title="localize(presenceCopy.stagger, props.locale)"
      :description="localize(presenceCopy.staggerDescription, props.locale)"
    />
  </div>
</template>
