<script setup lang="ts">
import type { Locale } from './playground-content';
import { localize, localized } from './playground-content';

interface QaPreviewMatrixProps {
  locale: Locale;
}

const props = defineProps<QaPreviewMatrixProps>();
const contexts = [
  {
    id: 'gradient',
    label: localized('Gradient backdrop', '渐变背景'),
    hint: localized('Checks refraction, tint, and edge separation.', '检查折射、色调与边缘层级。'),
  },
  {
    id: 'neutral',
    label: localized('Neutral backdrop', '中性背景'),
    hint: localized(
      'Checks silhouette and hierarchy without color assistance.',
      '在无额外色彩辅助下检查轮廓与层级。',
    ),
  },
  {
    id: 'reduced',
    label: localized('Reduced transparency', '降低透明度'),
    hint: localized('Checks the accessible opaque fallback.', '检查无障碍不透明回退表现。'),
  },
] as const;
</script>

<template>
  <div class="playground-qa-matrix" data-qa-matrix>
    <article
      v-for="context in contexts"
      :key="context.id"
      class="playground-qa-cell"
      :data-qa-context="context.id"
    >
      <header class="playground-qa-cell__header">
        <h4 class="text-label-sm font-label text-primary">
          {{ localize(context.label, props.locale) }}
        </h4>
        <p class="text-caption text-secondary">
          {{ localize(context.hint, props.locale) }}
        </p>
      </header>
      <div
        class="playground-qa-stage scrollbar-immersive"
        :class="[
          `playground-qa-stage--${context.id}`,
          context.id === 'reduced' ? 'playground-reduced-transparency-preview' : '',
        ]"
        :data-qa-stage="context.id"
      >
        <div class="playground-qa-stage__content">
          <slot :context="context.id" />
        </div>
      </div>
    </article>
  </div>
</template>
