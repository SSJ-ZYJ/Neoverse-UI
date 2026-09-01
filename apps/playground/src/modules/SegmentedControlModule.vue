<script setup lang="ts">
import type { SegmentOption } from '@neoverse-ui/vue';
import { UiSegmentedControl } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import { formatLocalized, localize, moduleCopy } from '../playground-content';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.segmentedControl;
const segmentedValue = ref('overview');
const segmentedOptions = computed<readonly SegmentOption[]>(() => [
  { value: 'overview', label: localize(copy.options.overview, props.locale) },
  { value: 'details', label: localize(copy.options.details, props.locale), disabled: true },
  { value: 'activity', label: localize(copy.options.activity, props.locale) },
]);
</script>

<template>
  <StateRow :label="copy.states.default" :hint="copy.hints.keyboard" :locale="props.locale">
    <UiSegmentedControl
      v-model="segmentedValue"
      :aria-label="localize(copy.aria.view, props.locale)"
      :options="segmentedOptions"
    />
    <span class="text-caption text-secondary">
      {{ formatLocalized(copy.controls.selected, props.locale, { value: segmentedValue }) }}
    </span>
  </StateRow>
  <StateRow :label="copy.states.sizes" :locale="props.locale">
    <UiSegmentedControl
      :aria-label="localize(copy.controls.small, props.locale)"
      size="sm"
      :options="segmentedOptions"
    />
    <UiSegmentedControl
      :aria-label="localize(copy.controls.medium, props.locale)"
      size="md"
      :options="segmentedOptions"
    />
  </StateRow>
  <StateRow :label="copy.states.disabled" :locale="props.locale">
    <UiSegmentedControl
      :aria-label="localize(copy.controls.disabled, props.locale)"
      disabled
      :options="segmentedOptions"
    />
  </StateRow>
  <StateRow :label="copy.states.loading" :hint="copy.hints.loading" :locale="props.locale">
    <UiSegmentedControl
      :aria-label="localize(copy.controls.loading, props.locale)"
      loading
      :options="segmentedOptions"
    />
  </StateRow>
</template>
