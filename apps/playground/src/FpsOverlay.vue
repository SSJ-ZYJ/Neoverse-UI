<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
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
  <Teleport to="body">
    <UiSurface
      data-playground-fps
      aria-live="off"
      surface="glass-elevated"
      class="pointer-events-none fixed left-2 top-2 z-layer-toast min-w-20 rounded-control px-2 py-1 font-mono text-caption text-primary tabular-nums"
    >
      {{ fps ?? '—' }}
      FPS
    </UiSurface>
  </Teleport>
</template>
