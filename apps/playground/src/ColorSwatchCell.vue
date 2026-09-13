<script setup lang="ts">
import type { Locale, LocalizedText } from './playground-content';
import { localize } from './playground-content';

interface ColorSwatchCellProps {
  label: LocalizedText;
  locale: Locale;
  variable: string;
  className?: string;
}

const props = defineProps<ColorSwatchCellProps>();
</script>

<template>
  <article
    data-color-swatch-cell
    class="w-32 shrink-0 overflow-hidden rounded-control border border-subtle bg-surface-subtle"
  >
    <div
      class="h-12 w-full border-b border-subtle"
      :style="{ backgroundColor: `var(${props.variable})` }"
      aria-hidden="true"
    />
    <div class="grid gap-0.5 px-2 py-2">
      <span
        data-color-swatch-label
        class="whitespace-normal break-words text-label font-label text-primary"
      >
        {{ localize(props.label, props.locale) }}
      </span>
      <code
        data-color-swatch-variable
        class="whitespace-normal break-words font-mono text-2xs leading-normal text-secondary"
        >{{ props.variable }}</code
      >
      <code
        v-if="props.className"
        data-color-swatch-class
        class="whitespace-normal break-words font-mono text-2xs leading-normal text-muted"
      >
        {{ props.className }}
      </code>
    </div>
  </article>
</template>
