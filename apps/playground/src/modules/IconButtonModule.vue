<script setup lang="ts">
import { UiIconButton } from '@neoverse-ui/vue';
import LabIcon from '../LabIcon.vue';
import { localize, moduleCopy } from '../playground-content';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.iconButton;
</script>

<template>
  <StateRow :label="copy.states.default.label" :locale="props.locale">
    <UiIconButton :label="localize(copy.controls.addItem, props.locale)">
      <LabIcon name="plus" />
    </UiIconButton>
    <UiIconButton :label="localize(copy.controls.confirm, props.locale)" variant="secondary">
      <LabIcon name="check" />
    </UiIconButton>
    <UiIconButton :label="localize(copy.controls.openDetails, props.locale)" variant="ghost">
      <LabIcon name="arrow-right" />
    </UiIconButton>
  </StateRow>
  <StateRow :label="copy.states.hover.label" :hint="copy.states.hover.hint" :locale="props.locale">
    <UiIconButton :label="localize(copy.controls.hover, props.locale)">
      <LabIcon name="spark" />
    </UiIconButton>
  </StateRow>
  <StateRow
    :label="copy.states.active.label"
    :hint="copy.states.active.hint"
    :locale="props.locale"
  >
    <UiIconButton :label="localize(copy.controls.active, props.locale)">
      <LabIcon name="plus" />
    </UiIconButton>
  </StateRow>
  <StateRow :label="copy.states.focus.label" :hint="copy.states.focus.hint" :locale="props.locale">
    <UiIconButton :label="localize(copy.controls.focus, props.locale)">
      <LabIcon name="check" />
    </UiIconButton>
  </StateRow>
  <StateRow :label="copy.states.disabled.label" :locale="props.locale">
    <UiIconButton :label="localize(copy.controls.disabled, props.locale)" disabled>
      <LabIcon name="plus" />
    </UiIconButton>
  </StateRow>
  <StateRow :label="copy.states.loading.label" :locale="props.locale">
    <UiIconButton :label="localize(copy.controls.loading, props.locale)" loading>
      <LabIcon name="spark" />
    </UiIconButton>
  </StateRow>
</template>
