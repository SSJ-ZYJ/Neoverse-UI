<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
import type { Locale, LocalizedText } from './playground-content';
import { localize } from './playground-content';

interface StateRowProps {
  label: LocalizedText;
  locale: Locale;
  hint?: LocalizedText;
}

const props = defineProps<StateRowProps>();
</script>
<template>
  <UiSurface
    as="article"
    surface="inset"
    class="playground-specimen-row grid gap-3 lg:grid-cols-2 lg:items-center"
    data-specimen-state-row
    :data-specimen-label="localize(props.label, props.locale)"
    :aria-label="localize(props.label, props.locale)"
  >
    <div class="min-w-0" data-specimen-copy>
      <h3 class="text-label-lg font-label text-primary">
        {{ localize(props.label, props.locale) }}
      </h3>
      <p v-if="props.hint" class="mt-1 text-body-sm text-secondary">
        {{ localize(props.hint, props.locale) }}
      </p>
    </div>
    <div class="playground-specimen-preview scrollbar-immersive px-1 py-2" data-specimen-preview>
      <div class="playground-specimen-preview__content flex flex-wrap items-center gap-3">
        <slot />
      </div>
    </div>
  </UiSurface>
</template>
