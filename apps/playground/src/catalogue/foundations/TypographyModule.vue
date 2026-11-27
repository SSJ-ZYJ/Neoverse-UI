<script setup lang="ts">
import { localize, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabSpecimenSection from '../../features/stage/LabSpecimenSection.vue';
import ProseExample from './ProseExample.vue';
import { proseCopy } from './prose-copy';
import TypographyScaleExample from './TypographyScaleExample.vue';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div id="foundation-typography" class="scroll-mt-24 grid gap-grid">
    <LabSpecimenSection
      id="typography-scale"
      :title="localize(moduleCopy.typography.scale.label, props.locale)"
      :description="localize(moduleCopy.typography.scale.description, props.locale)"
    >
      <TypographyScaleExample :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="foundation-prose"
      :title="localize(proseCopy.prose, props.locale)"
      :description="localize(proseCopy.proseDescription, props.locale)"
    >
      <ProseExample :locale="props.locale" />
    </LabSpecimenSection>
  </div>
</template>
