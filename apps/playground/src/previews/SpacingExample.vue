<script setup lang="ts">
import { UiAvatar, UiBadge, UiButton, UiSegmentedControl } from '@neoverse-ui/vue';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { primitiveSpacingTokens, semanticSpacingTokens } from '../lab-data';
import { type Locale, localize, localized } from '../playground-content';

const props = defineProps<{ locale: Locale; kind: 'scale' | 'usage' }>();

const scale = ref<HTMLDListElement | null>(null);
const lengths = reactive<Record<string, string>>({});
const formatLength = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
let scaleObserver: ResizeObserver | undefined;

const copy = {
  inspect: localized('Inspect', '检视'),
  preview: localized('Preview', '预览'),
  modeLabel: localized('Layout spacing display', '布局间距显示'),
  tokensLabel: localized('Spacing tokens', '间距令牌'),
  hint: localized(
    'Inspect paints the gutters and gaps around real content; Preview keeps the composition without the tint.',
    '检视模式在真实内容周围标出内边距与网格间隔；预览模式保留同一构图但不加底色。',
  ),
  brand: localized('Northwind', 'Northwind'),
  status: localized('Stable', '稳定'),
  title: localized('Release overview', '版本概览'),
  description: localized(
    'A real card is placed by the page gutters, and its tiles are separated by the grid gap token.',
    '真实卡片由页面内边距定位，卡片内的小块由网格间隔令牌分隔。',
  ),
  action: localized('Publish', '发布'),
  meta: localized('Updated 2 minutes ago', '2 分钟前更新'),
  note: localized(
    'Resize the window to watch the gutters re-clamp. Select a token above to isolate the region it controls.',
    '调整窗口宽度可观察内边距重新收敛。选择上方令牌，可单独标出它控制的区域。',
  ),
  stats: [
    { label: localized('Sessions', '会话'), value: '12.4k' },
    { label: localized('Builds', '构建'), value: '248' },
    { label: localized('Latency', '延迟'), value: '42ms' },
  ],
} as const;

const mode = ref('inspect');
const focus = ref<'inline' | 'block' | 'gap' | null>(null);
const measured = reactive<Record<'inline' | 'block' | 'gap', string>>({
  inline: '—',
  block: '—',
  gap: '—',
});
const gutterLayer = ref<HTMLElement | null>(null);
const demoGrid = ref<HTMLElement | null>(null);
let layoutObserver: ResizeObserver | undefined;
const modeOptions = computed(() => [
  { value: 'inspect', label: localize(copy.inspect, props.locale) },
  { value: 'preview', label: localize(copy.preview, props.locale) },
]);

function measureLayout(): void {
  const layer = gutterLayer.value;
  if (layer !== null) {
    const style = getComputedStyle(layer);
    measured.inline = `${Math.round(Number.parseFloat(style.paddingInlineStart))}px`;
    measured.block = `${Math.round(Number.parseFloat(style.paddingBlockStart))}px`;
  }
  const grid = demoGrid.value;
  if (grid !== null) {
    measured.gap = `${Math.round(Number.parseFloat(getComputedStyle(grid).columnGap))}px`;
  }
}

function focusToken(placement: 'inline' | 'block' | 'gap'): void {
  mode.value = 'inspect';
  focus.value = focus.value === placement ? null : placement;
}

function setupScaleObserver(): void {
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
}

onMounted(() => {
  if (props.kind === 'scale') {
    setupScaleObserver();
    return;
  }
  requestAnimationFrame(measureLayout);
  window.addEventListener('resize', measureLayout);
  if (typeof ResizeObserver !== 'undefined' && gutterLayer.value !== null) {
    layoutObserver = new ResizeObserver(measureLayout);
    layoutObserver.observe(gutterLayer.value);
  }
});

onBeforeUnmount(() => {
  scaleObserver?.disconnect();
  layoutObserver?.disconnect();
  window.removeEventListener('resize', measureLayout);
});
</script>

<template>
  <dl v-if="props.kind === 'scale'" ref="scale" class="spacing-scale">
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

  <div v-else class="spacing-layout" data-spacing-usage>
    <div class="spacing-layout__bar">
      <UiSegmentedControl
        v-model="mode"
        :options="modeOptions"
        :aria-label="localize(copy.modeLabel, props.locale)"
        surface="none"
      />
      <p class="spacing-layout__hint">{{ localize(copy.hint, props.locale) }}</p>
    </div>

    <fieldset class="spacing-layout__chips">
      <legend class="sr-only">{{ localize(copy.tokensLabel, props.locale) }}</legend>
      <button
        v-for="token in semanticSpacingTokens"
        :key="token.variable"
        type="button"
        class="spacing-chip"
        :aria-pressed="focus === token.placement"
        :data-spacing-placement="token.placement"
        @click="focusToken(token.placement)"
      >
        <span class="spacing-chip__label">{{ localize(token.label, props.locale) }}</span>
        <span class="spacing-chip__value">{{ measured[token.placement] }}</span>
        <code class="spacing-chip__class">{{ token.className }}</code>
        <code class="spacing-chip__variable">{{ token.variable }}</code>
      </button>
    </fieldset>

    <div class="spacing-demo" :data-mode="mode" :data-focus="focus ?? undefined">
      <div ref="gutterLayer" class="spacing-demo__gutter-layer">
        <div class="spacing-demo__page">
          <header class="spacing-demo__header">
            <div class="spacing-demo__brand">
              <span class="spacing-demo__mark" aria-hidden="true" />
              <span class="text-label font-label text-primary">{{
                localize(copy.brand, props.locale)
              }}</span>
            </div>
            <UiBadge variant="success">{{ localize(copy.status, props.locale) }}</UiBadge>
          </header>

          <div class="spacing-demo__body">
            <h4 class="text-title-sm font-title text-primary">
              {{ localize(copy.title, props.locale) }}
            </h4>
            <p class="text-body-sm text-secondary">
              {{ localize(copy.description, props.locale) }}
            </p>
          </div>

          <div ref="demoGrid" class="spacing-demo__grid">
            <article v-for="stat in copy.stats" :key="stat.label.en" class="spacing-demo__tile">
              <span class="text-caption text-muted">{{ localize(stat.label, props.locale) }}</span>
              <strong class="text-title-sm font-title text-primary">{{ stat.value }}</strong>
            </article>
          </div>

          <footer class="spacing-demo__footer">
            <div class="spacing-demo__meta">
              <UiAvatar name="Nova Release" size="sm" />
              <span class="text-caption text-secondary">{{
                localize(copy.meta, props.locale)
              }}</span>
            </div>
            <UiButton size="sm">{{ localize(copy.action, props.locale) }}</UiButton>
          </footer>
        </div>
      </div>
    </div>

    <p class="spacing-layout__note">{{ localize(copy.note, props.locale) }}</p>
  </div>
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

.spacing-layout {
  display: grid;
  gap: var(--neoverse-space-3);
}

.spacing-layout__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--neoverse-space-2) var(--neoverse-space-4);
}

.spacing-layout__hint {
  max-inline-size: 58ch;
  color: var(--neoverse-color-text-secondary);
  font-size: var(--neoverse-typography-caption-size);
  line-height: var(--neoverse-typography-caption-line-height);
}

.spacing-layout__note {
  max-inline-size: var(--neoverse-layout-reading-width);
  color: var(--neoverse-color-text-secondary);
  font-size: var(--neoverse-typography-caption-size);
  line-height: var(--neoverse-typography-caption-line-height);
}

.spacing-layout__chips {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  gap: var(--neoverse-space-2);
  padding: 0;
  border: 0;
  margin: 0;
}

.spacing-chip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  column-gap: var(--neoverse-space-2);
  row-gap: var(--neoverse-space-1);
  padding: var(--neoverse-space-2) var(--neoverse-space-3);
  border: var(--neoverse-border-width-thin) solid var(--neoverse-color-border-subtle);
  border-radius: var(--neoverse-radius-control);
  background: var(--neoverse-color-surface-subtle);
  text-align: start;
  cursor: pointer;
  transition:
    border-color var(--neoverse-motion-feedback-duration) var(--neoverse-motion-feedback-easing),
    background-color var(--neoverse-motion-feedback-duration) var(--neoverse-motion-feedback-easing);
}

.spacing-chip:hover {
  border-color: var(--neoverse-color-border-default);
}

.spacing-chip:focus-visible {
  outline: var(--neoverse-focus-ring-width) solid var(--neoverse-color-focus-ring);
  outline-offset: var(--neoverse-focus-ring-offset);
}

.spacing-chip[aria-pressed='true'] {
  border-color: var(--neoverse-color-accent-primary);
  background: var(--neoverse-color-accent-soft);
}

.spacing-chip__label {
  overflow: hidden;
  color: var(--neoverse-color-text-primary);
  font-size: var(--neoverse-typography-label-sm-size);
  font-weight: var(--neoverse-font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spacing-chip__value {
  color: var(--neoverse-color-accent-primary);
  font-family: var(--neoverse-typography-code-font-family);
  font-size: var(--neoverse-typography-code-size);
  font-variant-numeric: tabular-nums;
}

.spacing-chip__class,
.spacing-chip__variable {
  grid-column: 1 / -1;
  color: var(--neoverse-color-text-secondary);
  font-size: var(--neoverse-typography-code-size);
  overflow-wrap: anywhere;
  white-space: normal;
}

.spacing-chip__variable {
  color: var(--neoverse-color-text-muted);
}

.spacing-demo {
  overflow: hidden;
  border: var(--neoverse-border-width-thin) solid var(--neoverse-color-border-subtle);
  border-radius: var(--neoverse-radius-panel);
  background: var(--neoverse-color-surface-subtle);
}

.spacing-demo__gutter-layer {
  position: relative;
  padding-inline: var(--neoverse-layout-gutter-inline);
  padding-block: var(--neoverse-layout-gutter-block);
  background: color-mix(in srgb, var(--neoverse-color-accent-primary) 6%, transparent);
  transition: background-color var(--neoverse-motion-state-duration)
    var(--neoverse-motion-state-easing);
}

.spacing-demo[data-mode='preview'] .spacing-demo__gutter-layer {
  background: transparent;
}

/* The focused token paints only its own bands over the quiet tint, so the
   live readout and the geometry it describes stay visually connected. */
.spacing-demo__gutter-layer::before {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--neoverse-motion-feedback-duration)
    var(--neoverse-motion-feedback-easing);
}

.spacing-demo[data-mode='inspect'][data-focus='inline'] .spacing-demo__gutter-layer::before {
  background: linear-gradient(
    to right,
    var(--neoverse-color-accent-soft) 0 var(--neoverse-layout-gutter-inline),
    transparent var(--neoverse-layout-gutter-inline)
      calc(100% - var(--neoverse-layout-gutter-inline)),
    var(--neoverse-color-accent-soft) calc(100% - var(--neoverse-layout-gutter-inline)) 100%
  );
  opacity: 1;
}

.spacing-demo[data-mode='inspect'][data-focus='block'] .spacing-demo__gutter-layer::before {
  background: linear-gradient(
    to bottom,
    var(--neoverse-color-accent-soft) 0 var(--neoverse-layout-gutter-block),
    transparent var(--neoverse-layout-gutter-block) calc(100% - var(--neoverse-layout-gutter-block)),
    var(--neoverse-color-accent-soft) calc(100% - var(--neoverse-layout-gutter-block)) 100%
  );
  opacity: 1;
}

.spacing-demo__page {
  position: relative;
  display: grid;
  gap: var(--neoverse-space-4);
  padding: var(--neoverse-space-4);
  border: var(--neoverse-border-width-thin) solid var(--neoverse-color-border-subtle);
  border-radius: var(--neoverse-radius-control);
  background: var(--neoverse-color-surface-raised);
  box-shadow: var(--neoverse-shadow-raised);
}

.spacing-demo__header,
.spacing-demo__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--neoverse-space-2);
}

.spacing-demo__brand,
.spacing-demo__meta {
  display: flex;
  align-items: center;
  gap: var(--neoverse-space-2);
  min-inline-size: 0;
}

.spacing-demo__mark {
  display: block;
  inline-size: var(--neoverse-space-4);
  block-size: var(--neoverse-space-4);
  border-radius: var(--neoverse-radius-xs);
  background: linear-gradient(
    135deg,
    var(--neoverse-color-accent-primary),
    var(--neoverse-color-accent-secondary)
  );
}

.spacing-demo__body {
  display: grid;
  gap: var(--neoverse-space-1);
}

.spacing-demo__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 7rem), 1fr));
  gap: var(--neoverse-layout-grid-gap);
  border-radius: var(--neoverse-radius-control-inner);
  background: var(--neoverse-color-accent-soft);
  transition: background var(--neoverse-motion-state-duration) var(--neoverse-motion-state-easing);
}

.spacing-demo[data-mode='preview'] .spacing-demo__grid {
  background: transparent;
}

.spacing-demo[data-mode='inspect'][data-focus='gap'] .spacing-demo__grid {
  background: color-mix(in srgb, var(--neoverse-color-accent-primary) 26%, transparent);
}

.spacing-demo__tile {
  display: grid;
  gap: var(--neoverse-space-1);
  padding: var(--neoverse-space-3);
  border: var(--neoverse-border-width-thin) solid var(--neoverse-color-border-subtle);
  border-radius: var(--neoverse-radius-control);
  background: var(--neoverse-color-surface-subtle);
}

@media (prefers-reduced-motion: reduce) {
  .spacing-scale__row,
  .spacing-chip,
  .spacing-demo__gutter-layer,
  .spacing-demo__grid,
  .spacing-demo__gutter-layer::before {
    transition: none;
  }
}
</style>
