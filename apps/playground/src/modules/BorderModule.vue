<script setup lang="ts">
import { borderStyleTokens, borderWidthTokens } from '../lab-data';
import { localize, moduleCopy } from '../playground-content';
import TokenRow from '../TokenRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <section class="grid gap-3" aria-labelledby="border-width-title">
      <header class="grid gap-1">
        <h2 id="border-width-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.border.width.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.border.width.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-grid md:grid-cols-2 lg:grid-cols-3">
        <TokenRow
          v-for="token in borderWidthTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="border"
        />
      </div>
    </section>
    <section class="grid gap-3" aria-labelledby="border-style-title">
      <header class="grid gap-1">
        <h2 id="border-style-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(moduleCopy.border.style.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(moduleCopy.border.style.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-grid md:grid-cols-2 lg:grid-cols-3">
        <TokenRow
          v-for="token in borderStyleTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="border-style"
        />
      </div>
    </section>
  </div>
</template>
