<script setup lang="ts">
import { UiAction } from '@neoverse-ui/vue';
import LabIcon from '../LabIcon.vue';
import { localize, moduleCopy } from '../playground-content';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.action;
</script>

<template>
  <StateRow
    :label="copy.states.default.label"
    :hint="copy.states.default.hint"
    :locale="props.locale"
  >
    <UiAction href="#action">
      <template #leading><LabIcon name="globe" /></template>
      {{ localize(copy.controls.primary, props.locale) }}
    </UiAction>
    <UiAction href="#action" variant="secondary">
      {{ localize(copy.controls.secondary, props.locale) }}
      <template #trailing><LabIcon name="arrow-right" /></template>
    </UiAction>
    <UiAction href="#action" variant="ghost">
      {{ localize(copy.controls.ghost, props.locale) }}
    </UiAction>
  </StateRow>

  <StateRow :label="copy.states.sizes.label" :hint="copy.states.sizes.hint" :locale="props.locale">
    <UiAction href="#action" size="sm">{{ localize(copy.controls.small, props.locale) }}</UiAction>
    <UiAction href="#action" size="md">{{ localize(copy.controls.medium, props.locale) }}</UiAction>
    <UiAction href="#action" size="lg">{{ localize(copy.controls.large, props.locale) }}</UiAction>
  </StateRow>

  <StateRow :label="copy.states.hover.label" :hint="copy.states.hover.hint" :locale="props.locale">
    <UiAction href="#action">{{ localize(copy.controls.hover, props.locale) }}</UiAction>
  </StateRow>

  <StateRow
    :label="copy.states.active.label"
    :hint="copy.states.active.hint"
    :locale="props.locale"
  >
    <UiAction href="#action">{{ localize(copy.controls.active, props.locale) }}</UiAction>
  </StateRow>

  <StateRow :label="copy.states.focus.label" :hint="copy.states.focus.hint" :locale="props.locale">
    <UiAction href="#action">{{ localize(copy.controls.focus, props.locale) }}</UiAction>
  </StateRow>

  <StateRow :label="copy.states.disabled.label" :locale="props.locale">
    <UiAction href="#action" disabled
      >{{ localize(copy.controls.disabled, props.locale) }}</UiAction
    >
  </StateRow>
</template>
