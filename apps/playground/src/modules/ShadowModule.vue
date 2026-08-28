<script setup lang="ts">
import { shadowTokens } from '../lab-data';
import TokenRow from '../TokenRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid md:grid-cols-2">
    <TokenRow
      v-for="token in shadowTokens"
      :key="token.variable"
      :label="token.label"
      :locale="props.locale"
      :variable="token.variable"
      preview="shadow"
    />
  </div>
</template>
