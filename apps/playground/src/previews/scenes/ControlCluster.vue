<script setup lang="ts">
import { UiBadge, UiButton, UiIconButton, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { computed } from 'vue';
import LabIcon from '../../LabIcon.vue';
import type { LabModuleProps } from '../../modules/types';
import { localize, moduleCopy } from '../../playground-content';
import {
  type ControlClusterConfiguration,
  type ControlClusterMode,
  controlClusterMode,
  controlClusterPresets,
} from '../composition-settings';

const props = withDefaults(
  defineProps<LabModuleProps & { configuration?: Readonly<ControlClusterConfiguration> }>(),
  { configuration: () => controlClusterPresets[0].props },
);
const mode = defineModel<ControlClusterMode>({ default: controlClusterPresets[0].state.mode });
const copy = moduleCopy.composition.scenes.controlCluster;
const options = computed(() =>
  controlClusterMode.options.map(({ value, label }) => ({
    value,
    label: localize(label, props.locale),
  })),
);

function selectMode(value: string): void {
  const choice = controlClusterMode.options.find((option) => option.value === value);
  if (choice) mode.value = choice.value;
}
</script>

<template>
  <UiSurface
    :surface="props.configuration.surface"
    class="playground-composition-density rounded-card"
    :data-compact="props.configuration.compact || undefined"
    data-composition-surface
  >
    <div class="grid" :class="props.configuration.compact ? 'gap-2' : 'gap-3'">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-caption text-muted">Neoverse UI</p>
          <h4 class="text-label font-label text-primary">
            {{ localize(copy.workspace, props.locale) }}
          </h4>
        </div>
        <div class="flex items-center gap-2">
          <UiBadge v-if="props.configuration.showStatus" variant="success" data-specimen-status>
            {{ localize(copy.status, props.locale) }}
          </UiBadge>
          <UiIconButton variant="ghost" size="sm" :label="localize(copy.more, props.locale)">
            <LabIcon name="menu" />
          </UiIconButton>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UiSegmentedControl
          :model-value="mode"
          class="shrink-0"
          :aria-label="localize(copy.modesLabel, props.locale)"
          :options="options"
          @update:model-value="selectMode"
        />
        <UiButton size="sm">
          {{ localize(copy.apply, props.locale) }}
        </UiButton>
      </div>
    </div>
  </UiSurface>
</template>
