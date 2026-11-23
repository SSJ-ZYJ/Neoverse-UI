<script setup lang="ts">
import {
  UiControlSurface,
  UiNavigationItem,
  UiSurface,
  useLayoutWidthMotion,
} from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import type { LabModuleProps } from '../modules/types';
import { localize, moduleCopy } from '../playground-content';

const props = defineProps<LabModuleProps>();
const widthCopy = moduleCopy.motion.width;

// The specimen mirrors the portal header: the lab language is the trigger, so switching it
// resizes every box at once. Nothing is stored locally — the composable samples the visible
// widths before the copy swaps and animates them to their natural widths afterwards.
const widthStage = ref<HTMLElement | null>(null);
// biome-ignore lint/correctness/useHookAtTopLevel: Vue composables belong at <script setup> top level; the playground's React dependency makes Biome apply React hook rules here.
useLayoutWidthMotion({
  root: widthStage,
  targets: '[data-motion-width-target]',
  trigger: () => props.locale,
});
const widthNavItems = computed(() => [
  { id: 'overview', label: localize(widthCopy.navOverview, props.locale) },
  { id: 'motion', label: localize(widthCopy.navMotion, props.locale) },
  { id: 'components', label: localize(widthCopy.navComponents, props.locale) },
]);
</script>

<template>
  <UiSurface surface="none" class="playground-specimen-panel grid gap-3">
    <div
      ref="widthStage"
      data-motion-width-stage
      class="flex flex-col items-center gap-3 md:flex-row md:flex-wrap md:justify-center"
    >
      <div
        data-motion-width-target
        class="grid content-center gap-0.5 rounded-control border border-subtle px-3 py-1.5"
      >
        <p class="text-label font-label text-primary">
          {{ localize(widthCopy.brand, props.locale) }}
        </p>
        <p class="text-caption text-secondary">
          {{ localize(widthCopy.brandSubtitle, props.locale) }}
        </p>
      </div>
      <UiControlSurface
        surface="none"
        data-motion-width-target
        class="rounded-control border border-subtle"
      >
        <UiNavigationItem
          v-for="(item, index) in widthNavItems"
          :key="item.id"
          as="span"
          size="sm"
          :label="item.label"
          :active="index === 0"
        />
      </UiControlSurface>
      <div
        data-motion-width-target
        class="grid content-center gap-0.5 rounded-control border border-subtle px-3 py-1.5"
      >
        <p class="text-caption text-secondary">
          {{ localize(widthCopy.preferenceLabel, props.locale) }}
        </p>
        <p class="text-label font-label text-primary">
          {{ localize(widthCopy.preferenceValue, props.locale) }}
        </p>
      </div>
    </div>
    <p class="text-caption text-secondary">{{ localize(widthCopy.hint, props.locale) }}</p>
  </UiSurface>
</template>
