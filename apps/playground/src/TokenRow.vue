<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { Locale, LocalizedText } from './playground-content';
import { localize } from './playground-content';
import { resolvedTheme } from './theme-state';

type TokenPreview = 'color' | 'space' | 'radius' | 'border' | 'border-style' | 'shadow';

interface TokenRowProps {
  label: LocalizedText;
  locale: Locale;
  variable: string;
  className?: string;
  preview: TokenPreview;
}

const props = defineProps<TokenRowProps>();
/* Resolved from the shared reactive theme so previews follow theme switches
   (including "system" mode, where data-theme is absent). */
const isDarkTheme = computed(() => resolvedTheme.value === 'dark');
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

function updateResolvedColor(): void {
  if (props.preview !== 'color' || swatchElement.value === null) {
    return;
  }

  resolvedColor.value = formatResolvedColor(getComputedStyle(swatchElement.value).backgroundColor);
}

onMounted(updateResolvedColor);

/* Theme switches rewrite the token variables behind the inline var() styles;
   re-read the computed color once the document has settled. */
watch(resolvedTheme, () => {
  void nextTick(updateResolvedColor);
});
</script>

<template>
  <div
    class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-subtle px-1 py-2 last:border-b-0"
  >
    <span
      v-if="props.preview === 'color'"
      ref="swatchElement"
      class="size-7 shrink-0 rounded-control border border-default"
      :style="{ backgroundColor: `var(${props.variable})` }"
    />
    <span
      v-else-if="props.preview === 'space'"
      class="h-2 shrink-0 bg-accent-primary"
      :style="{ width: `var(${props.variable})` }"
    />
    <span
      v-else-if="props.preview === 'radius'"
      class="h-9 w-14 shrink-0 border border-default bg-surface-raised"
      :style="{ borderRadius: `var(${props.variable})` }"
    />
    <span
      v-else-if="props.preview === 'border'"
      class="h-7 w-12 shrink-0 bg-surface-raised"
      :style="{
        borderColor: `var(--neoverse-color-border-default)`,
        borderStyle: `var(--neoverse-border-style-solid)`,
        borderWidth: `var(${props.variable})`,
      }"
    />
    <span
      v-else-if="props.preview === 'border-style'"
      class="h-7 w-12 shrink-0 bg-surface-raised"
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
      class="flex h-14 w-28 shrink-0 items-center justify-center rounded-control border border-subtle"
      :class="isDarkTheme ? 'bg-surface-raised p-2' : 'bg-surface-overlay p-2'"
      :style="{ backgroundColor: isDarkTheme ? 'var(--neoverse-color-neutral-400)' : undefined }"
    >
      <span
        class="block h-8 w-16 rounded-control bg-surface-raised"
        :style="{
          backgroundColor: isDarkTheme ? 'var(--neoverse-color-neutral-300)' : undefined,
          boxShadow: `var(${props.variable})`,
        }"
      />
    </span>
    <span
      v-else
      class="h-7 w-12 shrink-0 rounded-control bg-surface-raised"
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
