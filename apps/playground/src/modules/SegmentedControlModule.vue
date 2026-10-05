<script setup lang="ts">
import type { SegmentOption } from '@neoverse-ui/vue';
import { UiSegmentedControl } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import { formatLocalized, localize, localized, moduleCopy } from '../playground-content';
import QaPreviewMatrix from '../QaPreviewMatrix.vue';
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
const focusCopy = {
  label: localized('Focus', '焦点'),
  hint: localized(
    'Tab to the active option to inspect the keyboard focus ring.',
    'Tab 到当前选项以查看键盘焦点环。',
  ),
} as const;
const qaCopy = {
  label: localized('Canonical QA', '规范 QA'),
  hint: localized(
    'The standalone well and selected plate are compared against the same three backdrop contexts.',
    '在三种一致的背景环境中检查独立分段控件的底槽与选中层。',
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
  <StateRow :label="focusCopy.label" :hint="focusCopy.hint" :locale="props.locale">
    <UiSegmentedControl
      :aria-label="localize(copy.aria.view, props.locale)"
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
  <StateRow :label="qaCopy.label" :hint="qaCopy.hint" :locale="props.locale">
    <QaPreviewMatrix :locale="props.locale">
      <UiSegmentedControl
        :aria-label="localize(copy.aria.view, props.locale)"
        :options="ariaOptions"
      />
    </QaPreviewMatrix>
  </StateRow>
</template>
