<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { primitiveSpacingTokens } from '../lab-data';

const scale = ref<HTMLDListElement | null>(null);
const lengths = reactive<Record<string, string>>({});
const formatLength = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
let scaleObserver: ResizeObserver | undefined;

onMounted(() => {
  if (scale.value === null) return;
  scaleObserver = new ResizeObserver((entries) => {
    for (const { target, contentRect } of entries) {
      const step = target.getAttribute('data-spacing-mark');
      if (step !== null) lengths[step] = `${formatLength.format(contentRect.width)}px`;
    }
  });
  for (const mark of scale.value.querySelectorAll('[data-spacing-mark]')) {
    scaleObserver.observe(mark);
  }
});

onBeforeUnmount(() => {
  scaleObserver?.disconnect();
});
</script>

<template>
  <dl ref="scale" class="spacing-scale">
    <div
      v-for="{ step, variable } in primitiveSpacingTokens"
      :key="variable"
      class="spacing-scale__row"
      data-token-preview="space"
    >
      <dt><code class="text-code text-primary" :title="variable">space-{{ step }}</code></dt>
      <dd class="spacing-scale__track" aria-hidden="true">
        <span
          class="spacing-scale__mark"
          :data-spacing-mark="step"
          :style="{ inlineSize: `var(${variable})` }"
        />
      </dd>
      <dd class="text-code text-secondary">{{ lengths[step] }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.spacing-scale {
  overflow-x: auto;
  padding: var(--neoverse-space-2) var(--neoverse-space-3);
  border: var(--neoverse-border-width-thin) solid var(--neoverse-color-border-subtle);
  border-radius: var(--neoverse-radius-panel);
  /* The scale judges one dimension at a time. An opaque canvas keeps the
     optical stage's dot matrix and glows entirely outside the ruler. */
  background: var(--neoverse-color-surface-canvas);
}

.spacing-scale__row {
  display: grid;
  grid-template-columns: 9ch minmax(var(--neoverse-space-32), 1fr) 7ch;
  align-items: center;
  column-gap: var(--neoverse-space-2);
  min-inline-size: max-content;
  padding-block: var(--neoverse-space-1);
  border-radius: var(--neoverse-radius-xs);
  font-variant-numeric: tabular-nums;
  transition: background-color var(--neoverse-motion-feedback-duration)
    var(--neoverse-motion-feedback-easing);
}

.spacing-scale__row:hover {
  background: color-mix(in srgb, var(--neoverse-color-accent-primary) 6%, transparent);
}

.spacing-scale__row > dd:last-child {
  text-align: end;
}

/* A single baseline and start edge replace the dense tick pattern: the bar
   length stays comparable without printing a second texture next to the
   page's own optical field. */
.spacing-scale__track {
  display: flex;
  align-items: flex-end;
  block-size: var(--neoverse-space-4);
  border-inline-start: var(--neoverse-border-width-thin) solid var(--neoverse-color-border-strong);
  background:
    linear-gradient(var(--neoverse-color-border-subtle), var(--neoverse-color-border-subtle)) left
    bottom / 100% var(--neoverse-border-width-thin) no-repeat;
}

.spacing-scale__mark {
  display: block;
  block-size: var(--neoverse-space-2);
  border-radius: var(--neoverse-radius-pill);
  background: var(--neoverse-color-accent-primary);
}

@media (prefers-reduced-motion: reduce) {
  .spacing-scale__row {
    transition: none;
  }
}
</style>
