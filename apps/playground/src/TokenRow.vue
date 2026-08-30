<script setup lang="ts">
import { onMounted, ref } from 'vue';
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
const isDarkTheme = document.documentElement.dataset.theme === 'dark';
const swatchElement = ref<HTMLElement | null>(null);
const resolvedColor = ref('');

function formatResolvedColor(value: string): string {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(value);
  if (match === null) {
    return value;
  }

  const alpha = match[4];
  if (alpha !== undefined && Number(alpha) === 0) {
    return 'transparent';
  }

  if (alpha === undefined || Number(alpha) >= 1) {
    const toHex = (channel: string | undefined): string =>
      Number(channel).toString(16).padStart(2, '0');
    return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
  }

  const roundedAlpha = Math.round(Number(alpha) * 100) / 100;
  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${roundedAlpha})`;
}

onMounted(() => {
  if (props.preview !== 'color' || swatchElement.value === null) {
    return;
  }

  resolvedColor.value = formatResolvedColor(getComputedStyle(swatchElement.value).backgroundColor);
});
</script>

<template>
  <div
    class="flex min-w-0 items-center gap-3 rounded-control material-glass-subtle p-3"
  >
    <span
      v-if="props.preview === 'color'"
      ref="swatchElement"
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
      class="h-20 w-32 shrink-0 border border-default bg-surface-raised"
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
      v-else-if="props.preview === 'shadow'"
      data-preview="shadow"
      aria-hidden="true"
      class="flex h-16 w-32 shrink-0 items-center justify-center rounded-control border border-subtle"
      :class="isDarkTheme ? 'bg-surface-raised p-3' : 'bg-surface-glass p-3'"
      :style="{ backgroundColor: isDarkTheme ? 'var(--neoverse-color-neutral-400)' : undefined }"
    >
      <span
        class="block h-10 w-20 rounded-control bg-surface-raised"
        :style="{
          backgroundColor: isDarkTheme ? 'var(--neoverse-color-neutral-300)' : undefined,
          boxShadow: `var(${props.variable})`,
        }"
      />
    </span>
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
    <code
      v-if="props.preview === 'color' && resolvedColor.length > 0"
      class="ml-auto shrink-0 text-code text-secondary"
    >
      {{ resolvedColor }}
    </code>
  </div>
</template>
