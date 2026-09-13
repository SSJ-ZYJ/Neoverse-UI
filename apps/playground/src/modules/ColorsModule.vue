<script setup lang="ts">
import ColorSwatchCell from '../ColorSwatchCell.vue';
import { primitiveColorGroups, semanticColorGroups } from '../lab-data';
import { localize, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <section class="grid gap-4" aria-labelledby="colors-primitive-title">
      <header class="grid gap-1">
        <h2 id="colors-primitive-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.colors.primitive.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.colors.primitive.description, props.locale) }}
        </p>
      </header>

      <article
        v-for="group in primitiveColorGroups"
        :key="group.label.en"
        class="grid gap-2 border-b border-subtle pb-4 last:border-b-0 last:pb-0"
      >
        <h3 class="text-label font-label text-primary">
          {{ localize(group.label, props.locale) }}
        </h3>
        <div
          data-color-palette-strip
          class="scrollbar-immersive flex min-w-0 gap-2 overflow-x-auto pb-2"
        >
          <ColorSwatchCell
            v-for="token in group.items"
            :key="token.variable"
            :label="token.label"
            :locale="props.locale"
            :variable="token.variable"
          />
        </div>
      </article>
    </section>

    <section class="grid gap-4" aria-labelledby="colors-alias-title">
      <header class="grid gap-1">
        <h2 id="colors-alias-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.colors.aliases.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.colors.aliases.description, props.locale) }}
        </p>
      </header>

      <article
        v-for="group in semanticColorGroups"
        :key="group.label.en"
        class="grid gap-2 border-b border-subtle pb-4 last:border-b-0 last:pb-0"
      >
        <h3 class="text-label font-label text-primary">
          {{ localize(group.label, props.locale) }}
        </h3>
        <div
          data-color-palette-strip
          class="scrollbar-immersive flex min-w-0 gap-2 overflow-x-auto pb-2"
        >
          <ColorSwatchCell
            v-for="token in group.items"
            :key="token.variable"
            :label="token.label"
            :locale="props.locale"
            :variable="token.variable"
            :class-name="token.className"
          />
        </div>
      </article>
    </section>
  </div>
</template>
