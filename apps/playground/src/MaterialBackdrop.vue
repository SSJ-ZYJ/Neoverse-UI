<script setup lang="ts">
import { computed } from 'vue';
import materialBackgroundDark from './assets/material-background-dark.png';
import materialBackgroundLight from './assets/material-background-light.png';
import { resolvedTheme } from './theme-state';

/* The shared resolved theme covers both the main Playground shell and the
   isolated /frame surface, including system-theme changes. */
const materialBackground = computed(() =>
  resolvedTheme.value === 'dark' ? materialBackgroundDark : materialBackgroundLight,
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
