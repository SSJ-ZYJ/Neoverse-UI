<script setup lang="ts">
import { UiSkeleton } from '@neoverse-ui/vue';
import { localize, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.skeleton;
</script>

<template>
  <div class="grid gap-grid md:grid-cols-3">
    <article class="grid gap-3 rounded-control border border-subtle bg-surface-canvas p-4">
      <h3 class="text-label font-label text-primary">
        {{ localize(copy.controls.text, props.locale) }}
      </h3>
      <UiSkeleton variant="text" class="w-full" />
    </article>
    <article class="grid gap-3 rounded-control border border-subtle bg-surface-canvas p-4">
      <h3 class="text-label font-label text-primary">
        {{ localize(copy.controls.rect, props.locale) }}
      </h3>
      <UiSkeleton variant="rect" class="h-24 w-full" />
    </article>
    <article class="grid gap-3 rounded-control border border-subtle bg-surface-canvas p-4">
      <h3 class="text-label font-label text-primary">
        {{ localize(copy.controls.circle, props.locale) }}
      </h3>
      <UiSkeleton variant="circle" class="size-16" />
    </article>
  </div>
  <p class="text-caption text-secondary">{{ localize(copy.body, props.locale) }}</p>
</template>
