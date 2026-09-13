<script setup lang="ts">
import { localize, moduleCopy } from '../playground-content';
import BorderModule from './BorderModule.vue';
import RadiusModule from './RadiusModule.vue';
import SpacingModule from './SpacingModule.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <section class="grid gap-3" aria-labelledby="layout-shape-spacing-title">
      <header class="grid gap-1">
        <h3 id="layout-shape-spacing-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.spacing.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.spacing.description, props.locale) }}
        </p>
      </header>
      <SpacingModule :locale="props.locale" />
    </section>

    <section class="grid gap-3" aria-labelledby="layout-shape-radius-title">
      <header class="grid gap-1">
        <h3 id="layout-shape-radius-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.radius.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.radius.description, props.locale) }}
        </p>
      </header>
      <RadiusModule :locale="props.locale" />
    </section>

    <section class="grid gap-3" aria-labelledby="layout-shape-border-title">
      <header class="grid gap-1">
        <h3 id="layout-shape-border-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.border.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.border.description, props.locale) }}
        </p>
      </header>
      <BorderModule :locale="props.locale" />
    </section>
  </div>
</template>
