<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
import type { ContractStateId } from '../../catalogue/compositions/contract-lab';
import MaterialLegend from '../../catalogue/materials/MaterialLegend.vue';
import type { Locale, LocalizedText } from '../../content/playground-content';
import { localize } from '../../content/playground-content';
import LabSpecimenHeader from './LabSpecimenHeader.vue';

interface StateRowProps {
  label: LocalizedText;
  locale: Locale;
  hint?: LocalizedText;
  contractState?: ContractStateId;
  layout?: 'auto' | 'wide';
}

const props = defineProps<StateRowProps>();
</script>
<template>
  <UiSurface
    as="article"
    surface="none"
    class="playground-specimen-row grid gap-3"
    data-specimen-state-row
    :data-specimen-label="localize(props.label, props.locale)"
    :data-contract-state="props.contractState"
    :data-specimen-layout="props.layout ?? 'auto'"
    :aria-label="localize(props.label, props.locale)"
  >
    <LabSpecimenHeader
      class="playground-specimen-row__heading"
      data-specimen-copy
      :title="localize(props.label, props.locale)"
      :description="props.hint && localize(props.hint, props.locale)"
    />
    <div class="playground-specimen-preview scrollbar-immersive" data-specimen-preview>
      <div class="playground-specimen-preview__content flex flex-wrap items-center gap-3">
        <slot />
      </div>
      <MaterialLegend :locale="props.locale" />
    </div>
  </UiSurface>
</template>
