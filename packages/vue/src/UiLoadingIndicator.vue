<script setup lang="ts">
import { loadingIndicatorClasses } from './classes';
</script>

<template>
  <svg :class="loadingIndicatorClasses" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle
      cx="8"
      cy="8"
      r="6"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-dasharray="28 10"
    />
  </svg>
</template>
