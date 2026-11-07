<script setup lang="ts">
import {
  presenceVariants,
  startViewTransition,
  supportsParticleCapture,
  supportsParticleDissolve,
} from '@neoverse-ui/motion';
import { glassMaterial } from '@neoverse-ui/tokens';
import {
  presence,
  staggerStyle,
  UiBadge,
  UiButton,
  UiControlSurface,
  UiNavigationItem,
  UiPresence,
  UiSegmentedControl,
  UiSurface,
  useLayoutWidthMotion,
} from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { motionBaseGroups } from '../lab-data';
import { localize, localized, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const presenceCopy = moduleCopy.motion.presence;
const widthCopy = moduleCopy.motion.width;
const pageCopy = moduleCopy.motion.page;
const presenceOn = ref(true);
const presenceSpecimens = ['Neoverse', 'Motion', 'Presence', glassMaterial.name, 'Edge to Edge'];
const staggerOrder = ref(presenceSpecimens.map((label, index) => ({ label, seed: index })));
const staggerReplay = ref(0);

// The specimen mirrors the portal header: the lab language is the trigger, so switching it
// resizes every box at once. Nothing is stored locally — the composable samples the visible
// widths before the copy swaps and animates them to their natural widths afterwards.
// 示例对应门户页头：以实验室语言作为触发值，切换时整组盒子一起改变尺寸。这里不保存本地状态——
// 组合式函数在文案替换前采样可见宽度，替换后播放到自然宽度。
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
  const [first, ...rest] = staggerOrder.value;
  if (first) staggerOrder.value = [...rest, first];
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
        <div class="flex flex-wrap gap-2">
          <UiButton
            data-motion-presence-replay
            size="sm"
            variant="secondary"
            @click="staggerReplay += 1"
          >
            {{ localize(presenceCopy.replayEntries, props.locale) }}
          </UiButton>
          <UiButton
            data-motion-presence-shuffle
            size="sm"
            variant="secondary"
            @click="shuffleStagger"
          >
            {{ localize(presenceCopy.shuffle, props.locale) }}
          </UiButton>
        </div>
      </template>

      <UiSurface surface="glass-subtle" class="playground-specimen-panel">
        <TransitionGroup
          :key="staggerReplay"
          appear
          name="nv"
          tag="div"
          class="flex flex-wrap gap-2"
          data-motion-presence-group
        >
          <UiBadge
            size="md"
            v-for="(item, index) in staggerOrder"
            :key="item.seed"
            v-bind="presence('rise')"
            data-motion-presence-group-item
            :style="staggerStyle(index)"
          >
            {{ typeof item.label === 'string' ? item.label : localize(item.label, props.locale) }}
          </UiBadge>
        </TransitionGroup>
      </UiSurface>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="foundation-motion-width"
      :title="localize(widthCopy.label, props.locale)"
      :description="localize(widthCopy.description, props.locale)"
    >
      <UiSurface surface="glass-subtle" class="playground-specimen-panel grid gap-3">
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
