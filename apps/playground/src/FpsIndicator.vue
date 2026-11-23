<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const fps = ref<number | null>(null);
const sampleInterval = 500;
let animationFrame: number | undefined;
let sampleStart: number | undefined;
let frameCount = 0;

function sample(timestamp: number): void {
  if (sampleStart === undefined) {
    sampleStart = timestamp;
  } else {
    frameCount += 1;
    const elapsed = timestamp - sampleStart;
    if (elapsed >= sampleInterval) {
      fps.value = Math.round((frameCount * 1000) / elapsed);
      sampleStart = timestamp;
      frameCount = 0;
    }
  }
  animationFrame = window.requestAnimationFrame(sample);
}

function stopSampling(): void {
  if (animationFrame !== undefined) {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
  }
  sampleStart = undefined;
  frameCount = 0;
  fps.value = null;
}

function syncVisibility(): void {
  stopSampling();
  if (!document.hidden) {
    animationFrame = window.requestAnimationFrame(sample);
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', syncVisibility);
  stopSampling();
});
</script>

<template>
  <span data-playground-fps aria-live="off" class="playground-shell__fps text-code text-secondary">
    <span>FPS</span>
    <span class="playground-shell__fps-value">{{ fps ?? '—' }}</span>
  </span>
</template>
