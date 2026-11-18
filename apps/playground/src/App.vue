<script setup lang="ts">
import LabBoard from './LabBoard.vue';
import LabWorkspace from './LabWorkspace.vue';

const frame = window.location.pathname === '/frame';
</script>

<template>
  <LabBoard v-if="frame" />
  <LabWorkspace v-else />
</template>
