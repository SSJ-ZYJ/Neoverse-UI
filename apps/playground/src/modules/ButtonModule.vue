<script setup lang="ts">
import { UiButton } from '@neoverse-ui/vue';
import { localize, moduleCopy } from '../playground-content';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.button;
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
</template>
