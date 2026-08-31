<script setup lang="ts">
import { primitiveRadiusTokens, semanticRadiusTokens } from '../lab-data';
import { localize, moduleCopy } from '../playground-content';
import TokenRow from '../TokenRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <section class="grid gap-3" aria-labelledby="radius-primitive-title">
      <header class="grid gap-1">
        <h2 id="radius-primitive-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.radius.primitive.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.radius.primitive.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-grid md:grid-cols-2 lg:grid-cols-3">
        <TokenRow
          v-for="token in primitiveRadiusTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="radius"
        />
      </div>
    </section>
    <section class="grid gap-3" aria-labelledby="radius-alias-title">
      <header class="grid gap-1">
        <h2 id="radius-alias-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.radius.aliases.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.radius.aliases.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-grid md:grid-cols-2 lg:grid-cols-3">
        <TokenRow
          v-for="token in semanticRadiusTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="radius"
        />
      </div>
    </section>
  </div>
</template>
