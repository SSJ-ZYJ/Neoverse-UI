<script setup lang="ts">
import { frameView } from './frame-state';
import LabBoard from './LabBoard.vue';
import LabWorkspace from './LabWorkspace.vue';
</script>

<template>
  <LabBoard v-if="frameView" />
  <LabWorkspace v-else />
</template>
