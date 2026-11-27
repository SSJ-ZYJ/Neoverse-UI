<script setup lang="ts">
import { localize, localized, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabSpecimenSection from '../../features/stage/LabSpecimenSection.vue';
import MotionPrimitivesExample from './MotionPrimitivesExample.vue';

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
