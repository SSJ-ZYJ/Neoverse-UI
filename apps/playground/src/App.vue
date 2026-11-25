<script setup lang="ts">
import { LabBoard, LabWorkspace } from './app-views';
import { frameView } from './frame-state';
</script>

<template>
  <LabBoard v-if="frameView" />
  <LabWorkspace v-else />
</template>
