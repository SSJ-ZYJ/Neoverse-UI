<script setup lang="ts">
import type { Locale, LocalizedText } from './playground-content';
import { localize } from './playground-content';

interface ColorSwatchCellProps {
  label: LocalizedText;
  locale: Locale;
  variable: string;
  className: string;
}

const props = defineProps<ColorSwatchCellProps>();
</script>

<template>
  <li data-color-swatch-cell class="color-role">
    <span class="color-role__sample" aria-hidden="true">
      <span :style="{ backgroundColor: `var(${props.variable})` }" />
    </span>
    <div class="color-role__details">
      <span data-color-swatch-label class="text-label font-label text-primary">
        {{ localize(props.label, props.locale) }}
      </span>
      <code data-color-swatch-variable class="text-code text-secondary">{{ props.variable }}</code>
      <code data-color-swatch-class class="text-code text-muted">{{ props.className }}</code>
    </div>
  </li>
</template>

<style scoped>
.color-role {
  display: grid;
  grid-template-columns: var(--neoverse-space-8) minmax(0, 1fr);
  gap: var(--neoverse-space-3);
  align-items: start;
  padding-block: var(--neoverse-space-2);
  contain: layout style;
}

.color-role + .color-role {
  border-block-start: var(--neoverse-border-width-thin) solid var(--neoverse-color-border-subtle);
}

.color-role__sample {
  display: grid;
  aspect-ratio: 1;
  overflow: hidden;
  border: var(--neoverse-border-width-thin) solid var(--neoverse-color-border-default);
  border-radius: var(--neoverse-radius-control-inner);
  background-color: var(--neoverse-color-surface-canvas);
  contain: strict;
}

.color-role__details {
  display: grid;
  gap: var(--neoverse-space-1);
  overflow-wrap: anywhere;
}
</style>
