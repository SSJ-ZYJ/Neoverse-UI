<script setup lang="ts">
import materialBackground from './assets/material-background.png';

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
