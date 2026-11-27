<script setup lang="ts">
import { localize, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabSpecimenSection from '../../features/stage/LabSpecimenSection.vue';
import { layoutRoleTokens } from '../foundations/lab-data';
import TokenRow from '../foundations/TokenRow.vue';
import SpacingExample from './SpacingExample.vue';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid">
    <LabSpecimenSection
      id="spacing-alias"
      :title="localize(moduleCopy.spacing.aliases.label, props.locale)"
      :description="localize(moduleCopy.spacing.aliases.description, props.locale)"
    >
      <SpacingExample :locale="props.locale" kind="usage" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="spacing-primitive"
      :title="localize(moduleCopy.spacing.primitive.label, props.locale)"
      :description="localize(moduleCopy.spacing.primitive.description, props.locale)"
    >
      <SpacingExample :locale="props.locale" kind="scale" />
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
          :layout-role="token.layoutRole"
          preview="layout"
        />
      </div>
    </LabSpecimenSection>
  </div>
</template>
