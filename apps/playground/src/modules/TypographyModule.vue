<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, moduleCopy } from '../playground-content';
import ProseExample from '../previews/ProseExample.vue';
import { proseCopy } from '../previews/prose-copy';
import TypographyScaleExample from '../previews/TypographyScaleExample.vue';
import type { LabModuleProps } from './types';

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
