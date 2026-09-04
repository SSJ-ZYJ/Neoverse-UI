<script setup lang="ts">
import type { SegmentOption } from '@neoverse-ui/vue';
import { UiButton, UiIconButton, UiSegmentedControl } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import LabIcon from '../LabIcon.vue';
import { localize, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.density;
const profiles = ['desktop', 'touch'] as const;
const selectedValue = ref('overview');
const options = computed<readonly SegmentOption[]>(() => [
  { value: 'overview', label: localize(copy.controls.overview, props.locale) },
  { value: 'details', label: localize(copy.controls.details, props.locale) },
  { value: 'activity', label: localize(copy.controls.activity, props.locale) },
]);
</script>

<template>
  <div class="grid gap-grid md:grid-cols-2" data-density-comparison>
    <article
      v-for="profile in profiles"
      :key="profile"
      class="grid gap-3 rounded-control material-glass-subtle p-4"
      :data-pointer-profile="profile"
    >
      <div>
        <h3 class="text-label font-label text-primary">
          {{ localize(copy.profiles[profile].label, props.locale) }}
        </h3>
        <p class="mt-1 text-caption text-secondary">
          {{ localize(copy.profiles[profile].hint, props.locale) }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3" data-density-controls>
        <UiButton size="sm">{{ localize(copy.controls.button, props.locale) }}</UiButton>
        <UiIconButton size="sm" :label="localize(copy.controls.iconButton, props.locale)">
          <LabIcon name="plus" />
        </UiIconButton>
        <UiSegmentedControl
          v-model="selectedValue"
          :aria-label="localize(copy.controls.segment, props.locale)"
          :options="options"
        />
      </div>
    </article>
  </div>
</template>
