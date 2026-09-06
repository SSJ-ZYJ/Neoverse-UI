<script setup lang="ts">
import { UiStatusIndicator } from '@neoverse-ui/vue';
import { localize, moduleCopy } from '../playground-content';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.statusIndicator;
</script>

<template>
  <StateRow
    :label="copy.states.statuses.label"
    :hint="copy.states.statuses.hint"
    :locale="props.locale"
  >
    <UiStatusIndicator status="neutral"
      >{{ localize(copy.controls.neutral, props.locale) }}</UiStatusIndicator
    >
    <UiStatusIndicator status="info"
      >{{ localize(copy.controls.info, props.locale) }}</UiStatusIndicator
    >
    <UiStatusIndicator status="success"
      >{{ localize(copy.controls.success, props.locale) }}</UiStatusIndicator
    >
    <UiStatusIndicator status="warning"
      >{{ localize(copy.controls.warning, props.locale) }}</UiStatusIndicator
    >
    <UiStatusIndicator status="danger"
      >{{ localize(copy.controls.danger, props.locale) }}</UiStatusIndicator
    >
  </StateRow>

  <StateRow :label="copy.states.live.label" :hint="copy.states.live.hint" :locale="props.locale">
    <UiStatusIndicator status="success" pulse role="status">
      {{ localize(copy.controls.available, props.locale) }}
    </UiStatusIndicator>
  </StateRow>

  <StateRow :label="copy.states.sizes.label" :locale="props.locale">
    <UiStatusIndicator status="info" size="sm"
      >{{ localize(copy.controls.small, props.locale) }}</UiStatusIndicator
    >
    <UiStatusIndicator status="info" size="md"
      >{{ localize(copy.controls.medium, props.locale) }}</UiStatusIndicator
    >
  </StateRow>
</template>
