<script setup lang="ts">
import { UiButton } from '@neoverse-ui/vue';
import { ref } from 'vue';
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
    <section class="grid gap-3" aria-labelledby="motion-primitive-title">
      <header class="grid gap-1">
        <h2 id="motion-primitive-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.motion.primitive.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.motion.primitive.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-3 rounded-control material-glass-subtle p-4 md:grid-cols-2">
        <div v-for="group in motionBaseEntries" :key="group.label.en" class="grid gap-1">
          <h3 class="text-label font-label text-primary">
            {{ localize(group.label, props.locale) }}
          </h3>
          <code v-for="[ key, value ] in group.entries" :key="key" class="text-code text-secondary">
            {{ key }}: {{ value }}
          </code>
        </div>
      </div>
    </section>
    <section class="grid gap-3" aria-labelledby="motion-alias-title">
      <header class="grid gap-1">
        <h2 id="motion-alias-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.motion.aliases.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.motion.aliases.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-3 rounded-control material-glass-subtle p-4 md:grid-cols-3">
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
      </div>
    </section>
    <section class="grid gap-3" aria-labelledby="motion-semantic-live-title">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div class="grid gap-1">
          <h2 id="motion-semantic-live-title" class="text-subtitle font-heading tracking-heading">
            {{ localize(semanticCopy.label, props.locale) }}
          </h2>
          <p class="max-w-container-lg text-caption text-secondary">
            {{ localize(semanticCopy.description, props.locale) }}
          </p>
        </div>
        <UiButton
          data-motion-semantic-toggle
          size="sm"
          variant="secondary"
          @click="semanticMotionActive = !semanticMotionActive"
        >
          {{ localize(semanticCopy.toggle, props.locale) }}
        </UiButton>
      </header>
      <div class="grid gap-3 md:grid-cols-3">
        <article class="grid gap-3 rounded-card bg-surface-subtle p-4">
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
        </article>
        <article class="grid gap-3 rounded-card bg-surface-subtle p-4">
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
        </article>
        <article class="grid gap-3 rounded-card bg-surface-subtle p-4">
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
        </article>
      </div>
    </section>
  </div>
</template>
