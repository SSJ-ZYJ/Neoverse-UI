<script setup lang="ts">
import { UiButton, UiIconButton, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { computed, ref, watch } from 'vue';
import LabIcon from '../../LabIcon.vue';
import type { LabModuleProps } from '../../modules/types';
import { localize, moduleCopy } from '../../playground-content';
import {
  type FloatingToolbarMode,
  floatingToolbarMode,
  floatingToolbarPresets,
  type ToolbarConfiguration,
} from '../composition-settings';
import { elementOf, focusAfterRemoval } from '../scene-focus';

const props = withDefaults(
  defineProps<LabModuleProps & { configuration?: Readonly<ToolbarConfiguration> }>(),
  { configuration: () => floatingToolbarPresets[0].props },
);
const mode = defineModel<FloatingToolbarMode>({ default: floatingToolbarPresets[0].state.mode });
const actions = ref<HTMLElement | null>(null);
const fallback = ref<{ $el?: unknown } | null>(null);
// Hiding can unmount the control that owns focus when an activation does not
// move focus itself, such as a platform-level click or assistant action.
watch(
  () => props.configuration.showActions,
  (showActions) => {
    if (showActions) return;
    focusAfterRemoval(actions.value, elementOf(fallback.value), document.activeElement);
  },
  { flush: 'pre' },
);
const copy = moduleCopy.composition.scenes.floatingToolbar;
const options = computed(() =>
  floatingToolbarMode.options.map(({ value, label }) => ({
    value,
    label: localize(label, props.locale),
  })),
);

function selectMode(value: string): void {
  const choice = floatingToolbarMode.options.find((option) => option.value === value);
  if (choice) mode.value = choice.value;
}
</script>

<template>
  <UiSurface
    :surface="props.configuration.surface"
    class="playground-composition-density rounded-card"
    :data-compact="props.configuration.compact || undefined"
    data-composition-surface
    role="toolbar"
    :aria-label="localize(copy.modesLabel, props.locale)"
  >
    <div
      class="flex flex-wrap items-center justify-between"
      :class="props.configuration.compact ? 'gap-2' : 'gap-3'"
    >
      <div
        class="flex min-w-0 flex-1 flex-wrap items-center gap-2"
        :class="props.configuration.compact ? 'basis-auto' : 'basis-full md:basis-auto'"
      >
        <div class="flex items-center gap-1">
          <UiIconButton variant="ghost" size="sm" :label="localize(copy.highlight, props.locale)">
            <LabIcon name="spark" />
          </UiIconButton>
          <UiIconButton variant="ghost" size="sm" :label="localize(copy.add, props.locale)">
            <LabIcon name="plus" />
          </UiIconButton>
          <UiIconButton variant="ghost" size="sm" :label="localize(copy.confirm, props.locale)">
            <LabIcon name="check" />
          </UiIconButton>
          <UiIconButton
            ref="fallback"
            variant="ghost"
            size="sm"
            :label="localize(copy.more, props.locale)"
          >
            <LabIcon name="menu" />
          </UiIconButton>
        </div>
        <div :class="props.configuration.compact ? 'shrink-0' : 'basis-full md:basis-auto'">
          <UiSegmentedControl
            :model-value="mode"
            :class="props.configuration.compact ? '' : 'w-full md:w-auto'"
            :aria-label="localize(copy.modesLabel, props.locale)"
            :options="options"
            @update:model-value="selectMode"
          />
        </div>
      </div>

      <div
        v-if="props.configuration.showActions"
        ref="actions"
        class="flex items-center gap-2"
        :class="{ 'w-full md:w-auto': !props.configuration.compact }"
        data-specimen-extra-actions
      >
        <UiButton variant="secondary" size="sm">
          {{ localize(copy.share, props.locale) }}
        </UiButton>
        <UiButton size="sm">
          {{ localize(copy.publish, props.locale) }}
        </UiButton>
      </div>
    </div>
  </UiSurface>
</template>
