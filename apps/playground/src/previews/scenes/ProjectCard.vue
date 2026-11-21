<script setup lang="ts">
import { UiBadge, UiButton, UiCard, UiIconButton } from '@neoverse-ui/vue';
import LabIcon from '../../LabIcon.vue';
import type { LabModuleProps } from '../../modules/types';
import { localize, moduleCopy } from '../../playground-content';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.composition;
</script>

<template>
  <UiCard class="grid gap-3" data-composition-surface>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-caption text-accent-primary">
          {{ localize(copy.scenes.projectCard.category, props.locale) }}
        </p>
        <h4 class="mt-1 text-subtitle font-heading tracking-heading text-primary">
          {{ localize(copy.scenes.projectCard.project, props.locale) }}
        </h4>
      </div>
      <div class="flex items-center gap-2">
        <UiBadge variant="success">
          {{ localize(copy.scenes.projectCard.status, props.locale) }}
        </UiBadge>
        <UiIconButton
          variant="ghost"
          size="sm"
          :label="localize(copy.scenes.projectCard.more, props.locale)"
        >
          <LabIcon name="menu" />
        </UiIconButton>
      </div>
    </div>

    <p class="text-body text-secondary">
      {{ localize(copy.scenes.projectCard.summary, props.locale) }}
    </p>

    <div class="grid gap-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-label font-label text-primary">
          {{ localize(copy.scenes.projectCard.progress, props.locale) }}
        </span>
        <span class="text-caption text-secondary">
          {{ localize(copy.scenes.projectCard.progressValue, props.locale) }}
        </span>
      </div>
      <div class="h-2 overflow-hidden rounded-pill bg-accent-soft" aria-hidden="true">
        <span class="block h-full w-2/3 rounded-pill bg-accent-secondary" />
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="text-caption text-muted">
        {{ localize(copy.scenes.projectCard.updated, props.locale) }}
      </span>
      <UiButton variant="ghost" size="sm">
        {{ localize(copy.scenes.projectCard.open, props.locale) }}
        <template #trailing><LabIcon name="arrow-right" /></template>
      </UiButton>
    </div>
  </UiCard>
</template>
