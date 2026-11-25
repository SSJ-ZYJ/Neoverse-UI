<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, localized, moduleCopy } from '../playground-content';
import MotionPrimitivesExample from '../previews/MotionPrimitivesExample.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const title = localized('Motion tokens', '动效令牌');
</script>

<template>
  <div id="motion-tokens-root" class="scroll-mt-24 grid gap-grid">
    <LabSpecimenSection
      id="foundation-motion"
      :title="localize(title, props.locale)"
      :description="localize(moduleCopy.motion.primitive.description, props.locale)"
    >
      <MotionPrimitivesExample :locale="props.locale" />
    </LabSpecimenSection>
  </div>
</template>
