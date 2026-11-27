<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
import { computed } from 'vue';
import { localize } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import { motionBaseGroups } from '../foundations/lab-data';

const props = withDefaults(
  defineProps<
    LabModuleProps & {
      category?: 'all' | 'durations' | 'easings' | 'distances';
    }
  >(),
  {
    category: 'all',
  },
);

const categoryMap: Record<'durations' | 'easings' | 'distances', string> = {
  durations: 'Durations',
  easings: 'Easings',
  distances: 'Distances',
};

const motionBaseEntries = computed(() =>
  motionBaseGroups
    .filter((group) => props.category === 'all' || group.label.en === categoryMap[props.category])
    .map((group) => ({
      ...group,
      entries: Object.entries(group.values),
    })),
);
</script>

<template>
  <UiSurface
    surface="none"
    class="playground-specimen-panel grid w-full max-w-reading-wide gap-3 md:grid-cols-3"
  >
    <div v-for="group in motionBaseEntries" :key="group.label.en" class="grid gap-1">
      <h3 class="text-label font-label text-primary">
        {{ localize(group.label, props.locale) }}
      </h3>
      <code v-for="[ key, value ] in group.entries" :key="key" class="text-code text-secondary">
        {{ key }}: {{ value }}
      </code>
    </div>
  </UiSurface>
</template>
