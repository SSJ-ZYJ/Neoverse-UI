<script setup lang="ts">
import {
  type PageTransitionDirection,
  type PageTransitionVariant,
  startViewTransition,
  supportsParticleCapture,
  supportsParticleDissolve,
} from '@neoverse-ui/motion';
import { UiButton, UiSegmentedControl, UiSurface, useLayoutWidthMotion } from '@neoverse-ui/vue';
import { type Component, computed, ref, watch } from 'vue';
import LabSpecimenHeader from '../LabSpecimenHeader.vue';
import type { LabModuleProps } from '../modules/types';
import { localize, moduleCopy } from '../playground-content';
import MotionPagePresets from './MotionPagePresets.vue';
import { motionPageCopy } from './motion-page-copy';
import { MotionPreviewFrame } from './motion-preview-frame';

type PipelinePreference = 'auto' | 'capture' | 'synthetic' | 'crossfade';
type StandardVariant = Exclude<PageTransitionVariant, 'dissolve'>;

const props = withDefaults(
  defineProps<
    LabModuleProps & {
      frame?: Component;
      category?: 'all' | 'standard' | 'dissolve';
      variant?: StandardVariant;
      direction?: PageTransitionDirection;
      transitionScope?: 'region' | 'document';
      background?: 'shared' | 'surface';
      pipeline?: PipelinePreference;
      inlineControls?: boolean;
    }
  >(),
  {
    category: 'all',
    variant: 'glide',
    direction: 'forward',
    transitionScope: 'region',
    background: 'shared',
    pipeline: 'auto',
    inlineControls: true,
  },
);
const pageCopy = moduleCopy.motion.page;
const dissolveCopy = motionPageCopy.dissolve;

const webglAvailable = supportsParticleDissolve();
const captureAvailable = supportsParticleCapture();
const pipelineOptions = computed(() => [
  { value: 'auto', label: localize(pageCopy.pipelineLabel.auto, props.locale) },
  { value: 'capture', label: localize(pageCopy.pipelineLabel.capture, props.locale) },
  { value: 'synthetic', label: localize(pageCopy.pipelineLabel.synthetic, props.locale) },
  { value: 'crossfade', label: localize(pageCopy.pipelineLabel.crossfade, props.locale) },
]);
const pipelinePreference = ref<PipelinePreference>(props.pipeline);
watch(
  () => props.pipeline,
  (next) => {
    if (next !== pipelinePreference.value) {
      pipelinePreference.value = next;
    }
  },
);
const resolvedPipelineLabel = computed(() => {
  const preference = pipelinePreference.value;
  if (preference === 'crossfade') return localize(pageCopy.pipelineCrossfadeFallback, props.locale);
  if (preference === 'synthetic') return localize(pageCopy.pipelineWebglSynthetic, props.locale);
  if (preference === 'capture') {
    return captureAvailable
      ? localize(pageCopy.pipelineWebgl, props.locale)
      : localize(pageCopy.pipelineCrossfadeFallback, props.locale);
  }
  if (!webglAvailable) return localize(pageCopy.pipelineCrossfadeFallback, props.locale);
  return captureAvailable
    ? localize(pageCopy.pipelineWebgl, props.locale)
    : localize(pageCopy.pipelineWebglSynthetic, props.locale);
});

function setPipeline(value: string): void {
  if (value === 'auto' || value === 'capture' || value === 'synthetic' || value === 'crossfade') {
    pipelinePreference.value = value;
  }
}

const dissolveDemo = ref<'alpha' | 'beta'>('alpha');
const dissolvePanel = ref<HTMLElement | null>(null);
const dissolveStage = ref<HTMLElement | null>(null);
const dissolveBusy = ref(false);

// biome-ignore lint/correctness/useHookAtTopLevel: Vue composables belong at <script setup> top level; the playground's React dependency makes Biome apply React hook rules here.
useLayoutWidthMotion({
  root: dissolvePanel,
  targets: '[data-motion-page-width]',
  trigger: () => props.locale,
});

async function replayDissolve(): Promise<void> {
  if (dissolveBusy.value) return;
  dissolveBusy.value = true;
  try {
    await startViewTransition(
      () => {
        dissolveDemo.value = dissolveDemo.value === 'alpha' ? 'beta' : 'alpha';
      },
      {
        variant: 'dissolve',
        dissolveSource: dissolveStage.value,
        particle: pipelinePreference.value === 'auto' ? true : pipelinePreference.value,
      },
    );
  } finally {
    dissolveBusy.value = false;
  }
}
</script>

<template>
  <component :is="props.frame ?? MotionPreviewFrame">
    <div class="grid min-w-0 gap-4">
      <MotionPagePresets
        v-if="props.category !== 'dissolve'"
        :locale="props.locale"
        :variant="props.variant"
        :direction="props.direction"
        :transition-scope="props.transitionScope"
        :background="props.background"
        :inline-controls="props.inlineControls"
      />

      <UiSurface
        v-if="props.category !== 'standard'"
        surface="none"
        class="playground-specimen-panel grid gap-3"
      >
        <div ref="dissolvePanel" class="grid gap-3">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <LabSpecimenHeader
              :title="localize(dissolveCopy.label, props.locale)"
              :description="localize(dissolveCopy.description, props.locale)"
            />
            <UiButton
              data-motion-page-dissolve
              data-motion-page-width
              size="sm"
              variant="secondary"
              :disabled="dissolveBusy"
              @click="replayDissolve"
            >
              {{ localize(pageCopy.replay, props.locale) }}
            </UiButton>
          </div>

          <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <p
              class="min-h-5 min-w-0 self-center truncate text-caption text-secondary"
              :title="resolvedPipelineLabel"
            >
              {{ localize(pageCopy.pipeline, props.locale) }}: {{ resolvedPipelineLabel }}
            </p>
            <UiSegmentedControl
              v-if="props.inlineControls"
              data-motion-page-width
              class="justify-self-start md:justify-self-end"
              :aria-label="localize(pageCopy.pipeline, props.locale)"
              :options="pipelineOptions"
              :model-value="pipelinePreference"
              size="sm"
              surface="glass-subtle"
              @update:model-value="setPipeline"
            />
          </div>
        </div>

        <div ref="dissolveStage" class="playground-motion-stage">
          <div
            v-if="dissolveDemo === 'alpha'"
            data-neoverse-dissolve=""
            class="grid gap-1 p-4 text-center"
          >
            <p class="text-title-sm font-title text-primary">
              {{ localize(pageCopy.panelAlpha, props.locale) }}
            </p>
            <p class="text-body-sm text-secondary">
              startViewTransition(update, { dissolveSource })
            </p>
          </div>
          <div v-else data-neoverse-dissolve="" class="grid gap-1 p-4 text-center">
            <p class="text-title-sm font-title text-accent-primary">
              {{ localize(pageCopy.panelBeta, props.locale) }}
            </p>
            <p class="text-body-sm text-secondary">startViewTransition(update, { particle })</p>
          </div>
        </div>
      </UiSurface>
    </div>
  </component>
</template>
