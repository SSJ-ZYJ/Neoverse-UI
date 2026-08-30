<script setup lang="ts">
import materialBackgroundDark from './assets/material-background-dark.png';
import materialBackgroundLight from './assets/material-background-light.png';

const materialBackground =
  document.documentElement.dataset.theme === 'dark'
    ? materialBackgroundDark
    : materialBackgroundLight;

const backgroundStyle = {
  backgroundImage: `url(${materialBackground})`,
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
};
</script>

<template>
  <div
    class="overflow-hidden rounded-card border border-subtle bg-surface-canvas p-4 md:p-5"
    :style="backgroundStyle"
  >
    <slot />
  </div>
</template>
