<script setup lang="ts">
import { UiButton, UiIconButton } from '@neoverse-ui/vue';
import LabIcon from '../LabIcon.vue';
import { localize, localized, moduleCopy } from '../playground-content';
import QaPreviewMatrix from '../QaPreviewMatrix.vue';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.button;
const surfaceCopy = {
  label: localized('Surface ownership', 'Surface 归属'),
  hint: localized(
    'surface="none" removes the control plate when a parent composition already owns the material.',
    '当父级组合已经负责材质时，surface="none" 会移除控件自身的表面。',
  ),
} as const;
const qaCopy = {
  label: localized('Canonical QA', '规范 QA'),
  hint: localized(
    'Compare the same button hierarchy across gradient, neutral, and reduced-transparency contexts.',
    '在渐变、中性与降低透明度环境中对比同一组按钮层级。',
  ),
} as const;
</script>

<template>
  <StateRow
    :label="copy.states.default.label"
    :hint="copy.states.default.hint"
    :locale="props.locale"
  >
    <UiButton>{{ localize(copy.controls.default, props.locale) }}</UiButton>
    <UiButton variant="secondary">{{ localize(copy.controls.secondary, props.locale) }}</UiButton>
    <UiButton variant="ghost">{{ localize(copy.controls.ghost, props.locale) }}</UiButton>
  </StateRow>
  <StateRow :label="copy.states.hover.label" :hint="copy.states.hover.hint" :locale="props.locale">
    <UiButton>{{ localize(copy.controls.hover, props.locale) }}</UiButton>
  </StateRow>
  <StateRow
    :label="copy.states.active.label"
    :hint="copy.states.active.hint"
    :locale="props.locale"
  >
    <UiButton>{{ localize(copy.controls.active, props.locale) }}</UiButton>
  </StateRow>
  <StateRow :label="copy.states.focus.label" :hint="copy.states.focus.hint" :locale="props.locale">
    <UiButton>{{ localize(copy.controls.focus, props.locale) }}</UiButton>
  </StateRow>
  <StateRow :label="copy.states.disabled.label" :locale="props.locale">
    <UiButton disabled>{{ localize(copy.controls.disabled, props.locale) }}</UiButton>
  </StateRow>
  <StateRow
    :label="copy.states.loading.label"
    :hint="copy.states.loading.hint"
    :locale="props.locale"
  >
    <UiButton loading>{{ localize(copy.controls.loading, props.locale) }}</UiButton>
  </StateRow>
  <StateRow
    :label="copy.states.stretch.label"
    :hint="copy.states.stretch.hint"
    :locale="props.locale"
  >
    <div class="flex h-8 w-full items-stretch gap-2">
      <UiButton stretch>{{ localize(copy.controls.stretchPrimary, props.locale) }}</UiButton>
      <UiButton variant="ghost" stretch>
        {{ localize(copy.controls.stretchSecondary, props.locale) }}
      </UiButton>
      <UiIconButton stretch :label="localize(copy.controls.stretchPrimary, props.locale)">
        <LabIcon name="plus" />
      </UiIconButton>
    </div>
  </StateRow>
  <StateRow :label="surfaceCopy.label" :hint="surfaceCopy.hint" :locale="props.locale">
    <UiButton surface="none">{{ localize(copy.controls.default, props.locale) }}</UiButton>
    <UiButton surface="none" variant="secondary">
      {{ localize(copy.controls.secondary, props.locale) }}
    </UiButton>
    <UiButton surface="none" variant="ghost">
      {{ localize(copy.controls.ghost, props.locale) }}
    </UiButton>
  </StateRow>
  <StateRow :label="qaCopy.label" :hint="qaCopy.hint" :locale="props.locale">
    <QaPreviewMatrix :locale="props.locale">
      <UiButton>{{ localize(copy.controls.default, props.locale) }}</UiButton>
      <UiButton variant="secondary">{{ localize(copy.controls.secondary, props.locale) }}</UiButton>
      <UiButton variant="ghost">{{ localize(copy.controls.ghost, props.locale) }}</UiButton>
    </QaPreviewMatrix>
  </StateRow>
</template>
