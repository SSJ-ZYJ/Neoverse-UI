<script setup lang="ts">
import { UiButton, UiIconButton, UiSegmentedControl } from '@neoverse-ui/vue';
import { computed } from 'vue';
import LabIcon from './LabIcon.vue';
import LabOverviewHero from './LabOverviewHero.vue';
import {
  type LabModule,
  type LabSpecimen,
  labModules,
  labSpecimens,
  type ModuleId,
  type SpecimenId,
} from './lab-modules';
import type { SpecimenSession } from './lab-specimen-config';
import {
  appCopy,
  catalogueSecondary,
  formatLocalized,
  type Locale,
  type LocalizedText,
  localize,
  localized,
} from './playground-content';
import type { ShowcaseSurface } from './showcase-surface';
import { type StageBackground, stageBackgrounds } from './stage-background';
import {
  createStageTransform,
  maxStageZoom,
  minStageZoom,
  stageZoomStepRatio,
  stageZoomTrackSteps,
} from './useStageTransform';

const props = defineProps<{
  locale: Locale;
  module: LabModule | undefined;
  category: LocalizedText | undefined;
  specimen: LabSpecimen | undefined;
  session: SpecimenSession | undefined;
  background: StageBackground;
  surface: ShowcaseSurface;
}>();
const emit = defineEmits<{
  navigate: [module: ModuleId | SpecimenId];
  background: [value: string];
  surface: [value: string];
}>();
const FocusedSpecimen = () => {
  const preview = props.specimen?.preview;
  return typeof preview === 'function'
    ? preview(props.locale)
    : props.session?.render(props.locale);
};

const copy = {
  label: localized('Preview Stage', '预览区'),
  summary: localized(
    '{modules} modules · {specimens} specimens',
    '{modules} 个模块 · {specimens} 个示例',
  ),
  move: localized('Move preview', '移动预览'),
  moveHint: localized(
    'Drag, or use the arrow keys. Press Home to recenter.',
    '拖拽或使用方向键移动，按 Home 复位。',
  ),
  zoomRange: localized('Preview zoom', '预览缩放'),
  zoomOut: localized('Zoom out preview', '缩小预览'),
  zoomIn: localized('Zoom in preview', '放大预览'),
  zoomReset: localized('Reset preview zoom', '恢复原始大小'),
  zoomStatus: localized('Preview zoom: {zoom}%', '预览缩放：{zoom}%'),
} as const;

const specimenSecondary = computed(() =>
  props.specimen === undefined ? undefined : catalogueSecondary(props.specimen.label, props.locale),
);
const moduleSecondary = computed(() =>
  props.module === undefined ? undefined : catalogueSecondary(props.module.label, props.locale),
);

const {
  dragging,
  zoom,
  zoomTrack,
  contentStyle,
  startDrag,
  startStageDrag,
  dragMove,
  endDrag,
  nudge,
  resetPosition,
  adjustZoom,
  updateZoom,
  zoomWithWheel,
  resetZoom,
} = createStageTransform(() => props.specimen?.id);

const backgroundOptions = computed(() =>
  stageBackgrounds.map((value) => ({
    value,
    label: localize(appCopy.stageBackground.options[value], props.locale),
  })),
);
const overviewSummary = computed(() =>
  formatLocalized(copy.summary, props.locale, {
    modules: labModules.length,
    specimens: labSpecimens.length,
  }),
);
</script>

<template>
  <div
    data-playground-page
    class="playground-stage"
    :class="{
      'playground-stage--focused': specimen,
      'playground-stage--composition': specimen?.kind === 'composition',
    }"
  >
    <div class="playground-stage__chrome">
      <div class="playground-stage__identity">
        <p class="playground-stage__label text-label-sm font-label text-secondary">
          <span aria-hidden="true" />
          {{ localize(copy.label, locale) }}
        </p>
        <button
          v-if="specimen"
          type="button"
          class="playground-stage__grip"
          data-stage-move-handle
          :aria-label="localize(copy.move, locale)"
          :title="localize(copy.moveHint, locale)"
          :data-dragging="dragging || undefined"
          @pointerdown="startDrag"
          @pointermove="dragMove"
          @pointerup="endDrag"
          @pointercancel="endDrag"
          @lostpointercapture="endDrag"
          @keydown="nudge"
          @dblclick="resetPosition"
        >
          <LabIcon name="move" />
        </button>
        <div v-if="specimen" class="playground-stage__zoom">
          <UiIconButton
            data-stage-zoom="out"
            size="sm"
            variant="ghost"
            surface="none"
            :label="localize(copy.zoomOut, locale)"
            :disabled="zoom <= minStageZoom"
            @click="adjustZoom(1 / stageZoomStepRatio)"
          >
            <LabIcon name="minus" />
          </UiIconButton>
          <input
            data-stage-zoom="range"
            class="playground-stage__zoom-range"
            type="range"
            min="0"
            :max="stageZoomTrackSteps"
            step="1"
            :value="zoomTrack"
            :aria-label="localize(copy.zoomRange, locale)"
            :aria-valuetext="`${Math.round(zoom)}%`"
            :style="{
              '--ui-zoom-fill': `${(zoomTrack / stageZoomTrackSteps) * 100}%`,
            }"
            @input="updateZoom"
          >
          <UiButton
            data-stage-zoom="reset"
            size="sm"
            variant="ghost"
            class="playground-stage__zoom-value"
            :aria-label="localize(copy.zoomReset, locale)"
            :title="localize(copy.zoomReset, locale)"
            @click="resetZoom"
          >
            {{ Math.round(zoom) }}%
          </UiButton>
          <UiIconButton
            data-stage-zoom="in"
            size="sm"
            variant="ghost"
            surface="none"
            :label="localize(copy.zoomIn, locale)"
            :disabled="zoom >= maxStageZoom"
            @click="adjustZoom(stageZoomStepRatio)"
          >
            <LabIcon name="plus" />
          </UiIconButton>
          <span class="sr-only" role="status">
            {{ formatLocalized(copy.zoomStatus, locale, { zoom: Math.round(zoom) }) }}
          </span>
        </div>
      </div>
      <UiSegmentedControl
        :aria-label="localize(appCopy.stageBackground.label, locale)"
        :model-value="props.background"
        :options="backgroundOptions"
        surface="glass-elevated"
        @update:model-value="emit('background', $event)"
      />
    </div>

    <section
      v-if="specimen"
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
        <h2
          id="stage-title"
          class="playground-stage__specimen-title text-heading font-heading tracking-heading text-primary"
        >
          {{ localize(specimen.label, locale) }}
          <span
            v-if="specimenSecondary"
            class="playground-stage__title-secondary"
            lang="en"
            aria-hidden="true"
          >
            {{ specimenSecondary }}
          </span>
        </h2>
      </header>
      <div
        class="playground-stage__specimen-content"
        :style="contentStyle"
        :data-dragging="dragging || undefined"
        @wheel.ctrl="zoomWithWheel"
        @pointerdown="startStageDrag"
        @pointermove="dragMove"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @lostpointercapture="endDrag"
      >
        <FocusedSpecimen />
      </div>
    </section>

    <section v-else-if="module" aria-labelledby="stage-title" class="playground-stage__module">
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
          <span
            v-if="moduleSecondary"
            class="playground-stage__title-secondary"
            lang="en"
            aria-hidden="true"
          >
            {{ moduleSecondary }}
          </span>
        </h2>
        <p class="max-w-reading text-body-lg text-secondary">
          {{ localize(module.description, locale) }}
        </p>
      </header>
      <div data-design-lab-region="module" class="grid min-w-0 gap-grid">
        <component :is="module.component" :key="module.id" :locale="locale" />
      </div>
    </section>

    <LabOverviewHero
      v-else
      :locale="locale"
      :surface="props.surface"
      :summary="overviewSummary"
      @navigate="emit('navigate', $event)"
      @surface="emit('surface', $event)"
    />
  </div>
</template>
