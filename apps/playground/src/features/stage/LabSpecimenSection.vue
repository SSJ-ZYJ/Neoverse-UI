<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
import { frameView } from '../../app/frame-state';
import LabSpecimenHeader from './LabSpecimenHeader.vue';

interface LabSpecimenSectionProps {
  id: string;
  title: string;
  description: string;
  headingLevel?: 2 | 3;
}

const props = withDefaults(defineProps<LabSpecimenSectionProps>(), {
  headingLevel: 3,
});
</script>

<template>
  <UiSurface
    as="section"
    :surface="frameView ? 'auto' : 'none'"
    content-overflow="visible"
    :id="props.id"
    class="playground-specimen-section playground-floating-interaction-surface scroll-mt-24 rounded-panel p-4 md:p-5"
    :aria-labelledby="`${props.id}-title`"
  >
    <LabSpecimenHeader
      class="playground-specimen-section__header"
      size="section"
      :heading-level="props.headingLevel"
      :title-id="`${props.id}-title`"
      :title="props.title"
      :description="props.description"
    >
      <template v-if="$slots.action" #action>
        <slot name="action" />
      </template>
    </LabSpecimenHeader>
    <div class="grid gap-2">
      <slot />
    </div>
  </UiSurface>
</template>
