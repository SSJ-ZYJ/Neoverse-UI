<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { TerminalTranscriptProps } from './types';

const props = withDefaults(defineProps<TerminalTranscriptProps>(), {
  label: 'Terminal output',
  followTail: true,
  density: 'comfortable',
  live: 'polite',
});
const scroller = ref<HTMLElement | null>(null);
let mutationObserver: MutationObserver | undefined;
let resizeObserver: ResizeObserver | undefined;
let shouldFollow = true;
let pending = false;
let measuredWidth = 0;
let measuredHeight = 0;

function atBottom(element: HTMLElement) {
  return element.scrollHeight - element.clientHeight - element.scrollTop <= 3;
}

function onScroll() {
  const element = scroller.value;
  if (!element) return;
  const resized = element.clientWidth !== measuredWidth || element.clientHeight !== measuredHeight;
  measuredWidth = element.clientWidth;
  measuredHeight = element.clientHeight;
  // Native scroll anchoring can fire before ResizeObserver during reflow.
  // Preserve an existing tail follower; readers still keep their scroll position.
  if (resized && shouldFollow) {
    syncTail();
    return;
  }
  shouldFollow = atBottom(element);
}

function syncTail() {
  if (!props.followTail || !shouldFollow || !scroller.value || pending) return;
  pending = true;
  void nextTick(() => {
    pending = false;
    if (props.followTail && shouldFollow && scroller.value) {
      scroller.value.scrollTop = scroller.value.scrollHeight;
    }
  });
}

watch(
  () => props.followTail,
  (value) => {
    if (value) syncTail();
  },
);

onMounted(() => {
  const element = scroller.value;
  if (!element) return;
  measuredWidth = element.clientWidth;
  measuredHeight = element.clientHeight;
  if (props.followTail) element.scrollTop = element.scrollHeight;
  shouldFollow = atBottom(element);
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(syncTail);
    mutationObserver.observe(element, { childList: true, subtree: true, characterData: true });
  }
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(syncTail);
    resizeObserver.observe(element);
    for (const child of element.children) resizeObserver.observe(child);
  }
});

onBeforeUnmount(() => {
  mutationObserver?.disconnect();
  resizeObserver?.disconnect();
});
</script>

<template>
  <section
    ref="scroller"
    class="ui-terminal-transcript scrollbar-immersive"
    :data-density="props.density"
    :aria-label="props.label"
    @scroll.passive="onScroll"
  >
    <div role="log" :aria-live="props.live" aria-relevant="additions text" aria-atomic="false">
      <slot />
    </div>
  </section>
</template>
