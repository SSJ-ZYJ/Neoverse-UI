<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, moduleCopy } from '../playground-content';
import MotionPresenceExample from '../previews/MotionPresenceExample.vue';
import MotionStaggerExample from '../previews/MotionStaggerExample.vue';
import type { LabModuleProps } from './types';

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
