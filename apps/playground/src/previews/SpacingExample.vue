<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { primitiveSpacingTokens, semanticSpacingTokens } from '../lab-data';
import { type Locale, localize } from '../playground-content';

const props = defineProps<{ locale: Locale; kind: 'scale' | 'usage' }>();
const scale = ref<HTMLDListElement | null>(null);
const lengths = reactive<Record<string, string>>({});
const formatLength = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
let observer: ResizeObserver | undefined;

onMounted(() => {
  if (!scale.value) return;
  observer = new ResizeObserver((entries) => {
    for (const { target, contentRect } of entries) {
      const step = target.getAttribute('data-spacing-mark');
      if (step !== null) lengths[step] = `${formatLength.format(contentRect.width)}px`;
    }
  });
  for (const mark of scale.value.querySelectorAll('[data-spacing-mark]')) observer.observe(mark);
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <dl v-if="props.kind === 'scale'" ref="scale" class="spacing-scale">
    <div
      v-for="{ step, variable } in primitiveSpacingTokens"
      :key="variable"
      class="spacing-scale__row border-b border-subtle last:border-b-0"
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
  <div v-else class="playground-preview-columns" data-spacing-usage>
    <figure
      v-for="token in semanticSpacingTokens"
      :key="token.variable"
      class="grid min-w-0 content-start gap-2"
    >
      <div
        class="spacing-usage flex items-stretch rounded-control border border-subtle"
        :class="token.className"
        :data-spacing-placement="token.placement"
        aria-hidden="true"
      >
        <span class="spacing-usage__item rounded-control" />
        <span v-if="token.placement === 'gap'" class="spacing-usage__item rounded-control" />
      </div>
      <figcaption class="grid min-w-0 gap-1">
        <span class="text-label font-label text-primary">{{
          localize(token.label, props.locale)
        }}</span>
        <code class="break-all text-code text-secondary">{{ token.className }}</code>
        <code class="break-all text-code text-muted">{{ token.variable }}</code>
      </figcaption>
    </figure>
  </div>
</template>

<style scoped>
.spacing-scale {
  overflow-x: auto;
}

.spacing-scale__row {
  display: grid;
  grid-template-columns: 9ch minmax(var(--neoverse-space-32), 1fr) 7ch;
  align-items: center;
  column-gap: var(--neoverse-space-2);
  min-inline-size: max-content;
  padding-block: var(--neoverse-space-1);
  font-variant-numeric: tabular-nums;
}

.spacing-scale__row > dd:last-child {
  text-align: end;
}

.spacing-scale__track {
  box-shadow: -1px 0 var(--neoverse-color-border-strong);
  background: repeating-linear-gradient(
    to right,
    transparent 0 calc(var(--neoverse-space-4) - 1px),
    var(--neoverse-color-border-subtle) calc(var(--neoverse-space-4) - 1px) var(--neoverse-space-4)
  );
}

.spacing-scale__mark {
  display: block;
  block-size: var(--neoverse-space-2);
  background: var(--neoverse-color-accent-primary);
}

.spacing-usage {
  min-block-size: var(--neoverse-space-13);
  background: var(--neoverse-color-accent-soft);
}

.spacing-usage__item {
  flex: 1 1 0;
  min-block-size: var(--neoverse-space-7);
  border: 1px solid var(--neoverse-color-border-default);
  background: var(--neoverse-color-surface-raised);
}
</style>
