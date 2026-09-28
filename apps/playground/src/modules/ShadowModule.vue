<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { primitiveShadowTokens, semanticShadowTokens } from '../lab-data';
import { localize, moduleCopy } from '../playground-content';
import TokenRow from '../TokenRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <LabSpecimenSection
      id="shadow-primitive"
      :title="localize(moduleCopy.shadow.primitive.label, props.locale)"
      :description="localize(moduleCopy.shadow.primitive.description, props.locale)"
    >
      <div class="playground-token-grid">
        <TokenRow
          v-for="token in primitiveShadowTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="shadow"
        />
      </div>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="shadow-alias"
      :title="localize(moduleCopy.shadow.aliases.label, props.locale)"
      :description="localize(moduleCopy.shadow.aliases.description, props.locale)"
    >
      <div class="playground-token-grid">
        <TokenRow
          v-for="token in semanticShadowTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="shadow"
        />
      </div>
    </LabSpecimenSection>
  </div>
</template>
