<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
import { computed } from 'vue';

interface LabSpecimenSectionProps {
  id: string;
  title: string;
  description: string;
  headingLevel?: 2 | 3;
}

const props = withDefaults(defineProps<LabSpecimenSectionProps>(), {
  headingLevel: 3,
});
const headingTag = computed(() => `h${props.headingLevel}`);
</script>

<template>
  <UiSurface
    as="section"
    surface="glass-subtle"
    content-overflow="visible"
    :id="props.id"
    class="playground-specimen-section playground-floating-interaction-surface scroll-mt-24 rounded-panel p-4 md:p-5"
    :aria-labelledby="`${props.id}-title`"
  >
    <header class="playground-specimen-section__header">
      <div class="grid min-w-0 gap-1">
        <component
          :is="headingTag"
          :id="`${props.id}-title`"
          class="text-title-sm font-title text-primary"
        >
          {{ props.title }}
        </component>
        <p class="max-w-reading-wide text-body-sm text-secondary">
          {{ props.description }}
        </p>
      </div>
      <div v-if="$slots.action" class="shrink-0">
        <slot name="action" />
      </div>
    </header>
    <div class="grid gap-2">
      <slot />
    </div>
  </UiSurface>
</template>
