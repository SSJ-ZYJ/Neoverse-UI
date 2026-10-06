<script setup lang="ts">
import {
  presenceVariants,
  startViewTransition,
  supportsParticleCapture,
  supportsParticleDissolve,
} from '@neoverse-ui/motion';
import {
  presence,
  staggerStyle,
  UiButton,
  UiPresence,
  UiSegmentedControl,
  UiSurface,
} from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { motionBaseGroups } from '../lab-data';
import { localize, localized, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const presenceCopy = moduleCopy.motion.presence;
const pageCopy = moduleCopy.motion.page;
const presenceOn = ref(true);
const presenceSpecimens = ['Neoverse', 'Motion', 'Presence', 'Glass', 'Edge to Edge'];
const staggerOrder = ref(presenceSpecimens.map((label, index) => ({ label, seed: index })));

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

function shuffleStagger(): void {
  const items = [...staggerOrder.value];
  for (let current = items.length - 1; current > 0; current -= 1) {
    const next = Math.floor(Math.random() * (current + 1));
    const held = items[current];
    const other = items[next];
    if (held === undefined || other === undefined) continue;
    items[current] = other;
    items[next] = held;
  }
  staggerOrder.value = items;
}

const motionBaseEntries = motionBaseGroups.map((group) => ({
  ...group,
  entries: Object.entries(group.values),
}));
const variantLabels = computed(() =>
  presenceVariants.map((variant) => ({
    variant,
    label: localized(variant, variant),
  })),
);
</script>

<template>
  <div id="foundation-motion" class="scroll-mt-24 grid gap-grid">
    <LabSpecimenSection
      id="motion-primitive"
      :title="localize(moduleCopy.motion.primitive.label, props.locale)"
      :description="localize(moduleCopy.motion.primitive.description, props.locale)"
    >
      <UiSurface surface="glass-subtle" class="playground-specimen-panel grid gap-3 md:grid-cols-3">
        <div v-for="group in motionBaseEntries" :key="group.label.en" class="grid gap-1">
          <h3 class="text-label font-label text-primary">
            {{ localize(group.label, props.locale) }}
          </h3>
          <code v-for="[ key, value ] in group.entries" :key="key" class="text-code text-secondary">
            {{ key }}: {{ value }}
          </code>
        </div>
      </UiSurface>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="foundation-motion-presence"
      :title="localize(presenceCopy.label, props.locale)"
      :description="localize(presenceCopy.description, props.locale)"
    >
      <template #action>
        <UiButton
          data-motion-presence-toggle
          size="sm"
          variant="secondary"
          @click="presenceOn = !presenceOn"
        >
          {{ presenceOn
              ? localize(presenceCopy.hide, props.locale)
              : localize(presenceCopy.visible, props.locale) }}
        </UiButton>
      </template>

      <UiSurface
        surface="glass-subtle"
        class="playground-specimen-panel grid gap-3 md:grid-cols-3 xl:grid-cols-4"
      >
        <div v-for="(variant, index) in variantLabels" :key="variant.variant" class="grid gap-2">
          <code class="text-code text-secondary">presence('{{ variant.variant }}')</code>
          <div class="playground-motion-stage">
            <Transition name="nv">
              <span
                v-if="presenceOn"
                v-bind="presence(variant.variant)"
                :data-motion-presence-specimen="variant.variant"
                :style="staggerStyle(index, { step: 60 })"
                class="rounded-pill bg-accent-soft px-3 py-1 text-label-sm text-accent-primary"
              >
                {{ localize(variant.label, props.locale) }}
              </span>
            </Transition>
          </div>
        </div>
        <div class="grid gap-2">
          <code class="text-code text-secondary">&lt;UiPresence show variant="veil"&gt;</code>
          <div class="playground-motion-stage">
            <UiPresence :show="presenceOn" variant="veil" data-motion-presence-adapter="vue">
              <span class="rounded-pill bg-accent-soft px-3 py-1 text-label-sm text-accent-primary">
                UiPresence
              </span>
            </UiPresence>
          </div>
        </div>
      </UiSurface>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="foundation-motion-presence-group"
      :title="localize(presenceCopy.stagger, props.locale)"
      :description="localize(presenceCopy.staggerDescription, props.locale)"
    >
      <template #action>
        <UiButton
          data-motion-presence-shuffle
          size="sm"
          variant="secondary"
          @click="shuffleStagger"
        >
          {{ localize(presenceCopy.shuffle, props.locale) }}
        </UiButton>
      </template>

      <UiSurface surface="glass-subtle" class="playground-specimen-panel">
        <TransitionGroup
          name="nv"
          tag="div"
          class="flex flex-wrap gap-2"
          data-motion-presence-group
        >
          <span
            v-for="(item, index) in staggerOrder"
            :key="item.seed"
            data-motion-presence-group-item
            :style="staggerStyle(index)"
            class="rounded-control bg-surface-raised px-3 py-1.5 text-label text-secondary"
          >
            {{ item.label }}
          </span>
        </TransitionGroup>
      </UiSurface>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="foundation-motion-page"
      :title="localize(pageCopy.label, props.locale)"
      :description="localize(pageCopy.description, props.locale)"
    >
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

      <UiSurface surface="glass-subtle" class="playground-specimen-panel grid gap-3">
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
    </LabSpecimenSection>
  </div>
</template>
