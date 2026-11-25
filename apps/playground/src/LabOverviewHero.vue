<script setup lang="ts">
import { glassMaterial } from '@neoverse-ui/tokens';
import { UiButton, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { computed } from 'vue';
import type { SpecimenId } from './lab-modules';
import { appCopy, type Locale, localize, localized } from './playground-content';
import { type ShowcaseSurface, showcaseSurfaces } from './showcase-surface';

const props = defineProps<{
  locale: Locale;
  surface: ShowcaseSurface;
  summary: string;
}>();

const emit = defineEmits<{
  navigate: [specimen: SpecimenId];
  surface: [value: string];
}>();

const copy = {
  caption: localized('Live specimen', '实时示例'),
  detail: localized(
    'Switch material tiers to compare the same surface on this backdrop.',
    '切换材质层级，在同一背景上对比表面效果。',
  ),
  surfaceLabel: localized('Preview material', '预览材质'),
  components: localized('Components', '查看组件'),
  materials: localized('Materials', '浏览材质'),
} as const;

const showcaseOptions = computed(() =>
  showcaseSurfaces.map((value) => ({
    value,
    label: localize(
      value === 'glass-subtle' ? glassMaterial.tiers.subtle : glassMaterial.tiers.elevated,
      props.locale,
    ),
  })),
);
</script>

<template>
  <section data-overview-hero aria-labelledby="stage-title" class="playground-overview-hero">
    <header class="playground-stage__heading playground-overview-hero__intro">
      <p class="text-label-sm font-label text-secondary">
        {{ localize(appCopy.overview.eyebrow, locale) }}
      </p>
      <h2
        id="stage-title"
        tabindex="-1"
        data-stage-heading
        class="text-primary font-heading tracking-heading"
      >
        {{ localize(appCopy.overview.title, locale) }}
      </h2>
      <p class="max-w-reading text-body-lg text-secondary">
        {{ localize(appCopy.overview.description, locale) }}
      </p>
      <p class="text-caption tabular-nums text-secondary">
        {{ summary }}
      </p>
    </header>

    <div class="playground-overview-hero__stage">
      <p class="text-label-sm font-label text-secondary">
        {{ localize(copy.caption, locale) }}
      </p>
      <UiSurface
        :surface="props.surface"
        data-neoverse-surface-hover="static"
        content-overflow="visible"
        class="playground-overview-hero__sample grid gap-4 rounded-card p-5"
      >
        <div class="grid gap-1">
          <h3 class="text-title-sm font-title text-primary">
            {{ localize(glassMaterial.name, locale) }}
          </h3>
          <p class="text-body-sm text-secondary">{{ localize(copy.detail, locale) }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UiButton size="sm" @click="emit('navigate', 'controls-button')">
            {{ localize(copy.components, locale) }}
          </UiButton>
          <UiButton
            size="sm"
            variant="ghost"
            surface="none"
            @click="emit('navigate', 'materials-surface')"
          >
            {{ localize(copy.materials, locale) }}
          </UiButton>
        </div>
      </UiSurface>
      <UiSegmentedControl
        :aria-label="localize(copy.surfaceLabel, locale)"
        :model-value="props.surface"
        :options="showcaseOptions"
        surface="glass-subtle"
        @update:model-value="emit('surface', $event)"
      />
    </div>
  </section>
</template>
