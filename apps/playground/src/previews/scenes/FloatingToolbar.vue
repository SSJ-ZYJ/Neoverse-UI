<script setup lang="ts">
import type { SegmentOption } from '@neoverse-ui/vue';
import { UiButton, UiIconButton, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { computed } from 'vue';
import LabIcon from '../../LabIcon.vue';
import type { LabModuleProps } from '../../modules/types';
import { localize, moduleCopy } from '../../playground-content';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.composition;
const floatingToolbarOptions = computed<readonly SegmentOption[]>(() => [
  {
    value: 'canvas',
    label: localize(copy.scenes.floatingToolbar.modes.canvas, props.locale),
  },
  {
    value: 'inspect',
    label: localize(copy.scenes.floatingToolbar.modes.inspect, props.locale),
  },
  {
    value: 'history',
    label: localize(copy.scenes.floatingToolbar.modes.history, props.locale),
  },
]);
</script>

<template>
  <UiSurface
    surface="glass-immersive"
    class="rounded-card p-4"
    data-composition-surface
    role="toolbar"
    :aria-label="localize(copy.scenes.floatingToolbar.modesLabel, props.locale)"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div
        class="flex w-full min-w-0 shrink-0 basis-full flex-1 flex-wrap items-center gap-2 md:w-auto md:shrink md:basis-auto"
      >
        <div class="flex items-center gap-1">
          <UiIconButton
            variant="ghost"
            size="sm"
            :label="localize(copy.scenes.floatingToolbar.highlight, props.locale)"
          >
            <LabIcon name="spark" />
          </UiIconButton>
          <UiIconButton
            variant="ghost"
            size="sm"
            :label="localize(copy.scenes.floatingToolbar.add, props.locale)"
          >
            <LabIcon name="plus" />
          </UiIconButton>
          <UiIconButton
            variant="ghost"
            size="sm"
            :label="localize(copy.scenes.floatingToolbar.confirm, props.locale)"
          >
            <LabIcon name="check" />
          </UiIconButton>
          <UiIconButton
            variant="ghost"
            size="sm"
            :label="localize(copy.scenes.floatingToolbar.more, props.locale)"
          >
            <LabIcon name="menu" />
          </UiIconButton>
        </div>
        <div class="w-full shrink-0 basis-full md:w-auto md:basis-auto">
          <UiSegmentedControl
            class="w-full shrink-0 md:w-auto"
            :aria-label="localize(copy.scenes.floatingToolbar.modesLabel, props.locale)"
            :options="floatingToolbarOptions"
          />
        </div>
      </div>

      <div class="flex w-full items-center gap-2 md:w-auto">
        <UiButton variant="secondary" size="sm">
          {{ localize(copy.scenes.floatingToolbar.share, props.locale) }}
        </UiButton>
        <UiButton size="sm">
          {{ localize(copy.scenes.floatingToolbar.publish, props.locale) }}
        </UiButton>
      </div>
    </div>
  </UiSurface>
</template>
