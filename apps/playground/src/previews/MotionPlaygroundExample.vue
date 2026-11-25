<script setup lang="ts">
import {
  type ButtonSize,
  UiButton,
  UiControlSurface,
  UiIconButton,
  UiNavigationItem,
  UiSegmentedControl,
  UiSurface,
  useLayoutWidthMotion,
} from '@neoverse-ui/vue';
import { computed, inject, ref, watch } from 'vue';
import LabIcon from '../LabIcon.vue';
import LabSpecimenHeader from '../LabSpecimenHeader.vue';
import { sizeLabel, sizeOptions } from '../lab-specimens/shared';
import type { LabModuleProps } from '../modules/types';
import { appearanceControls } from '../playground-appearance';
import { localize } from '../playground-content';
import { resolveRequestedTheme } from '../theme-runtime';
import { motionPlaygroundCopy as copy } from './motion-playground-copy';

const props = withDefaults(
  defineProps<
    LabModuleProps & {
      category?: 'all' | 'theme' | 'width' | 'size';
      size?: ButtonSize;
      inlineControls?: boolean;
    }
  >(),
  {
    category: 'all',
    size: 'sm',
    inlineControls: true,
  },
);
const appearance = inject(appearanceControls);
if (!appearance) throw new Error('The Motion specimen requires Playground appearance controls.');
const { setTheme, setLocale } = appearance;

// The language switch drives both the shell crossfade and this width group: the composable
// samples the visible box widths before the copy swaps and animates them to the natural ones.
const widthStage = ref<HTMLElement | null>(null);
// biome-ignore lint/correctness/useHookAtTopLevel: Vue composables belong at <script setup> top level; the playground's React dependency makes Biome apply React hook rules here.
useLayoutWidthMotion({
  root: widthStage,
  targets: '[data-motion-width-target]',
  trigger: () => props.locale,
});
const widthNavItems = computed(() => [
  { id: 'overview', label: localize(copy.locale.navOverview, props.locale) },
  { id: 'motion', label: localize(copy.locale.navMotion, props.locale) },
  { id: 'components', label: localize(copy.locale.navComponents, props.locale) },
]);

const size = ref<ButtonSize>(props.size);
watch(
  () => props.size,
  (next) => {
    size.value = next;
  },
);
const sizes = computed(() =>
  sizeOptions.map(({ value, label }) => ({ value, label: localize(label, props.locale) })),
);

function selectSize(value: string): void {
  const option = sizeOptions.find((option) => option.value === value);
  if (option) size.value = option.value;
}

function toggleTheme(event?: MouseEvent): void {
  const target = event?.currentTarget;
  setTheme(
    resolveRequestedTheme() === 'dark' ? 'light' : 'dark',
    target instanceof Element ? target : undefined,
  );
}
</script>

<template>
  <div class="grid w-full min-w-0 max-w-reading-wide gap-3">
    <UiSurface
      v-if="props.category === 'all' || props.category === 'theme'"
      surface="none"
      class="playground-specimen-panel grid gap-3"
    >
      <LabSpecimenHeader
        :title="localize(copy.theme.label, locale)"
        :description="localize(copy.theme.description, locale)"
      />
      <div class="flex flex-wrap items-center gap-2">
        <UiButton data-motion-theme-reveal size="sm" @click="toggleTheme($event)">
          {{ localize(copy.theme.reveal, locale) }}
        </UiButton>
        <UiButton data-motion-theme-fade size="sm" variant="secondary" @click="toggleTheme()">
          {{ localize(copy.theme.fade, locale) }}
        </UiButton>
      </div>
    </UiSurface>
    <UiSurface
      v-if="props.category === 'all' || props.category === 'width'"
      surface="none"
      class="playground-specimen-panel grid gap-3"
    >
      <LabSpecimenHeader
        :title="localize(copy.locale.label, locale)"
        :description="localize(copy.locale.description, locale)"
      />
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
            {{ localize(copy.locale.brand, locale) }}
          </p>
          <p class="text-caption text-secondary">
            {{ localize(copy.locale.brandSubtitle, locale) }}
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
            {{ localize(copy.locale.preferenceLabel, locale) }}
          </p>
          <p class="text-label font-label text-primary">
            {{ localize(copy.locale.preferenceValue, locale) }}
          </p>
        </div>
      </div>
      <UiButton
        data-motion-locale
        class="justify-self-start"
        size="sm"
        @click="setLocale(locale === 'zh' ? 'en' : 'zh')"
      >
        {{ localize(copy.locale.action, locale) }}
      </UiButton>
      <p class="text-caption text-secondary">{{ localize(copy.locale.hint, locale) }}</p>
    </UiSurface>
    <UiSurface
      v-if="props.category === 'all' || props.category === 'size'"
      surface="none"
      class="playground-specimen-panel grid gap-3"
    >
      <LabSpecimenHeader
        :title="localize(copy.size.label, locale)"
        :description="localize(copy.size.description, locale)"
      />
      <UiSegmentedControl
        data-motion-size-control
        class="justify-self-start"
        :aria-label="localize(sizeLabel, locale)"
        :model-value="size"
        :options="sizes"
        @update:model-value="selectSize"
      />
      <div class="flex flex-wrap items-center gap-2">
        <UiButton data-motion-size-sample="text" :size="size">
          {{ localize(copy.size.sample, locale) }}
        </UiButton>
        <UiIconButton
          data-motion-size-sample="icon"
          :size="size"
          :label="localize(copy.size.icon, locale)"
        >
          <LabIcon name="spark" />
        </UiIconButton>
      </div>
    </UiSurface>
  </div>
</template>
