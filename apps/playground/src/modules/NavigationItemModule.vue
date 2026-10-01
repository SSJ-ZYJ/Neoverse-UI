<script setup lang="ts">
import { UiNavigationItem } from '@neoverse-ui/vue';
import LabIcon from '../LabIcon.vue';
import { localize, localized, moduleCopy } from '../playground-content';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.navigationItem;
const contractCopy = {
  label: localized('Layout contract', '布局契约'),
  hint: localized(
    'Stretch, start indicators, and parent-owned surfaces are independent navigation concerns.',
    '撑满布局、起始指示器与父级 Surface 归属是相互独立的导航能力。',
  ),
} as const;
</script>

<template>
  <StateRow
    :label="copy.states.default.label"
    :hint="copy.states.default.hint"
    :locale="props.locale"
  >
    <UiNavigationItem
      href="#controls-navigation-item"
      @click.prevent
      :label="localize(copy.controls.home, props.locale)"
      active
    >
      <template #icon><LabIcon name="home" /></template>
    </UiNavigationItem>
    <UiNavigationItem
      href="#controls-navigation-item"
      @click.prevent
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
      @click.prevent
      :label="localize(copy.controls.focus, props.locale)"
      compact
    >
      <template #icon><LabIcon name="target" /></template>
    </UiNavigationItem>
    <UiNavigationItem
      href="#controls-navigation-item"
      @click.prevent
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
      @click.prevent
      :label="localize(copy.controls.hover, props.locale)"
    >
      <template #icon><LabIcon name="target" /></template>
    </UiNavigationItem>
  </StateRow>

  <StateRow :label="copy.states.focus.label" :hint="copy.states.focus.hint" :locale="props.locale">
    <UiNavigationItem
      href="#controls-navigation-item"
      @click.prevent
      :label="localize(copy.controls.keyboardFocus, props.locale)"
    >
      <template #icon><LabIcon name="activity" /></template>
    </UiNavigationItem>
  </StateRow>

  <StateRow :label="copy.states.disabled.label" :locale="props.locale">
    <UiNavigationItem
      href="#controls-navigation-item"
      @click.prevent
      :label="localize(copy.controls.disabled, props.locale)"
      disabled
    >
      <template #icon><LabIcon name="folder" /></template>
    </UiNavigationItem>
  </StateRow>

  <StateRow :label="contractCopy.label" :hint="contractCopy.hint" :locale="props.locale">
    <div class="grid w-full gap-2 md:grid-cols-2">
      <UiNavigationItem
        href="#controls-navigation-item"
        @click.prevent
        :label="localize(copy.controls.home, props.locale)"
        active
        stretch
        surface="none"
        indicator-placement="start"
      >
        <template #icon><LabIcon name="home" /></template>
      </UiNavigationItem>
      <UiNavigationItem
        href="#controls-navigation-item"
        @click.prevent
        :label="localize(copy.controls.projects, props.locale)"
        stretch
        surface="none"
        indicator-placement="start"
      >
        <template #icon><LabIcon name="folder" /></template>
      </UiNavigationItem>
    </div>
  </StateRow>
</template>
