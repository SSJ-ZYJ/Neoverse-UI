<script setup lang="ts">
import {
  startViewTransition,
  supportsParticleCapture,
  supportsParticleDissolve,
} from '@neoverse-ui/motion';
import { UiButton, UiSegmentedControl, UiSurface } from '@neoverse-ui/vue';
import { type Component, computed, ref } from 'vue';
import type { LabModuleProps } from '../modules/types';
import { localize, moduleCopy } from '../playground-content';
import { MotionPreviewFrame } from './motion-preview-frame';

const props = defineProps<LabModuleProps & { frame?: Component }>();
const pageCopy = moduleCopy.motion.page;

const webglAvailable = supportsParticleDissolve();
const captureAvailable = supportsParticleCapture();
const pipelineOptions = computed(() => [
  { value: 'auto', label: localize(pageCopy.pipelineLabel.auto, props.locale) },
  { value: 'capture', label: localize(pageCopy.pipelineLabel.capture, props.locale) },
  { value: 'synthetic', label: localize(pageCopy.pipelineLabel.synthetic, props.locale) },
  { value: 'crossfade', label: localize(pageCopy.pipelineLabel.crossfade, props.locale) },
]);
type PipelinePreference = 'auto' | 'capture' | 'synthetic' | 'crossfade';
const pipelinePreference = ref<PipelinePreference>('auto');
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
const dissolveStage = ref<HTMLElement | null>(null);
const dissolveBusy = ref(false);

async function replayDissolve(): Promise<void> {
  if (dissolveBusy.value) return;
  dissolveBusy.value = true;
  try {
    await startViewTransition(
      () => {
        dissolveDemo.value = dissolveDemo.value === 'alpha' ? 'beta' : 'alpha';
      },
      {
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
    <template #action>
      <UiButton
        data-motion-page-dissolve
        size="sm"
        variant="secondary"
        :disabled="dissolveBusy"
        @click="replayDissolve"
      >
        {{ localize(pageCopy.replay, props.locale) }}
      </UiButton>
    </template>

    <UiSurface surface="none" class="playground-specimen-panel grid gap-3">
      <!-- Stable header grid: the label owns a fixed one-line slot (it
           truncates instead of wrapping) and the control keeps its own
           column, so switching pipelines never reflows the stage below. -->
      <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <p
          class="min-h-5 min-w-0 self-center truncate text-caption text-secondary"
          :title="resolvedPipelineLabel"
        >
          {{ localize(pageCopy.pipeline, props.locale) }}: {{ resolvedPipelineLabel }}
        </p>
        <UiSegmentedControl
          class="justify-self-start md:justify-self-end"
          :aria-label="localize(pageCopy.pipeline, props.locale)"
          :options="pipelineOptions"
          :model-value="pipelinePreference"
          size="sm"
          surface="glass-subtle"
          @update:model-value="setPipeline"
        />
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
          <p class="text-body-sm text-secondary">startViewTransition(update, { dissolveSource })</p>
        </div>
        <div v-else data-neoverse-dissolve="" class="grid gap-1 p-4 text-center">
          <p class="text-title-sm font-title text-accent-primary">
            {{ localize(pageCopy.panelBeta, props.locale) }}
          </p>
          <p class="text-body-sm text-secondary">startViewTransition(update, { particle })</p>
        </div>
      </div>
    </UiSurface>
  </component>
</template>
