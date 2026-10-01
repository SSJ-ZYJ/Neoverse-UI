<script setup lang="ts">
import type { SegmentOption } from '@neoverse-ui/vue';
import { UiBadge, UiButton, UiCard, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.composition.previewModes.accessibility;
const mode = ref('summary');

const options = computed<readonly SegmentOption[]>(() => [
  { value: 'summary', label: localize(copy.summary, props.locale) },
  { value: 'details', label: localize(copy.details, props.locale) },
]);
</script>

<template>
  <MaterialBackdrop>
    <div
      class="playground-reduced-transparency-preview grid gap-grid md:grid-cols-2"
      data-composition-mode="accessibility"
    >
      <UiCard class="grid gap-3" data-accessibility-surface>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="grid gap-1">
            <p class="text-label-lg font-label text-primary">
              {{ localize(copy.cardTitle, props.locale) }}
            </p>
            <p class="text-body-sm text-secondary">
              {{ localize(copy.cardBody, props.locale) }}
            </p>
          </div>
          <UiBadge variant="warning">
            {{ localize(copy.fallbackBadge, props.locale) }}
          </UiBadge>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-caption text-muted">glass-card → fallback</span>
          <UiButton variant="secondary" size="sm">
            {{ localize(copy.continue, props.locale) }}
          </UiButton>
        </div>
      </UiCard>

      <UiSurface
        surface="glass-immersive"
        class="grid gap-3 rounded-card p-4"
        data-accessibility-surface
        role="toolbar"
        :aria-label="localize(copy.toolbarTitle, props.locale)"
      >
        <div class="grid gap-1">
          <p class="text-label-lg font-label text-primary">
            {{ localize(copy.toolbarTitle, props.locale) }}
          </p>
          <p class="text-body-sm text-secondary">
            {{ localize(copy.toolbarBody, props.locale) }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UiSegmentedControl
            v-model="mode"
            surface="glass-subtle"
            :aria-label="localize(copy.toolbarTitle, props.locale)"
            :options="options"
          />
          <UiButton size="sm">{{ localize(copy.apply, props.locale) }}</UiButton>
        </div>
      </UiSurface>
    </div>
  </MaterialBackdrop>
</template>
