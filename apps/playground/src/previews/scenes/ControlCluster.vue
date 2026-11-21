<script setup lang="ts">
import type { SegmentOption } from '@neoverse-ui/vue';
import { UiBadge, UiButton, UiIconButton, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import LabIcon from '../../LabIcon.vue';
import type { LabModuleProps } from '../../modules/types';
import { localize, moduleCopy } from '../../playground-content';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.composition;
const controlClusterMode = ref('focus');

const controlClusterOptions = computed<readonly SegmentOption[]>(() => [
  {
    value: 'focus',
    label: localize(copy.scenes.controlCluster.modes.focus, props.locale),
  },
  {
    value: 'review',
    label: localize(copy.scenes.controlCluster.modes.review, props.locale),
  },
  {
    value: 'archive',
    label: localize(copy.scenes.controlCluster.modes.archive, props.locale),
  },
]);
</script>

<template>
  <UiSurface surface="glass-subtle" class="rounded-card p-4" data-composition-surface>
    <div class="grid gap-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-caption text-muted">Neoverse UI</p>
          <h4 class="text-label font-label text-primary">
            {{ localize(copy.scenes.controlCluster.workspace, props.locale) }}
          </h4>
        </div>
        <div class="flex items-center gap-2">
          <UiBadge variant="success">
            {{ localize(copy.scenes.controlCluster.status, props.locale) }}
          </UiBadge>
          <UiIconButton
            variant="ghost"
            size="sm"
            :label="localize(copy.scenes.controlCluster.more, props.locale)"
          >
            <LabIcon name="menu" />
          </UiIconButton>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UiSegmentedControl
          v-model="controlClusterMode"
          class="shrink-0"
          :aria-label="localize(copy.scenes.controlCluster.modesLabel, props.locale)"
          :options="controlClusterOptions"
        />
        <UiButton size="sm">
          {{ localize(copy.scenes.controlCluster.apply, props.locale) }}
        </UiButton>
      </div>
    </div>
  </UiSurface>
</template>
