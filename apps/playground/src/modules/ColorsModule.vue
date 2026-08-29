<script setup lang="ts">
import { primitiveColorGroups, semanticColorGroups } from '../lab-data';
import { localize, moduleCopy } from '../playground-content';
import TokenRow from '../TokenRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <section class="grid gap-3" aria-labelledby="colors-primitive-title">
      <header class="grid gap-1">
        <h2 id="colors-primitive-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.colors.primitive.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.colors.primitive.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-grid md:grid-cols-2">
        <div v-for="group in primitiveColorGroups" :key="group.label.en" class="grid content-start gap-3">
          <h3 class="text-label font-label text-primary">{{ localize(group.label, props.locale) }}</h3>
          <TokenRow
            v-for="token in group.items"
            :key="token.variable"
            :label="token.label"
            :locale="props.locale"
            :variable="token.variable"
            preview="color"
          />
        </div>
      </div>
    </section>
    <section class="grid gap-3" aria-labelledby="colors-alias-title">
      <header class="grid gap-1">
        <h2 id="colors-alias-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.colors.aliases.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.colors.aliases.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-grid md:grid-cols-2">
        <div v-for="group in semanticColorGroups" :key="group.label.en" class="grid content-start gap-3">
          <h3 class="text-label font-label text-primary">{{ localize(group.label, props.locale) }}</h3>
          <TokenRow
            v-for="token in group.items"
            :key="token.variable"
            :label="token.label"
            :locale="props.locale"
            :variable="token.variable"
            :class-name="token.className"
            preview="color"
          />
        </div>
      </div>
    </section>
  </div>
</template>
