<script setup lang="ts">
import { localize, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabSpecimenSection from '../../features/stage/LabSpecimenSection.vue';
import BorderModule from './BorderModule.vue';
import RadiusModule from './RadiusModule.vue';
import SpacingModule from './SpacingModule.vue';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div id="foundation-layout-shape" class="scroll-mt-24 grid gap-grid">
    <LabSpecimenSection
      id="layout-shape-spacing"
      :title="localize(moduleCopy.spacing.label, props.locale)"
      :description="localize(moduleCopy.spacing.description, props.locale)"
    >
      <SpacingModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="layout-shape-radius"
      :title="localize(moduleCopy.radius.label, props.locale)"
      :description="localize(moduleCopy.radius.description, props.locale)"
    >
      <RadiusModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="layout-shape-border"
      :title="localize(moduleCopy.border.label, props.locale)"
      :description="localize(moduleCopy.border.description, props.locale)"
    >
      <BorderModule :locale="props.locale" />
    </LabSpecimenSection>
  </div>
</template>
