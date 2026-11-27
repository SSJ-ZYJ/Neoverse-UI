<script setup lang="ts">
import type { Material } from '@neoverse-ui/tokens';
import type { BadgeVariant, SegmentOption } from '@neoverse-ui/vue';
import { UiBadge, UiButton, UiCard, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import { localize, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import { comparisonMaterials, materialNames } from '../../runtime/preference-segments';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.composition.previewModes.accessibility;
const mode = ref('summary');

const options = computed<readonly SegmentOption[]>(() => [
  { value: 'summary', label: localize(copy.summary, props.locale) },
  { value: 'details', label: localize(copy.details, props.locale) },
]);

const badgeTone: Record<Material, BadgeVariant> = {
  solid: 'success',
  frosted: 'info',
  glass: 'warning',
};
</script>

<template>
  <div
    class="playground-reduced-transparency-preview grid gap-grid"
    data-composition-mode="accessibility"
  >
    <div class="grid gap-grid md:grid-cols-3">
      <div
        v-for="material in comparisonMaterials"
        :key="material"
        :data-neoverse-material="material"
        class="grid"
      >
        <UiCard class="grid gap-3" :data-accessibility-surface="material">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="grid gap-1">
              <p class="text-label-lg font-label text-primary">
                {{ localize(materialNames[material], props.locale) }}
              </p>
              <p class="text-body-sm text-secondary">
                {{ localize(copy.cardBody, props.locale) }}
              </p>
            </div>
            <UiBadge :variant="badgeTone[material]">
              {{ localize(copy.fallbackBadge, props.locale) }}
            </UiBadge>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-caption text-muted">{{ material }}</span>
            <UiButton :variant="material === 'frosted' ? 'primary' : 'secondary'" size="sm">
              {{ localize(material === 'frosted' ? copy.apply : copy.continue, props.locale) }}
            </UiButton>
          </div>
        </UiCard>
      </div>
    </div>

    <div data-neoverse-material="glass">
      <UiSurface
        surface="glass-immersive"
        class="grid gap-3 rounded-card p-4"
        data-accessibility-surface="glass-immersive"
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
  </div>
</template>
