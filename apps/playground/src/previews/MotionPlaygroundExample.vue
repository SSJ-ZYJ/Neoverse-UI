<script setup lang="ts">
import {
  type ButtonSize,
  UiButton,
  UiIconButton,
  UiSegmentedControl,
  UiSurface,
} from '@neoverse-ui/vue';
import { computed, inject, ref } from 'vue';
import LabIcon from '../LabIcon.vue';
import LabSpecimenHeader from '../LabSpecimenHeader.vue';
import { sizeLabel, sizeOptions } from '../lab-specimens/shared';
import type { LabModuleProps } from '../modules/types';
import { appearanceControls } from '../playground-appearance';
import { localize } from '../playground-content';
import { resolveRequestedTheme } from '../theme-runtime';
import { motionPlaygroundCopy as copy } from './motion-playground-copy';

const props = defineProps<LabModuleProps>();
const appearance = inject(appearanceControls);
if (!appearance) throw new Error('The Motion specimen requires Playground appearance controls.');
const { setTheme, setLocale } = appearance;

const size = ref<ButtonSize>('sm');
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
  <div class="grid min-w-0 gap-3">
    <UiSurface surface="none" class="playground-specimen-panel grid gap-3">
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
    <UiSurface surface="none" class="playground-specimen-panel grid gap-3">
      <LabSpecimenHeader
        :title="localize(copy.locale.label, locale)"
        :description="localize(copy.locale.description, locale)"
      />
      <UiButton
        data-motion-locale
        class="justify-self-start"
        size="sm"
        @click="setLocale(locale === 'zh' ? 'en' : 'zh')"
      >
        {{ localize(copy.locale.action, locale) }}
      </UiButton>
    </UiSurface>
    <UiSurface surface="none" class="playground-specimen-panel grid gap-3">
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
