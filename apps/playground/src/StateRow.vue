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
    surface="subtle"
    class="playground-specimen-row grid gap-3 lg:grid-cols-2 lg:items-center"
    data-specimen-state-row
    :data-specimen-label="localize(props.label, props.locale)"
  >
    <div>
      <h3 class="text-label font-label text-primary">{{ localize(props.label, props.locale) }}</h3>
      <p v-if="props.hint" class="mt-1 text-caption text-secondary">
        {{ localize(props.hint, props.locale) }}
      </p>
    </div>
    <div
      class="scrollbar-immersive flex min-w-0 flex-wrap items-center gap-3 overflow-x-auto px-1 py-2"
    >
      <slot />
    </div>
  </UiSurface>
</template>
