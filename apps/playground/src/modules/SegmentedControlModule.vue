<script setup lang="ts">
import type { SegmentOption } from '@neoverse-ui/vue';
import { UiSegmentedControl } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import { formatLocalized, localize, localized, moduleCopy } from '../playground-content';
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
const ariaOptions = computed<readonly SegmentOption[]>(() => [
  {
    value: 'a',
    label: localize(copy.options.sectionA, props.locale),
    ariaLabel: localize(copy.controls.sectionA, props.locale),
  },
  {
    value: 'b',
    label: localize(copy.options.sectionB, props.locale),
    ariaLabel: localize(copy.controls.sectionB, props.locale),
  },
  {
    value: 'c',
    label: localize(copy.options.sectionC, props.locale),
    ariaLabel: localize(copy.controls.sectionC, props.locale),
  },
]);
const surfaceCopy = {
  label: localized('Surface ownership', 'Surface 归属'),
  hint: localized(
    'surface="none" lets a grouped parent own the chrome without duplicating material layers.',
    'surface="none" 允许分组父级负责 Chrome，避免重复叠加材质层。',
  ),
} as const;
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
  <StateRow :label="copy.states.aria" :locale="props.locale">
    <UiSegmentedControl
      :aria-label="localize(copy.aria.view, props.locale)"
      :options="ariaOptions"
    />
  </StateRow>
  <StateRow :label="surfaceCopy.label" :hint="surfaceCopy.hint" :locale="props.locale">
    <UiSegmentedControl
      surface="none"
      :aria-label="localize(copy.aria.view, props.locale)"
      :options="ariaOptions"
    />
  </StateRow>
</template>
