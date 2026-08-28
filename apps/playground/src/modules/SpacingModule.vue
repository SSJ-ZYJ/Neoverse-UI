<script setup lang="ts">
import { spacingAliases, spacingTokens } from '../lab-data';
import TokenRow from '../TokenRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid md:grid-cols-2">
    <TokenRow
      v-for="token in spacingTokens"
      :key="token.variable"
      :label="token.label"
      :locale="props.locale"
      :variable="token.variable"
      preview="space"
    />
  </div>
  <div class="grid gap-3 md:grid-cols-3">
    <TokenRow
      v-for="token in spacingAliases"
      :key="token.variable"
      :label="token.label"
      :locale="props.locale"
      :class-name="token.className"
      :variable="token.variable"
      preview="space"
    />
  </div>
</template>
