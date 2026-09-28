<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { layoutRoleTokens, primitiveSpacingTokens, semanticSpacingTokens } from '../lab-data';
import { localize, moduleCopy } from '../playground-content';
import TokenRow from '../TokenRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <LabSpecimenSection
      id="spacing-primitive"
      :title="localize(moduleCopy.spacing.primitive.label, props.locale)"
      :description="localize(moduleCopy.spacing.primitive.description, props.locale)"
    >
      <div class="playground-token-grid">
        <TokenRow
          v-for="token in primitiveSpacingTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :variable="token.variable"
          preview="space"
        />
      </div>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="spacing-alias"
      :title="localize(moduleCopy.spacing.aliases.label, props.locale)"
      :description="localize(moduleCopy.spacing.aliases.description, props.locale)"
    >
      <div class="playground-token-grid">
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
    </LabSpecimenSection>

    <LabSpecimenSection
      id="layout-role"
      :title="localize(moduleCopy.spacing.roles.label, props.locale)"
      :description="localize(moduleCopy.spacing.roles.description, props.locale)"
    >
      <div class="playground-token-grid">
        <TokenRow
          v-for="token in layoutRoleTokens"
          :key="token.variable"
          :label="token.label"
          :locale="props.locale"
          :class-name="token.className"
          :variable="token.variable"
          preview="layout"
        />
      </div>
    </LabSpecimenSection>
  </div>
</template>
