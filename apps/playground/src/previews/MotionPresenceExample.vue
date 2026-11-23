<script setup lang="ts">
import { presenceVariants } from '@neoverse-ui/motion';
import { presence, staggerStyle, UiButton, UiPresence, UiSurface } from '@neoverse-ui/vue';
import { type Component, ref } from 'vue';
import type { LabModuleProps } from '../modules/types';
import { localize, moduleCopy } from '../playground-content';
import { MotionPreviewFrame } from './motion-preview-frame';

const props = defineProps<LabModuleProps & { frame?: Component }>();
const presenceCopy = moduleCopy.motion.presence;
const presenceOn = ref(true);
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

    <UiSurface
      surface="none"
      class="playground-specimen-panel grid gap-3 md:grid-cols-3 xl:grid-cols-4"
    >
      <div v-for="(variant, index) in presenceVariants" :key="variant" class="grid gap-2">
        <code class="text-code text-secondary">presence('{{ variant }}')</code>
        <div class="playground-motion-stage">
          <Transition name="nv">
            <span
              v-if="presenceOn"
              v-bind="presence(variant)"
              :data-motion-presence-specimen="variant"
              :style="staggerStyle(index, { step: 60 })"
              class="rounded-pill bg-accent-soft px-3 py-1 text-label-sm text-accent-primary"
            >
              {{ variant }}
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
  </component>
</template>
