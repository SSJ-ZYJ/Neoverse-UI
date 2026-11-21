<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { borderStyleTokens, borderWidthTokens } from '../lab-data';
import { localize, moduleCopy } from '../playground-content';
import TokenRow from '../TokenRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <LabSpecimenSection
      id="border-width"
      :title="localize(moduleCopy.border.width.label, props.locale)"
      :description="localize(moduleCopy.border.width.description, props.locale)"
    >
      <div class="playground-token-grid">
        <TokenRow
          v-for="token in borderWidthTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="border"
        />
      </div>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="border-style"
      :title="localize(moduleCopy.border.style.label, props.locale)"
      :description="localize(moduleCopy.border.style.description, props.locale)"
    >
      <div class="playground-token-grid">
        <TokenRow
          v-for="token in borderStyleTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="border-style"
        />
      </div>
    </LabSpecimenSection>
  </div>
</template>
