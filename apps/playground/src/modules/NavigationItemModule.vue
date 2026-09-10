<script setup lang="ts">
import { UiNavigationItem } from '@neoverse-ui/vue';
import LabIcon from '../LabIcon.vue';
import { localize, moduleCopy } from '../playground-content';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.navigationItem;
</script>

<template>
  <StateRow
    :label="copy.states.default.label"
    :hint="copy.states.default.hint"
    :locale="props.locale"
  >
    <UiNavigationItem
      href="#controls-navigation-item"
      :label="localize(copy.controls.home, props.locale)"
      active
    >
      <template #icon><LabIcon name="home" /></template>
    </UiNavigationItem>
    <UiNavigationItem
      href="#controls-navigation-item"
      :label="localize(copy.controls.projects, props.locale)"
    >
      <template #icon><LabIcon name="folder" /></template>
    </UiNavigationItem>
  </StateRow>

  <StateRow
    :label="copy.states.compact.label"
    :hint="copy.states.compact.hint"
    :locale="props.locale"
  >
    <UiNavigationItem
      href="#controls-navigation-item"
      :label="localize(copy.controls.focus, props.locale)"
      compact
    >
      <template #icon><LabIcon name="target" /></template>
    </UiNavigationItem>
    <UiNavigationItem
      href="#controls-navigation-item"
      :label="localize(copy.controls.activity, props.locale)"
      compact
      active
    >
      <template #icon><LabIcon name="activity" /></template>
    </UiNavigationItem>
  </StateRow>

  <StateRow :label="copy.states.hover.label" :hint="copy.states.hover.hint" :locale="props.locale">
    <UiNavigationItem
      href="#controls-navigation-item"
      :label="localize(copy.controls.hover, props.locale)"
    >
      <template #icon><LabIcon name="target" /></template>
    </UiNavigationItem>
  </StateRow>

  <StateRow :label="copy.states.focus.label" :hint="copy.states.focus.hint" :locale="props.locale">
    <UiNavigationItem
      href="#controls-navigation-item"
      :label="localize(copy.controls.keyboardFocus, props.locale)"
    >
      <template #icon><LabIcon name="activity" /></template>
    </UiNavigationItem>
  </StateRow>

  <StateRow :label="copy.states.disabled.label" :locale="props.locale">
    <UiNavigationItem
      href="#controls-navigation-item"
      :label="localize(copy.controls.disabled, props.locale)"
      disabled
    >
      <template #icon><LabIcon name="folder" /></template>
    </UiNavigationItem>
  </StateRow>
</template>
