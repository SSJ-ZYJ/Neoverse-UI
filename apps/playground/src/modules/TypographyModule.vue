<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, localized } from '../playground-content';
import ProseExample from '../previews/ProseExample.vue';
import { proseCopy } from '../previews/prose-copy';
import TypographyScaleExample from '../previews/TypographyScaleExample.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const scaleCopy = {
  title: localized('Semantic type scale', '语义字体层级'),
  description: localized(
    'Display, title, body, and label roles expose one explicit canonical size scale.',
    'Display、Title、Body 与 Label 通过明确尺寸层级表达，同时保留旧有别名兼容。',
  ),
} as const;
</script>

<template>
  <div id="foundation-typography" class="scroll-mt-24 grid gap-grid">
    <LabSpecimenSection
      id="typography-scale"
      :title="localize(scaleCopy.title, props.locale)"
      :description="localize(scaleCopy.description, props.locale)"
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
