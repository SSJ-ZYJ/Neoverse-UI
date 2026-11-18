<script setup lang="ts">
import { glassMaterial } from '@neoverse-ui/tokens';
import { UiButton, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import {
  type LabModule,
  type LabSpecimen,
  labModules,
  labSpecimens,
  type ModuleId,
  type SpecimenId,
} from './lab-modules';
import type { SpecimenSession } from './lab-specimen-config';
import { provideSpecimenSelection } from './lab-specimen-scope';
import {
  appCopy,
  formatLocalized,
  type Locale,
  type LocalizedText,
  localize,
  localized,
} from './playground-content';

const props = defineProps<{
  locale: Locale;
  module: LabModule | undefined;
  category: LocalizedText | undefined;
  specimen: LabSpecimen | undefined;
  session: SpecimenSession | undefined;
}>();
const emit = defineEmits<{ navigate: [module: ModuleId | SpecimenId] }>();
const LiveSpecimen = () => props.session?.render(props.locale);
provideSpecimenSelection(computed(() => props.specimen?.id));

const copy = {
  label: localized('Preview Stage', '预览舞台'),
  summary: localized(
    '{modules} modules · {specimens} specimens',
    '{modules} 个模块 · {specimens} 个示例',
  ),
  caption: localized('Live specimen', '实时示例'),
  detail: localized(
    'Switch material tiers to compare the same surface on this backdrop.',
    '切换材质层级，在同一背景上对比表面效果。',
  ),
  surfaceLabel: localized('Preview material', '预览材质'),
  components: localized('Components', '查看组件'),
  materials: localized('Materials', '浏览材质'),
} as const;
const showcaseSurface = ref<'glass-subtle' | 'glass-elevated'>('glass-subtle');
const showcaseOptions = computed(() => [
  { value: 'glass-subtle', label: localize(glassMaterial.tiers.subtle, props.locale) },
  { value: 'glass-elevated', label: localize(glassMaterial.tiers.elevated, props.locale) },
]);

function setShowcaseSurface(value: string): void {
  if (value === 'glass-subtle' || value === 'glass-elevated') showcaseSurface.value = value;
}
</script>

<template>
  <div
    data-playground-page
    class="playground-stage"
    :data-specimen-kind="specimen?.kind"
    :class="{ 'playground-stage--focused': specimen }"
  >
    <p class="playground-stage__label text-label-sm font-label text-secondary">
      <span aria-hidden="true" />
      {{ localize(copy.label, locale) }}
    </p>

    <section
      v-if="session && specimen"
      :id="specimen.id"
      :key="specimen.id"
      tabindex="-1"
      aria-labelledby="stage-title"
      data-design-lab-region="specimen"
      class="playground-stage__specimen"
    >
      <header class="playground-stage__heading">
        <p v-if="module" class="text-label-sm font-label text-secondary">
          {{ localize(module.label, locale) }}
        </p>
        <h2 id="stage-title" class="text-heading font-heading tracking-heading text-primary">
          {{ localize(specimen.label, locale) }}
        </h2>
      </header>
      <div class="playground-stage__specimen-content">
        <LiveSpecimen />
      </div>
    </section>

    <section
      v-else-if="specimen && module"
      :key="specimen.id"
      aria-labelledby="stage-title"
      class="playground-stage__specimen"
    >
      <header class="playground-stage__heading">
        <p class="text-label-sm font-label text-secondary">
          {{ localize(module.label, locale) }}
        </p>
        <h2
          id="stage-title"
          tabindex="-1"
          data-stage-heading
          class="text-heading font-heading tracking-heading text-primary"
        >
          {{ localize(specimen.label, locale) }}
        </h2>
      </header>
      <div
        data-design-lab-region="specimen"
        class="playground-stage__specimen-content playground-stage__legacy-content"
      >
        <component :is="module.component" :key="specimen.id" :locale="locale" />
      </div>
    </section>

    <section v-else-if="module" aria-labelledby="stage-title" class="playground-stage__specimen">
      <header :key="module.id" class="playground-stage__heading">
        <p v-if="category" class="text-label-sm font-label text-secondary">
          {{ localize(category, locale) }}
        </p>
        <h2
          id="stage-title"
          tabindex="-1"
          data-stage-heading
          class="text-heading font-heading tracking-heading text-primary"
        >
          {{ localize(module.label, locale) }}
        </h2>
        <p class="max-w-reading text-body-lg text-secondary">
          {{ localize(module.description, locale) }}
        </p>
      </header>
      <div data-design-lab-region="module" class="grid min-w-0 gap-grid">
        <component :is="module.component" :key="module.id" :locale="locale" />
      </div>
    </section>

    <section
      v-else
      data-overview-hero
      aria-labelledby="stage-title"
      class="playground-overview-hero"
    >
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
          {{
            formatLocalized(copy.summary, locale, {
              modules: labModules.length,
              specimens: labSpecimens.length,
            })
          }}
        </p>
      </header>

      <div class="playground-overview-hero__stage">
        <p class="text-label-sm font-label text-secondary">
          {{ localize(copy.caption, locale) }}
        </p>
        <UiSurface
          :surface="showcaseSurface"
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
          :model-value="showcaseSurface"
          :options="showcaseOptions"
          surface="glass-subtle"
          @update:model-value="setShowcaseSurface"
        />
      </div>
    </section>
  </div>
</template>
