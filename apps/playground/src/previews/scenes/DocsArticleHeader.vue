<script setup lang="ts">
import { UiBadge, UiButton, UiIconButton, UiSurface } from '@neoverse-ui/vue';
import LabIcon from '../../LabIcon.vue';
import type { LabModuleProps } from '../../modules/types';
import { localize, moduleCopy } from '../../playground-content';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.composition;
</script>

<template>
  <UiSurface surface="glass-elevated" class="rounded-card p-4" data-composition-surface>
    <div class="grid gap-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 max-w-container-lg">
          <UiBadge variant="info">
            {{ localize(copy.scenes.docsArticleHeader.eyebrow, props.locale) }}
          </UiBadge>
          <h4 class="mt-3 text-heading font-heading leading-heading tracking-heading text-primary">
            {{ localize(copy.scenes.docsArticleHeader.title, props.locale) }}
          </h4>
          <p class="mt-2 max-w-container-md text-body text-secondary">
            {{ localize(copy.scenes.docsArticleHeader.summary, props.locale) }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <UiButton variant="ghost" size="sm">
            {{ localize(copy.scenes.docsArticleHeader.save, props.locale) }}
          </UiButton>
          <UiIconButton
            variant="ghost"
            size="sm"
            :label="localize(copy.scenes.docsArticleHeader.more, props.locale)"
          >
            <LabIcon name="menu" />
          </UiIconButton>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted">
        <span>{{ localize(copy.scenes.docsArticleHeader.meta, props.locale) }}</span>
        <span class="size-1 rounded-full bg-accent-primary" aria-hidden="true" />
        <span>{{ localize(copy.scenes.docsArticleHeader.author, props.locale) }}</span>
      </div>
    </div>
  </UiSurface>
</template>
