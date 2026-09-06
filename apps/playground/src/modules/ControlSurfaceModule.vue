<script setup lang="ts">
import { UiButton, UiControlSurface, UiIconButton, UiSegmentedControl } from '@neoverse-ui/vue';
import LabIcon from '../LabIcon.vue';
import { localize, moduleCopy } from '../playground-content';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.controlSurface;
const variants = ['subtle', 'elevated', 'immersive'] as const;
const viewOptions = [
  { value: 'map', label: 'Map' },
  { value: 'list', label: 'List' },
] as const;
</script>

<template>
  <StateRow
    :label="copy.states.toolbar.label"
    :hint="copy.states.toolbar.hint"
    :locale="props.locale"
  >
    <UiControlSurface role="toolbar" :aria-label="localize(copy.controls.toolbar, props.locale)">
      <UiIconButton variant="ghost" size="sm" :label="localize(copy.controls.add, props.locale)">
        <LabIcon name="plus" />
      </UiIconButton>
      <UiIconButton
        variant="ghost"
        size="sm"
        :label="localize(copy.controls.confirm, props.locale)"
      >
        <LabIcon name="check" />
      </UiIconButton>
      <template #trailing>
        <UiButton size="sm">{{ localize(copy.controls.publish, props.locale) }}</UiButton>
      </template>
    </UiControlSurface>
  </StateRow>

  <StateRow
    :label="copy.states.variants.label"
    :hint="copy.states.variants.hint"
    :locale="props.locale"
  >
    <div class="grid w-full gap-3 md:grid-cols-3">
      <UiControlSurface v-for="variant in variants" :key="variant" :variant="variant">
        <span class="px-2 text-caption font-label text-primary">{{ variant }}</span>
      </UiControlSurface>
    </div>
  </StateRow>

  <StateRow
    :label="copy.states.trailing.label"
    :hint="copy.states.trailing.hint"
    :locale="props.locale"
  >
    <UiControlSurface as="nav" :aria-label="localize(copy.controls.view, props.locale)">
      <UiButton variant="ghost" size="sm"
        >{{ localize(copy.controls.canvas, props.locale) }}</UiButton
      >
      <template #trailing>
        <UiSegmentedControl
          :aria-label="localize(copy.controls.view, props.locale)"
          :options="viewOptions"
        />
      </template>
    </UiControlSurface>
  </StateRow>
</template>
