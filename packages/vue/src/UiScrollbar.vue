<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue';
import type { ScrollbarProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ScrollbarProps>(), {
  autoHideMs: 1200,
  minThumbRatio: 0.1,
  hideNative: true,
});

const attrs = useAttrs();
const trackElement = ref<HTMLElement | null>(null);
const thumbElement = ref<HTMLElement | null>(null);
const isVisible = ref(false);
const hasScrollableContent = ref(false);
const progress = ref(0);
const thumbLengthRatio = ref(1);
const dragging = ref(false);
const dragOffset = ref(0);

let scrollElement: HTMLElement | null = null;
let hideTimer: number | undefined;
let refreshTimer: number | undefined;
let mutationFrame: number | undefined;
let layoutObserver: ResizeObserver | undefined;
let contentObserver: MutationObserver | undefined;
let refreshNeedsReveal = false;
let previousScrollBehavior: string | undefined;

const normalizedAutoHideMs = computed(() => {
  const value = Number(props.autoHideMs);
  return Number.isFinite(value) ? Math.max(0, value) : 1200;
});
const normalizedMinThumbRatio = computed(() => {
  const value = Number(props.minThumbRatio);
  return Number.isFinite(value) ? Math.min(1, Math.max(0.05, value)) : 0.1;
});
const classes = computed(() => ['ui-scrollbar', { 'ui-scrollbar--dragging': dragging.value }]);
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
const scrollbarStyle = computed(() => ({
  opacity: isVisible.value && hasScrollableContent.value ? 1 : 0,
  pointerEvents:
    isVisible.value && hasScrollableContent.value ? ('auto' as const) : ('none' as const),
}));
const thumbStyle = computed(() => ({
  height: `${String(thumbLengthRatio.value * 100)}%`,
  top: `${String(progress.value * (100 - thumbLengthRatio.value * 100))}%`,
}));

function resolveScrollElement() {
  return (document.scrollingElement ?? document.documentElement) as HTMLElement;
}

function isDocumentScrollElement(element: HTMLElement) {
  return (
    element === document.scrollingElement ||
    element === document.documentElement ||
    element === document.body
  );
}

function getTrackRect() {
  const rect = trackElement.value?.getBoundingClientRect();
  if (rect && rect.height > 0) return rect;
  return { top: 0, height: window.innerHeight };
}

function getScrollTop() {
  if (!scrollElement) return 0;
  return Math.max(window.scrollY || 0, scrollElement.scrollTop);
}

function readMetrics() {
  const element = scrollElement;
  if (!element) {
    return { maxScroll: 0, thumbHeight: 0, trackHeight: 0, visible: false };
  }

  const trackHeight = Math.max(getTrackRect().height, 0);
  const viewportHeight = Math.max(window.innerHeight, element.clientHeight);
  const scrollHeight = Math.max(
    element.scrollHeight,
    document.documentElement?.scrollHeight ?? 0,
    document.body?.scrollHeight ?? 0,
    viewportHeight,
  );
  const maxScroll = Math.max(scrollHeight - viewportHeight, 0);
  const visible = maxScroll > 1 && trackHeight > 0;

  if (!visible) {
    return { maxScroll, thumbHeight: 0, trackHeight, visible: false };
  }

  const proportionalHeight = (viewportHeight / scrollHeight) * trackHeight;
  const thumbHeight = Math.max(proportionalHeight, trackHeight * normalizedMinThumbRatio.value);
  return {
    maxScroll,
    thumbHeight: Math.min(thumbHeight, trackHeight),
    trackHeight,
    visible,
  };
}

function applyScrollPosition(metrics = readMetrics()) {
  progress.value =
    metrics.maxScroll > 0 ? Math.min(Math.max(getScrollTop() / metrics.maxScroll, 0), 1) : 0;
}
function update() {
  const metrics = readMetrics();
  hasScrollableContent.value = metrics.visible;
  thumbLengthRatio.value =
    metrics.trackHeight > 0 && metrics.visible ? metrics.thumbHeight / metrics.trackHeight : 1;
  applyScrollPosition(metrics);
  if (!metrics.visible) isVisible.value = false;
}

function scheduleHide() {
  if (hideTimer !== undefined) window.clearTimeout(hideTimer);
  hideTimer = undefined;
  if (normalizedAutoHideMs.value <= 0) return;
  hideTimer = window.setTimeout(() => {
    isVisible.value = false;
    hideTimer = undefined;
  }, normalizedAutoHideMs.value);
}

function show() {
  if (!hasScrollableContent.value) return;
  isVisible.value = true;
  scheduleHide();
}

function setNativeScrollbarHidden(hidden: boolean) {
  if (!props.hideNative) return;
  const targets = [document.documentElement, document.body].filter(Boolean);
  for (const target of targets) target.classList.toggle('ui-scrollbar-target', hidden);
}

function setInstantScroll(instant: boolean) {
  if (!scrollElement) return;
  if (instant) {
    if (previousScrollBehavior === undefined)
      previousScrollBehavior = scrollElement.style.getPropertyValue('scroll-behavior');
    scrollElement.style.setProperty('scroll-behavior', 'auto');
    return;
  }

  if (previousScrollBehavior === undefined) return;
  if (previousScrollBehavior)
    scrollElement.style.setProperty('scroll-behavior', previousScrollBehavior);
  else scrollElement.style.removeProperty('scroll-behavior');
  previousScrollBehavior = undefined;
}

function setScrollTop(top: number) {
  if (!scrollElement) return;
  const nextTop = Math.max(0, top);
  if (isDocumentScrollElement(scrollElement)) {
    try {
      window.scrollTo({ top: nextTop, left: 0, behavior: 'auto' });
    } catch {
      // Some non-browser renderers do not implement window.scrollTo.
    }
  }
  scrollElement.scrollTop = nextTop;
}

function onPointerDown(event: PointerEvent) {
  const thumb = thumbElement.value;
  if (!thumb || event.button !== 0) return;
  const rect = thumb.getBoundingClientRect();
  if (event.clientY < rect.top || event.clientY > rect.bottom) return;

  event.preventDefault();
  event.stopPropagation();
  dragging.value = true;
  dragOffset.value = event.clientY - rect.top;
  setInstantScroll(true);
  thumb.setPointerCapture?.(event.pointerId);
  show();
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value || !scrollElement) return;
  const metrics = readMetrics();
  const trackRect = getTrackRect();
  const maxThumbTop = Math.max(metrics.trackHeight - metrics.thumbHeight, 0);
  if (maxThumbTop <= 0) return;

  const nextThumbTop = Math.min(
    Math.max(event.clientY - trackRect.top - dragOffset.value, 0),
    maxThumbTop,
  );
  setScrollTop((nextThumbTop / maxThumbTop) * metrics.maxScroll);
  update();
  show();
}

function finishPointer(event: PointerEvent) {
  if (!dragging.value) return;
  dragging.value = false;
  setInstantScroll(false);
  thumbElement.value?.releasePointerCapture?.(event.pointerId);
  update();
}

function onTrackPointerDown(event: PointerEvent) {
  if (event.button !== 0 || !scrollElement) return;
  const metrics = readMetrics();
  const trackRect = getTrackRect();
  const maxThumbTop = Math.max(metrics.trackHeight - metrics.thumbHeight, 0);
  if (maxThumbTop <= 0) return;

  event.preventDefault();
  const nextThumbTop = Math.min(
    Math.max(event.clientY - trackRect.top - metrics.thumbHeight / 2, 0),
    maxThumbTop,
  );
  setScrollTop((nextThumbTop / maxThumbTop) * metrics.maxScroll);
  update();
  show();
}

function syncLayout() {
  update();
  if (refreshNeedsReveal && hasScrollableContent.value) {
    refreshNeedsReveal = false;
    show();
  }
}

function refreshAfterChange() {
  refreshNeedsReveal = true;
  if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
  void nextTick(() => {
    syncLayout();
    refreshTimer = window.setTimeout(() => {
      refreshTimer = undefined;
      syncLayout();
      show();
    }, 1200);
  });
}

function queueLayoutSync() {
  if (mutationFrame !== undefined) return;
  mutationFrame = window.requestAnimationFrame(() => {
    mutationFrame = undefined;
    syncLayout();
  });
}

function onScroll() {
  update();
  show();
}

function onResize() {
  syncLayout();
  show();
}

function onKeydown() {
  show();
}

watch(() => props.refreshKey, refreshAfterChange);

onMounted(() => {
  scrollElement = resolveScrollElement();
  setNativeScrollbarHidden(true);
  syncLayout();
  show();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeydown);

  if (typeof ResizeObserver !== 'undefined') {
    layoutObserver = new ResizeObserver(syncLayout);
    layoutObserver.observe(document.documentElement);
    if (document.body) layoutObserver.observe(document.body);
  }
  if (typeof MutationObserver !== 'undefined' && document.body) {
    contentObserver = new MutationObserver(queueLayoutSync);
    contentObserver.observe(document.body, { childList: true, subtree: true });
  }
});

onBeforeUnmount(() => {
  if (dragging.value) setInstantScroll(false);
  if (hideTimer !== undefined) window.clearTimeout(hideTimer);
  if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
  if (mutationFrame !== undefined) window.cancelAnimationFrame(mutationFrame);
  layoutObserver?.disconnect();
  contentObserver?.disconnect();
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', onKeydown);
  setNativeScrollbarHidden(false);
  scrollElement = null;
});
</script>

<template>
  <div
    ref="trackElement"
    v-bind="forwardedAttrs"
    :class="[classes, attrs.class]"
    :style="[attrs.style, scrollbarStyle]"
    :data-visible="isVisible && hasScrollableContent ? 'true' : 'false'"
    aria-hidden="true"
    @pointerdown="onTrackPointerDown"
  >
    <div
      ref="thumbElement"
      class="ui-scrollbar__thumb"
      :style="thumbStyle"
      @pointerdown.stop="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="finishPointer"
      @pointercancel="finishPointer"
    />
  </div>
</template>
