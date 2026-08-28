<script setup lang="ts">
import type { Locale, LocalizedText } from './playground-content';
import { localize } from './playground-content';

type TokenPreview = 'color' | 'space' | 'radius' | 'border' | 'border-style' | 'shadow';

interface TokenRowProps {
  label: LocalizedText;
  locale: Locale;
  variable: string;
  className?: string;
  preview: TokenPreview;
}

const props = defineProps<TokenRowProps>();
</script>

<template>
  <div
    class="flex min-w-0 items-center gap-3 rounded-control border border-subtle bg-surface-canvas p-3"
  >
    <span
      v-if="props.preview === 'color'"
      class="size-10 shrink-0 rounded-control border border-default"
      :style="{ backgroundColor: `var(${props.variable})` }"
    />
    <span
      v-else-if="props.preview === 'space'"
      class="h-2 shrink-0 bg-accent-primary"
      :style="{ width: `var(${props.variable})` }"
    />
    <span
      v-else-if="props.preview === 'radius'"
      class="h-10 w-20 shrink-0 border border-default bg-surface-raised"
      :style="{ borderRadius: `var(${props.variable})` }"
    />
    <span
      v-else-if="props.preview === 'border'"
      class="h-10 w-20 shrink-0 bg-surface-raised"
      :style="{
        borderColor: `var(--neoverse-color-border-default)`,
        borderStyle: `var(--neoverse-border-style-solid)`,
        borderWidth: `var(${props.variable})`,
      }"
    />
    <span
      v-else-if="props.preview === 'border-style'"
      class="h-10 w-20 shrink-0 bg-surface-raised"
      :style="{
        borderColor: `var(--neoverse-color-border-default)`,
        borderStyle: `var(${props.variable})`,
        borderWidth: `var(--neoverse-border-width-strong)`,
      }"
    />
    <span
      v-else
      class="h-10 w-20 shrink-0 rounded-control bg-surface-raised"
      :style="{ boxShadow: `var(${props.variable})` }"
    />
    <span class="min-w-0">
      <span class="block truncate text-label font-label text-primary">
        {{ localize(props.label, props.locale) }}
      </span>
      <code class="block truncate text-code text-secondary">{{ props.variable }}</code>
      <code v-if="props.className" class="block truncate text-code text-muted">
        {{ props.className }}
      </code>
    </span>
  </div>
</template>
