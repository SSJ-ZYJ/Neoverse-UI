<script setup lang="ts">
import {
  type PresenceFallback,
  type PresenceVariant,
  presenceFallbacks,
  presenceVariants,
} from '@neoverse-ui/motion';
import {
  presence,
  UiBadge,
  UiButton,
  UiIconButton,
  UiPresence,
  UiSegmentedControl,
  UiSurface,
} from '@neoverse-ui/vue';
import { type Component, computed, reactive, ref, watch } from 'vue';
import { formatLocalized, localize, localized, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabIcon from '../../features/workspace/LabIcon.vue';
import { MotionPreviewFrame } from './motion-preview-frame';

/** `full` keeps the engine's own geometry; the other two are declared profiles. */
type ProfileSelection = 'full' | PresenceFallback;

const props = withDefaults(
  defineProps<
    LabModuleProps & {
      frame?: Component;
      category?: 'all' | 'helper' | 'component';
      fallback?: ProfileSelection;
      visible?: boolean;
      preset?: PresenceVariant;
      inlineControls?: boolean;
    }
  >(),
  {
    category: 'all',
    fallback: 'full',
    visible: true,
    preset: 'veil',
    inlineControls: true,
  },
);
const presenceCopy = moduleCopy.motion.presence;
const presenceOn = ref(props.visible);

/* Copy owned by this preview only: the shared content file is at its scale
   budget, and no other specimen describes these two execution paths. */
const pathCopy = {
  helper: localized('Transition helper', '过渡辅助函数'),
  helperHint: localized(
    'presence(variant) writes the preset attribute; a wrapping <Transition name="nv"> plays it through the class engine.',
    'presence(variant) 只写入预设属性；由外层 <Transition name="nv"> 通过 class 引擎播放。',
  ),
  adapter: localized('Presence component', 'Presence 组件'),
  adapterHint: localized(
    'UiPresence mounts and unmounts its own child, so the same preset runs through the keyframe engine with no Transition wrapper.',
    'UiPresence 自行控制子元素挂载与卸载，同一预设改由关键帧引擎播放，无需 Transition 包裹。',
  ),
  replay: localized('Replay {name}', '重播 {name}'),
};

const profile = ref<ProfileSelection>(props.fallback);
watch(
  () => props.fallback,
  (next) => {
    profile.value = next;
  },
);
watch(
  () => props.visible,
  (next) => {
    presenceOn.value = next;
  },
);
const profileAttribute = computed(() => (profile.value === 'full' ? undefined : profile.value));
const profileOptions = computed(() => [
  { value: 'full', label: localize(presenceCopy.fallbackFull, props.locale) },
  {
    value: 'no-filter',
    label: localize(presenceCopy.fallbackNoFilter, props.locale),
  },
  {
    value: 'fade-only',
    label: localize(presenceCopy.fallbackFadeOnly, props.locale),
  },
]);

function setProfile(value: string): void {
  const isFallback = (candidate: string): candidate is PresenceFallback =>
    presenceFallbacks.some((fallback) => fallback === candidate);
  if (value === 'full' || isFallback(value)) {
    profile.value = value;
  }
}

/* Replay is per specimen: the counter is bound as the transition key, so only
   that one element remounts and plays its entrance again. A hidden specimen is
   revealed first, because replaying an entrance that is not on screen would
   look like a dead control. */
const ADAPTER_KEY = 'adapter';
const replayCounts = reactive<Record<string, number>>({});

watch(
  () => props.preset,
  (next) => {
    replayCounts[next] = (replayCounts[next] ?? 0) + 1;
    replayCounts[ADAPTER_KEY] = (replayCounts[ADAPTER_KEY] ?? 0) + 1;
  },
);

function replay(key: string): void {
  presenceOn.value = true;
  replayCounts[key] = (replayCounts[key] ?? 0) + 1;
}

function replayKey(key: string): number {
  return replayCounts[key] ?? 0;
}

function replayLabel(name: string): string {
  return formatLocalized(pathCopy.replay, props.locale, { name });
}
</script>

<template>
  <component :is="props.frame ?? MotionPreviewFrame">
    <template #action>
      <UiButton
        data-motion-presence-toggle
        size="sm"
        variant="secondary"
        @click="presenceOn = !presenceOn"
      >
        {{
          presenceOn
            ? localize(presenceCopy.hide, props.locale)
            : localize(presenceCopy.visible, props.locale)
        }}
      </UiButton>
    </template>

    <UiSurface surface="none" class="playground-specimen-panel grid gap-3">
      <!-- The profile rewrites the engine's frame variables. Remounting the grid
           on every switch replays the entrance, so the fallback is something the
           reader watches happen instead of a caption to trust. -->
      <div
        v-if="props.inlineControls"
        class="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
      >
        <p class="min-w-0 text-caption text-secondary">
          {{ localize(presenceCopy.fallbackHint, props.locale) }}
        </p>
        <UiSegmentedControl
          class="justify-self-start md:justify-self-end"
          data-motion-presence-fallback
          :aria-label="localize(presenceCopy.fallbackLabel, props.locale)"
          :options="profileOptions"
          :model-value="profile"
          size="sm"
          surface="glass-subtle"
          @update:model-value="setProfile"
        />
      </div>

      <div
        :key="profile"
        class="grid gap-4"
        :data-neoverse-motion-fallback="profileAttribute"
        data-motion-presence-grid
      >
        <!-- Two execution paths of the same presets. They are separate groups
             because a reader compares them by mechanism, not by preset list. -->
        <section
          v-if="props.category !== 'component'"
          class="grid gap-2"
          data-motion-presence-path="helper"
        >
          <div class="grid gap-1">
            <h4 class="text-label font-label text-primary">
              {{ localize(pathCopy.helper, props.locale) }}
            </h4>
            <p class="text-caption text-secondary">
              {{ localize(pathCopy.helperHint, props.locale) }}
            </p>
          </div>
          <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            <div
              v-for="variant in props.category === 'helper' ? [props.preset] : presenceVariants"
              :key="variant"
              class="grid gap-2"
            >
              <div class="flex min-w-0 items-center justify-between gap-2">
                <code class="min-w-0 truncate text-code text-secondary">
                  presence('{{ variant }}')
                </code>
                <UiIconButton
                  :data-motion-presence-replay-specimen="variant"
                  :label="replayLabel(variant)"
                  size="sm"
                  surface="none"
                  variant="ghost"
                  @click="replay(variant)"
                >
                  <LabIcon name="replay" />
                </UiIconButton>
              </div>
              <div class="playground-motion-stage">
                <Transition :key="replayKey(variant)" appear name="nv">
                  <UiBadge
                    v-if="presenceOn"
                    v-bind="presence(variant)"
                    :data-motion-presence-specimen="variant"
                    size="md"
                    variant="info"
                  >
                    {{ variant }}
                  </UiBadge>
                </Transition>
              </div>
            </div>
          </div>
        </section>

        <section
          v-if="props.category !== 'helper'"
          class="grid gap-2 border-t border-subtle pt-4"
          data-motion-presence-path="adapter"
        >
          <div class="grid gap-1">
            <h4 class="text-label font-label text-primary">
              {{ localize(pathCopy.adapter, props.locale) }}
            </h4>
            <p class="text-caption text-secondary">
              {{ localize(pathCopy.adapterHint, props.locale) }}
            </p>
          </div>
          <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            <div class="grid gap-2">
              <div class="flex min-w-0 items-center justify-between gap-2">
                <code class="min-w-0 truncate text-code text-secondary">
                  &lt;UiPresence show variant="{{ props.preset }}"&gt;
                </code>
                <UiIconButton
                  :data-motion-presence-replay-specimen="ADAPTER_KEY"
                  :label="replayLabel('UiPresence')"
                  size="sm"
                  surface="none"
                  variant="ghost"
                  @click="replay(ADAPTER_KEY)"
                >
                  <LabIcon name="replay" />
                </UiIconButton>
              </div>
              <div class="playground-motion-stage">
                <UiPresence
                  :key="replayKey(ADAPTER_KEY)"
                  :show="presenceOn"
                  data-motion-presence-adapter="vue"
                  :variant="props.preset"
                >
                  <UiBadge size="md" variant="info">UiPresence</UiBadge>
                </UiPresence>
              </div>
            </div>
          </div>
        </section>
      </div>
    </UiSurface>
  </component>
</template>
