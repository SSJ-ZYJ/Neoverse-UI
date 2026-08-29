<script setup lang="ts">
import { primitiveShadowTokens, semanticShadowTokens } from '../lab-data';
import { localize, moduleCopy } from '../playground-content';
import TokenRow from '../TokenRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-3">
    <section class="grid gap-3" aria-labelledby="shadow-primitive-title">
      <header class="grid gap-1">
        <h2 id="shadow-primitive-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.shadow.primitive.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.shadow.primitive.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-grid md:grid-cols-2">
        <TokenRow
          v-for="token in primitiveShadowTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="shadow"
        />
      </div>
    </section>
    <section class="grid gap-3" aria-labelledby="shadow-alias-title">
      <header class="grid gap-1">
        <h2 id="shadow-alias-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.shadow.aliases.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.shadow.aliases.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-grid md:grid-cols-2">
        <TokenRow
          v-for="token in semanticShadowTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="shadow"
        />
      </div>
    </section>
  </div>
</template>
