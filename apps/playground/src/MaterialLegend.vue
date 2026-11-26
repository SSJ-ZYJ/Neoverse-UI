<script setup lang="ts">
import { glassMaterial } from '@neoverse-ui/tokens';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Locale } from './playground-content';

const props = defineProps<{ locale: Locale }>();
const host = ref<HTMLElement>();
const samples = ref<{ id: number; text: string }[]>([]);
let observer: MutationObserver | undefined;
let frame = 0;
let timer: number | undefined;
let lastRefresh = 0;
const minRefreshInterval = 200;
// Overlay positioning writes these inline styles on every tracked frame. They
// do not change any material value, so they must not restart a full style scan.
const locationOnlySelector =
  '[data-overlay-panel], .ui-overlay-panel, .ui-select__popover, [data-neoverse-glass-renderer], canvas';
const glassTierProperty = '--neoverse-glass-tier';
const surfaceSelector = '[class*="material-role-"], [class*="material-glass-"]';
const tiers = {
  'glass-subtle': { name: glassMaterial.tiers.subtle, blur: '12px', alpha: 0.15 },
  'glass-elevated': { name: glassMaterial.tiers.elevated, blur: '18px', alpha: 0.2 },
  'glass-immersive': { name: glassMaterial.tiers.immersive, blur: '24px', alpha: 0.3 },
} as const;
const tierKeys = Object.keys(tiers) as (keyof typeof tiers)[];

function glassTier(element: Element, style = getComputedStyle(element)): keyof typeof tiers | null {
  const resolved = `glass-${style.getPropertyValue(glassTierProperty).trim()}`;
  if (resolved in tiers) return resolved as keyof typeof tiers;
  for (const tier of tierKeys) {
    if (element.classList.contains(`material-${tier}`)) return tier;
  }
  return null;
}

function hasGlassAncestor(element: Element): boolean {
  let ancestor = element.parentElement?.closest(surfaceSelector);
  while (ancestor) {
    if (glassTier(ancestor)) return true;
    ancestor = ancestor.parentElement?.closest(surfaceSelector);
  }
  return false;
}

function refresh() {
  const region = host.value?.parentElement;
  if (!region) return;
  const result: { id: number; text: string }[] = [];
  const elements = region.querySelectorAll<HTMLElement>(
    `${surfaceSelector}, [data-surface], .ui-input, .ui-textarea, .ui-select, .ui-disclosure, .ui-table, .ui-badge, .ui-notice, .ui-skeleton, .ui-overlay-panel, .ui-select__popover, .ui-choice__control, .ui-status-indicator, .ui-scrollbar, .neoverse-prose table, .neoverse-prose details, .neoverse-prose blockquote, .neoverse-prose pre, .neoverse-prose kbd`,
  );
  for (const element of elements) {
    if (element.closest('[data-material-legend]')) continue;
    if (element.getAttribute('aria-hidden') === 'true') continue;
    // Tables own a grid of cell planes rather than a plate underneath them.
    const plane = element.matches('.ui-table, .neoverse-prose table')
      ? (element.querySelector('td, th') ?? element)
      : element;
    const elementStyle = getComputedStyle(element);
    const surfaceStyle = plane === element ? elementStyle : getComputedStyle(plane);
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
    const surface = element.dataset.surface ?? 'auto';
    const scopeMaterial = elementStyle.getPropertyValue('--neoverse-scope-material').trim();
    const tier = glassTier(element, elementStyle);
    const isFrosted =
      !tier &&
      (element.classList.contains('material-frosted') ||
        (surface === 'auto' && scopeMaterial === 'frosted'));
    const isSolid =
      !tier &&
      !isFrosted &&
      (surface === 'solid' || (surface === 'auto' && scopeMaterial === 'solid'));
    const borrowsGlass = element.dataset.neoverseGlassNesting === 'inherit';
    const none = surface === 'none' || element.classList.contains('ui-button--ghost');
    const hasGlassParent = (borrowsGlass || none) && hasGlassAncestor(element);
    const inherited = borrowsGlass && hasGlassParent;
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
          ? `共享语义效果（不独立采样${glassMaterial.name.zh}）`
          : `Shared semantic effect (no independent ${glassMaterial.name.en} sampling)`;
    } else if (isFrosted) {
      const filter = style.backdropFilter;
      const blur = filter.match(/blur\(([^)]+)\)/)?.[1] ?? '0px';
      const alpha = Number(
        style.backgroundColor.match(/\/\s*([\d.]+)\s*\)/)?.[1] ??
          style.backgroundColor.match(/rgba\([^)]*,\s*([\d.]+)\)/)?.[1] ??
          1,
      );
      const fallback = filter === 'none' && alpha >= 0.99;
      const nested = filter === 'none' && !fallback;
      detail =
        props.locale === 'zh'
          ? `磨砂 · ${blur} / ${Math.round(alpha * 100)}%${fallback ? ' · 不透明回退' : nested ? ' · 嵌套不重复模糊' : ''}`
          : `Frosted · ${blur} / ${Math.round(alpha * 100)}%${fallback ? ' · Opaque fallback' : nested ? ' · Nested (no double blur)' : ''}`;
    } else if (isSolid) {
      detail = props.locale === 'zh' ? '实体 · 不透明表面' : 'Solid · Opaque surface';
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
      detail = `${element.matches('.ui-notice') ? (props.locale === 'zh' ? '语义状态色 · ' : 'Semantic status tint · ') : ''}${glassMaterial.name[props.locale]} · ${preset.name[props.locale]} · ${tier} · ${blur} / ${Math.round(alpha * 100)}%${fallback ? (props.locale === 'zh' ? ' · 不透明回退' : ' · Opaque fallback') : custom ? (props.locale === 'zh' ? ' · 自定义' : ' · Custom') : ''}`;
    } else {
      detail = `${surface} · ${props.locale === 'zh' ? '语义表面' : 'Semantic surface'}`;
    }
    result.push({ id: result.length, text: `${result.length + 1}. ${name} — ${detail}` });
  }
  if (JSON.stringify(result) !== JSON.stringify(samples.value)) samples.value = result;
}

function schedule() {
  // A full scan resolves computed style for every surface in the specimen.
  // Coalesce the mutation burst that an open overlay produces each frame, or
  // WebKit never gets an idle frame and Playwright cannot see a stable element.
  if (frame !== 0 || timer !== undefined) return;
  const delay = Math.max(0, minRefreshInterval - (performance.now() - lastRefresh));
  timer = window.setTimeout(() => {
    timer = undefined;
    frame = requestAnimationFrame(() => {
      frame = 0;
      lastRefresh = performance.now();
      refresh();
    });
  }, delay);
}

onMounted(() => {
  observer = new MutationObserver((records) => {
    const materialChange = records.some((record) => {
      if (host.value?.contains(record.target)) return false;
      if (record.type === 'attributes' && record.attributeName === 'style') {
        const target = record.target;
        if (target instanceof Element && target.closest(locationOnlySelector)) return false;
      }
      return true;
    });
    if (materialChange) schedule();
  });
  if (host.value?.parentElement)
    observer.observe(host.value.parentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-surface', 'data-neoverse-material', 'open'],
    });
  for (
    let ancestor = host.value?.parentElement?.parentElement;
    ancestor;
    ancestor = ancestor.parentElement
  ) {
    observer.observe(ancestor, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme', 'data-neoverse-material', 'lang'],
    });
  }
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-neoverse-material', 'lang', 'style', 'class'],
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
  if (timer !== undefined) window.clearTimeout(timer);
  window.removeEventListener('pointerup', schedule);
  window.removeEventListener('keyup', schedule);
});
</script>

<template>
  <aside ref="host" data-material-legend class="grid gap-1 text-caption text-muted">
    <p v-if="!samples.length">
      {{
        props.locale === 'zh'
          ? '无独立材质表面；使用共享语义效果。'
          : 'No independent material plate; shared semantic effects.'
      }}
    </p>
    <p v-for="sample in samples" :key="sample.id">{{ sample.text }}</p>
  </aside>
</template>
