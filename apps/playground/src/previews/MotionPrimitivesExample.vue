<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
import { motionBaseGroups } from '../lab-data';
import type { LabModuleProps } from '../modules/types';
import { localize } from '../playground-content';

const props = defineProps<LabModuleProps>();

const motionBaseEntries = motionBaseGroups.map((group) => ({
  ...group,
  entries: Object.entries(group.values),
}));
</script>

<template>
  <UiSurface surface="glass-subtle" class="playground-specimen-panel grid gap-3 md:grid-cols-3">
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
