<script setup lang="ts">
import { UiButton, UiSurface } from '@neoverse-ui/vue';
import { ref } from 'vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { motionBaseGroups, motionVariableGroups } from '../lab-data';
import { formatLocalized, localize, localized, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const semanticMotionActive = ref(false);
const semanticCopy = {
  label: localized('Live semantic transitions', '实时语义过渡'),
  description: localized(
    'Feedback, state, and spatial roles are the same motion contracts consumed by shared components.',
    'feedback、state 与 spatial 是共享组件实际使用的三类动效契约。',
  ),
  toggle: localized('Toggle transition state', '切换过渡状态'),
  feedback: localized('Immediate feedback', '即时反馈'),
  state: localized('State change', '状态变化'),
  spatial: localized('Spatial change', '空间变化'),
} as const;
const motionVariableEntries = motionVariableGroups.map((group) => ({
  ...group,
  entries: Object.entries(group.values),
}));
const motionBaseEntries = motionBaseGroups.map((group) => ({
  ...group,
  entries: Object.entries(group.values),
}));
</script>

<template>
  <div id="foundation-motion" class="scroll-mt-24 grid gap-grid">
    <LabSpecimenSection
      id="motion-primitive"
      :title="localize(moduleCopy.motion.primitive.label, props.locale)"
      :description="localize(moduleCopy.motion.primitive.description, props.locale)"
    >
      <UiSurface surface="glass-subtle" class="playground-specimen-panel grid gap-3 md:grid-cols-2">
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
      id="motion-alias"
      :title="localize(moduleCopy.motion.aliases.label, props.locale)"
      :description="localize(moduleCopy.motion.aliases.description, props.locale)"
    >
      <UiSurface surface="glass-subtle" class="playground-specimen-panel grid gap-3 md:grid-cols-3">
        <div v-for="group in motionVariableEntries" :key="group.label.en" class="grid gap-1">
          <h3 class="text-label font-label text-primary">
            {{ formatLocalized(moduleCopy.motion.cssVariables, props.locale, {
                label: localize(group.label, props.locale),
              }) }}
          </h3>
          <code v-for="[ key, value ] in group.entries" :key="key" class="text-code text-secondary">
            {{ key }}: {{ value }}
          </code>
        </div>
      </UiSurface>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="motion-semantic-live"
      :title="localize(semanticCopy.label, props.locale)"
      :description="localize(semanticCopy.description, props.locale)"
    >
      <template #action>
        <UiButton
          data-motion-semantic-toggle
          size="sm"
          variant="secondary"
          @click="semanticMotionActive = !semanticMotionActive"
        >
          {{ localize(semanticCopy.toggle, props.locale) }}
        </UiButton>
      </template>

      <div class="grid gap-3 md:grid-cols-3">
        <UiSurface as="article" surface="subtle" class="playground-specimen-panel grid gap-3">
          <h3 class="text-label font-label text-primary">
            {{ localize(semanticCopy.feedback, props.locale) }}
          </h3>
          <div
            data-motion-semantic="feedback"
            :class="[
              'rounded-control bg-accent-soft p-4 text-center text-label font-label text-accent-primary',
              semanticMotionActive ? 'opacity-70' : 'opacity-100',
            ]"
            :style="{
              transitionProperty: 'opacity',
              transitionDuration: 'var(--neoverse-motion-feedback-duration)',
              transitionTimingFunction: 'var(--neoverse-motion-feedback-easing)',
            }"
          >
            feedback
          </div>
        </UiSurface>

        <UiSurface as="article" surface="subtle" class="playground-specimen-panel grid gap-3">
          <h3 class="text-label font-label text-primary">
            {{ localize(semanticCopy.state, props.locale) }}
          </h3>
          <div
            data-motion-semantic="state"
            :class="[
              'rounded-control p-4 text-center text-label font-label',
              semanticMotionActive
                ? 'bg-accent-soft text-accent-primary'
                : 'bg-surface-raised text-secondary',
            ]"
            :style="{
              transitionProperty: 'color, background-color, border-color, box-shadow',
              transitionDuration: 'var(--neoverse-motion-state-duration)',
              transitionTimingFunction: 'var(--neoverse-motion-state-easing)',
            }"
          >
            state
          </div>
        </UiSurface>

        <UiSurface as="article" surface="subtle" class="playground-specimen-panel grid gap-3">
          <h3 class="text-label font-label text-primary">
            {{ localize(semanticCopy.spatial, props.locale) }}
          </h3>
          <div
            data-motion-semantic="spatial"
            :class="[
              'rounded-control bg-surface-raised p-4 text-center text-label font-label text-primary',
              semanticMotionActive ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-60',
            ]"
            :style="{
              transitionProperty: 'transform, opacity',
              transitionDuration: 'var(--neoverse-motion-spatial-duration)',
              transitionTimingFunction: 'var(--neoverse-motion-spatial-easing)',
            }"
          >
            spatial
          </div>
        </UiSurface>
      </div>
    </LabSpecimenSection>
  </div>
</template>
