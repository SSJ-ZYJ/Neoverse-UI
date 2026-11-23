<script setup lang="ts">
import { glassMaterial } from '@neoverse-ui/tokens';
import { presence, staggerStyle, UiBadge, UiButton, UiSurface } from '@neoverse-ui/vue';
import { type Component, ref } from 'vue';
import type { LabModuleProps } from '../modules/types';
import { localize, moduleCopy } from '../playground-content';
import { MotionPreviewFrame } from './motion-preview-frame';

const props = defineProps<LabModuleProps & { frame?: Component }>();
const presenceCopy = moduleCopy.motion.presence;
const presenceSpecimens = ['Neoverse', 'Motion', 'Presence', glassMaterial.name, 'Edge to Edge'];
const staggerOrder = ref(presenceSpecimens.map((label, index) => ({ label, seed: index })));
const staggerReplay = ref(0);

function shuffleStagger(): void {
  const [first, ...rest] = staggerOrder.value;
  if (first) staggerOrder.value = [...rest, first];
}
</script>

<template>
  <component :is="props.frame ?? MotionPreviewFrame">
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

    <UiSurface surface="none" class="playground-specimen-panel">
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
  </component>
</template>
