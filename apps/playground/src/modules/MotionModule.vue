<script setup lang="ts">
import LabIcon from '../LabIcon.vue';
import { motionSamples, motionVariableGroups } from '../lab-data';
import { formatLocalized, localize, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const motionVariableEntries = motionVariableGroups.map((group) => ({
  ...group,
  entries: Object.entries(group.values),
}));
</script>

<template>
  <div class="grid gap-grid md:grid-cols-3">
    <article
      v-for="sample in motionSamples"
      :key="sample.label.en"
      class="grid gap-3 rounded-control border border-subtle bg-surface-canvas p-4"
    >
      <div
        :class="[
          'flex items-center justify-between gap-3 rounded-control bg-surface-raised p-4',
          sample.className,
        ]"
      >
        <span class="text-label font-label text-primary">
          {{ localize(sample.label, props.locale) }}
        </span>
        <LabIcon name="arrow-right" />
      </div>
      <code class="text-code text-secondary">{{ sample.duration }} · {{ sample.easing }}</code>
      <div class="grid gap-1 text-code text-muted">
        <span>{{ sample.transition.duration }}</span>
        <span>{{ sample.transition.easing }}</span>
        <span>{{ sample.transition.property }}</span>
      </div>
    </article>
  </div>
  <div class="grid gap-3 rounded-control border border-subtle bg-surface-canvas p-4">
    <div v-for="group in motionVariableEntries" :key="group.label.en" class="grid gap-1">
      <h3 class="text-label font-label text-primary">
        {{ formatLocalized(moduleCopy.motion.cssVariables, props.locale, { label: localize(group.label, props.locale) }) }}
      </h3>
      <code v-for="[ key, value ] in group.entries" :key="key" class="text-code text-secondary">
        {{ key }}: {{ value }}
      </code>
    </div>
  </div>
</template>
