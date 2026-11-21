<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, moduleCopy } from '../playground-content';
import MotionPageExample from '../previews/MotionPageExample.vue';
import MotionPresenceExample from '../previews/MotionPresenceExample.vue';
import MotionPrimitivesExample from '../previews/MotionPrimitivesExample.vue';
import MotionStaggerExample from '../previews/MotionStaggerExample.vue';
import MotionWidthExample from '../previews/MotionWidthExample.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const presenceCopy = moduleCopy.motion.presence;
const widthCopy = moduleCopy.motion.width;
const pageCopy = moduleCopy.motion.page;
</script>

<template>
  <div id="foundation-motion" class="scroll-mt-24 grid gap-grid">
    <LabSpecimenSection
      id="motion-primitive"
      :title="localize(moduleCopy.motion.primitive.label, props.locale)"
      :description="localize(moduleCopy.motion.primitive.description, props.locale)"
    >
      <MotionPrimitivesExample :locale="props.locale" />
    </LabSpecimenSection>

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

    <LabSpecimenSection
      id="foundation-motion-width"
      :title="localize(widthCopy.label, props.locale)"
      :description="localize(widthCopy.description, props.locale)"
    >
      <MotionWidthExample :locale="props.locale" />
    </LabSpecimenSection>

    <MotionPageExample
      id="foundation-motion-page"
      :locale="props.locale"
      :frame="LabSpecimenSection"
      :title="localize(pageCopy.label, props.locale)"
      :description="localize(pageCopy.description, props.locale)"
    />
  </div>
</template>
