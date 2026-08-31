<script setup lang="ts">
import { UiSkeleton } from '@neoverse-ui/vue';
import { localize, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.skeleton;
</script>

<template>
  <div class="grid gap-grid sm:grid-cols-2 lg:grid-cols-3">
    <article class="grid gap-3 rounded-control material-glass-subtle p-4">
      <h3 class="text-label font-label text-primary">
        {{ localize(copy.controls.text, props.locale) }}
      </h3>
      <UiSkeleton variant="text" class="w-full" />
    </article>
    <article class="grid gap-3 rounded-control material-glass-subtle p-4">
      <h3 class="text-label font-label text-primary">
        {{ localize(copy.controls.title, props.locale) }}
      </h3>
      <UiSkeleton variant="title" class="w-4/5" />
    </article>
    <article class="grid gap-3 rounded-control material-glass-subtle p-4">
      <h3 class="text-label font-label text-primary">
        {{ localize(copy.controls.rect, props.locale) }}
      </h3>
      <UiSkeleton variant="rect" width="100%" height="6rem" radius="0.75rem" />
    </article>
    <article class="grid gap-3 rounded-control material-glass-subtle p-4">
      <h3 class="text-label font-label text-primary">
        {{ localize(copy.controls.circle, props.locale) }}
      </h3>
      <UiSkeleton variant="circle" class="size-16" />
    </article>
    <article class="grid gap-3 rounded-control material-glass-subtle p-4">
      <h3 class="text-label font-label text-primary">
        {{ localize(copy.controls.avatar, props.locale) }}
      </h3>
      <div class="flex items-center gap-3">
        <UiSkeleton variant="avatar" effect="pulse" class="size-12 shrink-0" />
        <div class="grid min-w-0 flex-1 gap-2">
          <UiSkeleton variant="title" class="w-3/5" />
          <UiSkeleton variant="text" class="w-full" />
        </div>
      </div>
    </article>
  </div>
  <div class="grid gap-2 rounded-control material-glass-subtle p-4 sm:grid-cols-2">
    <div class="grid gap-2">
      <h3 class="text-label font-label text-primary">
        {{ localize(copy.controls.pulse, props.locale) }}
      </h3>
      <UiSkeleton effect="pulse" class="w-4/5" />
    </div>
    <div class="grid gap-2">
      <h3 class="text-label font-label text-primary">
        {{ localize(copy.controls.static, props.locale) }}
      </h3>
      <UiSkeleton effect="none" class="w-3/5" />
    </div>
  </div>
  <p class="text-caption text-secondary">{{ localize(copy.body, props.locale) }}</p>
</template>
