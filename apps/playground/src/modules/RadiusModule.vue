<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { primitiveRadiusTokens, semanticRadiusTokens } from '../lab-data';
import { localize, moduleCopy } from '../playground-content';
import TokenRow from '../TokenRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <LabSpecimenSection
      id="radius-primitive"
      :title="localize(moduleCopy.radius.primitive.label, props.locale)"
      :description="localize(moduleCopy.radius.primitive.description, props.locale)"
    >
      <div class="playground-token-grid">
        <TokenRow
          v-for="token in primitiveRadiusTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="radius"
        />
      </div>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="radius-alias"
      :title="localize(moduleCopy.radius.aliases.label, props.locale)"
      :description="localize(moduleCopy.radius.aliases.description, props.locale)"
    >
      <div class="playground-token-grid">
        <TokenRow
          v-for="token in semanticRadiusTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="radius"
        />
      </div>
    </LabSpecimenSection>
  </div>
</template>
