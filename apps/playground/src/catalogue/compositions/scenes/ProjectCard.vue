<script setup lang="ts">
import { UiBadge, UiButton, UiCard, UiIconButton } from '@neoverse-ui/vue';
import { computed, ref, watch } from 'vue';
import { localize, moduleCopy } from '../../../content/playground-content';
import type { LabModuleProps } from '../../../features/catalogue/types';
import LabIcon from '../../../features/workspace/LabIcon.vue';
import {
  type ProjectCardConfiguration,
  projectBadgeVariants,
  projectCardPresets,
  projectStatusLabels,
} from '../composition-settings';
import { elementOf, focusAfterRemoval } from '../scene-focus';

const props = withDefaults(
  defineProps<LabModuleProps & { configuration?: Readonly<ProjectCardConfiguration> }>(),
  { configuration: () => projectCardPresets[0].props },
);
const copy = moduleCopy.composition.scenes.projectCard;
const detailed = computed(() => props.configuration.content === 'detailed');
const percent = computed(
  () => new Intl.NumberFormat(props.locale, { style: 'percent', maximumFractionDigits: 2 }),
);
const footer = ref<HTMLElement | null>(null);
const fallback = ref<{ $el?: unknown } | null>(null);
// Hiding can unmount the control that owns focus when an activation does not
// move focus itself, such as a platform-level click or assistant action.
watch(
  () => props.configuration.content,
  (content) => {
    if (content === 'detailed') return;
    focusAfterRemoval(footer.value, elementOf(fallback.value), document.activeElement);
  },
  { flush: 'pre' },
);
</script>

<template>
  <UiCard :surface="props.configuration.surface" class="grid gap-3" data-composition-surface>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-caption text-accent-primary">
          {{ localize(copy.category, props.locale) }}
        </p>
        <h4 class="mt-1 text-subtitle font-heading tracking-heading text-primary">
          {{ localize(copy.project, props.locale) }}
        </h4>
      </div>
      <div class="flex items-center gap-2">
        <UiBadge :variant="projectBadgeVariants[props.configuration.status]" data-specimen-status>
          {{ localize(projectStatusLabels[props.configuration.status], props.locale) }}
        </UiBadge>
        <UiIconButton
          ref="fallback"
          variant="ghost"
          size="sm"
          :label="localize(copy.more, props.locale)"
        >
          <LabIcon name="menu" />
        </UiIconButton>
      </div>
    </div>

    <p v-if="detailed" class="text-body text-secondary" data-specimen-project-summary>
      {{ localize(copy.summary, props.locale) }}
    </p>

    <div class="grid gap-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-label font-label text-primary">
          {{ localize(copy.progress, props.locale) }}
        </span>
        <span class="text-caption text-secondary" data-specimen-progress-value>
          {{ percent.format(props.configuration.progress / 100) }}
        </span>
      </div>
      <progress
        class="playground-composition-progress"
        :value="props.configuration.progress"
        max="100"
        :aria-label="localize(copy.progress, props.locale)"
      ></progress>
    </div>

    <div
      v-if="detailed"
      ref="footer"
      class="flex flex-wrap items-center justify-between gap-2"
      data-specimen-extra-actions
    >
      <span class="text-caption text-muted">
        {{ localize(copy.updated, props.locale) }}
      </span>
      <UiButton variant="ghost" size="sm">
        {{ localize(copy.open, props.locale) }}
        <template #trailing><LabIcon name="arrow-right" /></template>
      </UiButton>
    </div>
  </UiCard>
</template>
