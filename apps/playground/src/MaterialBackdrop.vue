<script setup lang="ts">
import { computed } from 'vue';
import materialBackgroundDark from './assets/material-background-dark.png';
import materialBackgroundLight from './assets/material-background-light.png';
import { frameTheme } from './frame-state';

/* The frame document's data-theme attribute drives frameTheme reactively, so
   the backdrop swaps with in-place theme switches instead of waiting for a
   reload. */
const materialBackground = computed(() =>
  frameTheme.value === 'dark' ? materialBackgroundDark : materialBackgroundLight,
);

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${materialBackground.value})`,
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
}));
</script>

<template>
  <div
    class="overflow-hidden rounded-card border border-subtle bg-surface-canvas p-4 md:p-5"
    :style="backgroundStyle"
  >
    <slot />
  </div>
</template>
