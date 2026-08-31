<script setup lang="ts">
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
  <article
    class="grid gap-3 rounded-control material-glass-subtle p-3 lg:grid-cols-2 lg:items-center"
  >
    <div>
      <h3 class="text-label font-label text-primary">{{ localize(props.label, props.locale) }}</h3>
      <p v-if="props.hint" class="mt-1 text-caption text-secondary">
        {{ localize(props.hint, props.locale) }}
      </p>
    </div>
    <div class="flex min-w-0 items-center gap-3 overflow-x-auto py-2">
      <slot />
    </div>
  </article>
</template>
