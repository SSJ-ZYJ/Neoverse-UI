<script setup lang="ts">
import { UiButton, UiIconButton, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { computed, ref, watch } from 'vue';
import { localize, moduleCopy } from '../../../content/playground-content';
import type { LabModuleProps } from '../../../features/catalogue/types';
import LabIcon from '../../../features/workspace/LabIcon.vue';
import {
  type DocsToolbarMode,
  docsToolbarMode,
  docsToolbarPresets,
  type ToolbarConfiguration,
} from '../composition-settings';
import { elementOf, focusAfterRemoval } from '../scene-focus';

const props = withDefaults(
  defineProps<LabModuleProps & { configuration?: Readonly<ToolbarConfiguration> }>(),
  { configuration: () => docsToolbarPresets[0].props },
);
const mode = defineModel<DocsToolbarMode>({ default: docsToolbarPresets[0].state.mode });
const copyLink = ref<{ $el?: unknown } | null>(null);
const fallback = ref<{ $el?: unknown } | null>(null);
// Hiding can unmount the control that owns focus when an activation does not
// move focus itself, such as a platform-level click or assistant action.
watch(
  () => props.configuration.showActions,
  (showActions) => {
    if (showActions) return;
    focusAfterRemoval(elementOf(copyLink.value), elementOf(fallback.value), document.activeElement);
  },
  { flush: 'pre' },
);
const copy = moduleCopy.composition.scenes.docsToolbar;
const options = computed(() =>
  docsToolbarMode.options.map(({ value, label }) => ({
    value,
    label: localize(label, props.locale),
  })),
);

function selectMode(value: string): void {
  const choice = docsToolbarMode.options.find((option) => option.value === value);
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
      <div class="min-w-0">
        <p class="text-label font-label text-primary">
          {{ localize(copy.workspace, props.locale) }}
        </p>
        <p class="mt-1 text-caption text-muted">
          {{ localize(copy.saved, props.locale) }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UiSegmentedControl
          :model-value="mode"
          class="shrink-0"
          surface="none"
          :aria-label="localize(copy.modesLabel, props.locale)"
          :options="options"
          @update:model-value="selectMode"
        />
        <UiButton
          v-if="props.configuration.showActions"
          ref="copyLink"
          variant="secondary"
          size="sm"
          data-specimen-extra-actions
        >
          {{ localize(copy.copyLink, props.locale) }}
        </UiButton>
        <UiIconButton
          ref="fallback"
          variant="ghost"
          size="sm"
          :label="localize(copy.more, props.locale)"
        >
          <LabIcon name="menu" />
        </UiIconButton>
      </div>
    </div>
  </UiSurface>
</template>
