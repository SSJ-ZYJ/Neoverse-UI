<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Locale } from './playground-content';

const props = defineProps<{ locale: Locale }>();
const host = ref<HTMLElement>();
const samples = ref<{ id: number; text: string }[]>([]);
let observer: MutationObserver | undefined;
let frame = 0;
const tiers = {
  'glass-subtle': { zh: '轻薄', en: 'Light', blur: '12px', alpha: 0.15 },
  'glass-elevated': { zh: '标准', en: 'Standard', blur: '18px', alpha: 0.2 },
  'glass-immersive': { zh: '厚实', en: 'Immersive', blur: '24px', alpha: 0.3 },
} as const;

function refresh() {
  const region = host.value?.parentElement;
  if (!region) return;
  const result: { id: number; text: string }[] = [];
  const elements = region.querySelectorAll<HTMLElement>(
    '[data-surface], .ui-input, .ui-textarea, .ui-select, .ui-disclosure, .ui-table, .ui-badge, .ui-notice, .ui-skeleton, .ui-overlay-panel, .ui-select__popover, .ui-choice__control, .ui-status-indicator, .ui-scrollbar, .neoverse-prose table, .neoverse-prose details, .neoverse-prose blockquote, .neoverse-prose pre, .neoverse-prose kbd',
  );
  for (const element of elements) {
    if (element.closest('[data-material-legend]')) continue;
    if (element.getAttribute('aria-hidden') === 'true') continue;
    // Tables own a grid of cell planes rather than a plate underneath them.
    const plane = element.matches('.ui-table, .neoverse-prose table')
      ? (element.querySelector('td, th') ?? element)
      : element;
    const surfaceStyle = getComputedStyle(plane);
    if (surfaceStyle.display === 'none') continue;
    // Tooltip's rounded body and pointer share a sampled pseudo-element.
    const tooltipPlate = element.matches('.ui-tooltip-surface')
      ? getComputedStyle(element, '::before')
      : null;
    const style = tooltipPlate?.clipPath.startsWith('shape(') ? tooltipPlate : surfaceStyle;
    const name =
      element.getAttribute('aria-label') ||
      element.textContent?.trim().slice(0, 32) ||
      element.tagName.toLowerCase();
    const surface =
      element.dataset.surface ??
      Object.keys(tiers).find((tier) => element.classList.contains(`material-${tier}`));
    const hasGlassParent = Boolean(
      element.parentElement?.closest(
        '.material-glass-subtle, .material-glass-elevated, .material-glass-immersive',
      ),
    );
    const inherited = element.dataset.neoverseGlassNesting === 'inherit' && hasGlassParent;
    const none = surface === 'none' || element.classList.contains('ui-button--ghost');
    const tier =
      surface && surface in tiers
        ? (surface as keyof typeof tiers)
        : !surface
          ? 'glass-subtle'
          : null;
    let detail: string;
    if (inherited || none) {
      detail =
        props.locale === 'zh'
          ? inherited || (none && hasGlassParent)
            ? '继承父级；无独立表面'
            : '无表面'
          : inherited || (none && hasGlassParent)
            ? 'Inherited; no local plate'
            : 'No surface';
    } else if (element.matches('.ui-badge')) {
      const blur = style.backdropFilter.match(/blur\(([^)]+)\)/)?.[1];
      detail =
        props.locale === 'zh'
          ? `语义色背景 · ${blur ? `${blur} 模糊` : '无背景模糊'}`
          : `Semantic tint · ${blur ? `${blur} blur` : 'No backdrop blur'}`;
    } else if (element.matches('.ui-status-indicator, .ui-scrollbar')) {
      detail =
        props.locale === 'zh'
          ? '共享语义效果（不独立采样玻璃）'
          : 'Shared semantic effect (no independent Glass sampling)';
    } else if (tier) {
      const preset = tiers[tier];
      const filter = style.backdropFilter;
      const nativeId = plane.getAttribute('data-neoverse-glass-native-filter');
      const nativeBlur = nativeId
        ? document
            .getElementById(nativeId)
            ?.querySelector('feGaussianBlur')
            ?.getAttribute('stdDeviation')
        : null;
      const blur = filter.match(/blur\(([^)]+)\)/)?.[1] ?? (nativeBlur ? `${nativeBlur}px` : '0px');
      // CSSOM may serialize alpha in rgb(), color() or oklab().
      const alpha = Number(
        style.backgroundColor.match(/\/\s*([\d.]+)\s*\)/)?.[1] ??
          style.backgroundColor.match(/rgba\([^)]*,\s*([\d.]+)\)/)?.[1] ??
          1,
      );
      const fallback = filter === 'none' && alpha >= 0.99;
      const blurScale = element.matches('.ui-button')
        ? Number(style.getPropertyValue('--neoverse-control-button-blur-scale').trim() || '1')
        : 1;
      const expectedBlur = `${parseFloat(preset.blur) * blurScale}px`;
      const custom = !fallback && (blur !== expectedBlur || Math.abs(alpha - preset.alpha) > 0.005);
      detail = `${element.matches('.ui-notice') ? (props.locale === 'zh' ? '语义状态色 · ' : 'Semantic status tint · ') : ''}${props.locale === 'zh' ? preset.zh : preset.en} · ${tier} · ${blur} / ${Math.round(alpha * 100)}%${fallback ? (props.locale === 'zh' ? ' · 不透明回退' : ' · Opaque fallback') : custom ? (props.locale === 'zh' ? ' · 自定义' : ' · Custom') : ''}`;
    } else {
      detail = `${surface} · ${props.locale === 'zh' ? '语义表面' : 'Semantic surface'}`;
    }
    result.push({ id: result.length, text: `${result.length + 1}. ${name} — ${detail}` });
  }
  if (JSON.stringify(result) !== JSON.stringify(samples.value)) samples.value = result;
}

function schedule() {
  if (frame !== 0) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    refresh();
  });
}

onMounted(() => {
  observer = new MutationObserver((records) => {
    if (records.some((record) => !host.value?.contains(record.target))) schedule();
  });
  if (host.value?.parentElement)
    observer.observe(host.value.parentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-surface', 'open'],
    });
  for (
    let ancestor = host.value?.parentElement?.parentElement;
    ancestor;
    ancestor = ancestor.parentElement
  ) {
    observer.observe(ancestor, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme', 'lang'],
    });
  }
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'lang', 'style', 'class'],
  });
  host.value?.parentElement?.addEventListener('transitionend', schedule);
  schedule();
  window.addEventListener('pointerup', schedule);
  window.addEventListener('keyup', schedule);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  host.value?.parentElement?.removeEventListener('transitionend', schedule);
  cancelAnimationFrame(frame);
  window.removeEventListener('pointerup', schedule);
  window.removeEventListener('keyup', schedule);
});
</script>

<template>
  <aside ref="host" data-material-legend class="grid gap-1 text-caption text-muted">
    <p v-if="!samples.length">
      {{ props.locale === 'zh' ? '无独立材质表面；使用共享语义效果。' : 'No independent material plate; shared semantic effects.' }}
    </p>
    <p v-for="sample in samples" :key="sample.id">{{ sample.text }}</p>
  </aside>
</template>
