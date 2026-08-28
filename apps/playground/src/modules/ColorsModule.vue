<script setup lang="ts">
import { colorGroups } from '../lab-data';
import { localize } from '../playground-content';
import TokenRow from '../TokenRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid md:grid-cols-2">
    <div v-for="group in colorGroups" :key="group.label.en" class="grid content-start gap-3">
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
</template>
