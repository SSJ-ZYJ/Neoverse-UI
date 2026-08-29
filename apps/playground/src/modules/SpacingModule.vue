<script setup lang="ts">
import { primitiveSpacingTokens, semanticSpacingTokens } from '../lab-data';
import { localize, moduleCopy } from '../playground-content';
import TokenRow from '../TokenRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <section class="grid gap-3" aria-labelledby="spacing-primitive-title">
      <header class="grid gap-1">
        <h2 id="spacing-primitive-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.spacing.primitive.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.spacing.primitive.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-grid md:grid-cols-2">
        <TokenRow
          v-for="token in primitiveSpacingTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="space"
        />
      </div>
    </section>
    <section class="grid gap-3" aria-labelledby="spacing-alias-title">
      <header class="grid gap-1">
        <h2 id="spacing-alias-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.spacing.aliases.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.spacing.aliases.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-3 md:grid-cols-3">
        <TokenRow
          v-for="token in semanticSpacingTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :class-name="token.className"
          :variable="token.variable"
          preview="space"
        />
      </div>
    </section>
  </div>
</template>
