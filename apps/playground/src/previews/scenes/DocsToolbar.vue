<script setup lang="ts">
import type { SegmentOption } from '@neoverse-ui/vue';
import { UiButton, UiIconButton, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import LabIcon from '../../LabIcon.vue';
import type { LabModuleProps } from '../../modules/types';
import { localize, moduleCopy } from '../../playground-content';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.composition;
const docsToolbarMode = ref('read');

const docsToolbarOptions = computed<readonly SegmentOption[]>(() => [
  {
    value: 'read',
    label: localize(copy.scenes.docsToolbar.modes.read, props.locale),
  },
  {
    value: 'edit',
    label: localize(copy.scenes.docsToolbar.modes.edit, props.locale),
  },
  {
    value: 'preview',
    label: localize(copy.scenes.docsToolbar.modes.preview, props.locale),
  },
]);
</script>

<template>
  <UiSurface
    surface="glass-subtle"
    class="rounded-card p-4"
    data-composition-surface
    role="toolbar"
    :aria-label="localize(copy.scenes.docsToolbar.modesLabel, props.locale)"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-label font-label text-primary">
          {{ localize(copy.scenes.docsToolbar.workspace, props.locale) }}
        </p>
        <p class="mt-1 text-caption text-muted">
          {{ localize(copy.scenes.docsToolbar.saved, props.locale) }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UiSegmentedControl
          v-model="docsToolbarMode"
          class="shrink-0"
          :aria-label="localize(copy.scenes.docsToolbar.modesLabel, props.locale)"
          :options="docsToolbarOptions"
        />
        <UiButton variant="secondary" size="sm">
          {{ localize(copy.scenes.docsToolbar.copyLink, props.locale) }}
        </UiButton>
        <UiIconButton
          variant="ghost"
          size="sm"
          :label="localize(copy.scenes.docsToolbar.more, props.locale)"
        >
          <LabIcon name="menu" />
        </UiIconButton>
      </div>
    </div>
  </UiSurface>
</template>
