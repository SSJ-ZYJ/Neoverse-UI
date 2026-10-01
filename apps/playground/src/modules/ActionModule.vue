<script setup lang="ts">
import { UiAction } from '@neoverse-ui/vue';
import LabIcon from '../LabIcon.vue';
import { localize, localized, moduleCopy } from '../playground-content';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.action;
const contractCopy = {
  label: localized('Composition contract', '组合契约'),
  hint: localized(
    'Scale, stretch, and surface ownership can change independently without changing link semantics.',
    'Scale、stretch 与 Surface 归属可以独立变化，不影响链接语义。',
  ),
} as const;
</script>

<template>
  <StateRow
    :label="copy.states.default.label"
    :hint="copy.states.default.hint"
    :locale="props.locale"
  >
    <UiAction href="#controls-action" @click.prevent>
      <template #leading><LabIcon name="globe" /></template>
      {{ localize(copy.controls.primary, props.locale) }}
    </UiAction>
    <UiAction href="#controls-action" @click.prevent variant="secondary">
      {{ localize(copy.controls.secondary, props.locale) }}
      <template #trailing><LabIcon name="arrow-right" /></template>
    </UiAction>
    <UiAction href="#controls-action" @click.prevent variant="ghost">
      {{ localize(copy.controls.ghost, props.locale) }}
    </UiAction>
  </StateRow>

  <StateRow :label="copy.states.sizes.label" :hint="copy.states.sizes.hint" :locale="props.locale">
    <UiAction href="#controls-action" @click.prevent size="sm"
      >{{ localize(copy.controls.small, props.locale) }}</UiAction
    >
    <UiAction href="#controls-action" @click.prevent size="md"
      >{{ localize(copy.controls.medium, props.locale) }}</UiAction
    >
    <UiAction href="#controls-action" @click.prevent size="lg"
      >{{ localize(copy.controls.large, props.locale) }}</UiAction
    >
  </StateRow>

  <StateRow :label="copy.states.hover.label" :hint="copy.states.hover.hint" :locale="props.locale">
    <UiAction href="#controls-action" @click.prevent
      >{{ localize(copy.controls.hover, props.locale) }}</UiAction
    >
  </StateRow>

  <StateRow
    :label="copy.states.active.label"
    :hint="copy.states.active.hint"
    :locale="props.locale"
  >
    <UiAction href="#controls-action" @click.prevent
      >{{ localize(copy.controls.active, props.locale) }}</UiAction
    >
  </StateRow>

  <StateRow :label="copy.states.focus.label" :hint="copy.states.focus.hint" :locale="props.locale">
    <UiAction href="#controls-action" @click.prevent
      >{{ localize(copy.controls.focus, props.locale) }}</UiAction
    >
  </StateRow>

  <StateRow :label="copy.states.disabled.label" :locale="props.locale">
    <UiAction href="#controls-action" @click.prevent disabled
      >{{ localize(copy.controls.disabled, props.locale) }}</UiAction
    >
  </StateRow>

  <StateRow :label="contractCopy.label" :hint="contractCopy.hint" :locale="props.locale">
    <div class="grid w-full gap-2 md:grid-cols-3">
      <UiAction href="#controls-action" @click.prevent surface="none" variant="ghost">
        surface="none"
      </UiAction>
      <UiAction href="#controls-action" @click.prevent scale="lg" variant="secondary">
        scale="lg"
      </UiAction>
      <UiAction href="#controls-action" @click.prevent stretch> stretch </UiAction>
    </div>
  </StateRow>
</template>
