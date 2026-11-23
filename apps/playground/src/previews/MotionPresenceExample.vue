<script setup lang="ts">
import { type PresenceFallback, presenceFallbacks, presenceVariants } from '@neoverse-ui/motion';
import {
  presence,
  staggerStyle,
  UiBadge,
  UiButton,
  UiPresence,
  UiSegmentedControl,
  UiSurface,
} from '@neoverse-ui/vue';
import { type Component, computed, ref } from 'vue';
import type { LabModuleProps } from '../modules/types';
import { localize, moduleCopy } from '../playground-content';
import { MotionPreviewFrame } from './motion-preview-frame';

const props = defineProps<LabModuleProps & { frame?: Component }>();
const presenceCopy = moduleCopy.motion.presence;
const presenceOn = ref(true);

/** `full` keeps the engine's own geometry; the other two are declared profiles. */
type ProfileSelection = 'full' | PresenceFallback;
const profile = ref<ProfileSelection>('full');
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
      <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
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
        class="grid gap-3 md:grid-cols-3 xl:grid-cols-4"
        :data-neoverse-motion-fallback="profileAttribute"
        data-motion-presence-grid
      >
        <div v-for="(variant, index) in presenceVariants" :key="variant" class="grid gap-2">
          <code class="text-code text-secondary">presence('{{ variant }}')</code>
          <div class="playground-motion-stage">
            <Transition name="nv" appear>
              <UiBadge
                v-if="presenceOn"
                v-bind="presence(variant)"
                :data-motion-presence-specimen="variant"
                :style="staggerStyle(index, { step: 60 })"
                size="md"
                variant="info"
              >
                {{ variant }}
              </UiBadge>
            </Transition>
          </div>
        </div>
        <div class="grid gap-2">
          <code class="text-code text-secondary">&lt;UiPresence show variant="veil"&gt;</code>
          <div class="playground-motion-stage">
            <UiPresence :show="presenceOn" variant="veil" data-motion-presence-adapter="vue">
              <UiBadge size="md" variant="info">UiPresence</UiBadge>
            </UiPresence>
          </div>
        </div>
      </div>
    </UiSurface>
  </component>
</template>
