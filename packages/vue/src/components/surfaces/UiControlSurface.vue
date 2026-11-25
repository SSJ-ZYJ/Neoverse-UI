<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useSlots } from 'vue';
import type { ControlSurfaceProps } from '../../types';
import { getSurfaceClass } from './surface';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ControlSurfaceProps>(), {
  as: 'div',
  hoverMode: 'auto',
  edgeMode: 'auto',
  scale: 'md',
});

const attrs = useAttrs();
const slots = useSlots();
const primary = ref<HTMLElement>();
const indicator = ref<HTMLElement>();
const indicatorReady = ref(false);
let resizeObserver: ResizeObserver | undefined;
let mutationObserver: MutationObserver | undefined;
let frame = 0;
let measurementFrame = 0;
// Committed geometry lives in left/top/width/height; the flight between
// selections is a compositor translate + scale away from that base, so the
// indicator never runs per-frame layout inside a glass surface.
type IndicatorRect = { left: number; top: number; width: number; height: number };
let indicatorBase: IndicatorRect | undefined;
let indicatorTarget: IndicatorRect | undefined;

// The indicator's committed geometry lives in the group's own layout pixels,
// but the measured marker rect includes every rendered scale above it: CSS
// `zoom` and any ancestor `scale` transform. A visually magnified preview keeps
// its layout at 100%, so both must be divided out or the indicator is offset and
// sized twice and leaves the clipping group.
function getCumulativeScale(element: HTMLElement): number {
  let scale = 1;
  let current: HTMLElement | null = element;
  while (current) {
    const style = getComputedStyle(current);
    const zoom = Number.parseFloat(style.zoom);
    if (Number.isFinite(zoom) && zoom > 0) scale *= zoom;
    const factor = Number.parseFloat((style.scale || '1').split(/\s+/)[0] ?? '1');
    if (Number.isFinite(factor) && factor > 0) scale *= factor;
    current = current.parentElement;
  }
  return scale;
}

function sameIndicatorRect(first: IndicatorRect, second: IndicatorRect): boolean {
  return (
    first.left === second.left &&
    first.top === second.top &&
    first.width === second.width &&
    first.height === second.height
  );
}

function writeIndicatorGeometry(element: HTMLElement, rect: IndicatorRect): void {
  element.style.left = `${rect.left}px`;
  element.style.top = `${rect.top}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
  element.style.transform = '';
  element.style.visibility = 'visible';
}

// The commit must land while the transform transition is disabled; otherwise
// restoring the base geometry retargets the flight back toward the old item.
function commitIndicator(element: HTMLElement, rect: IndicatorRect): void {
  element.style.transition = 'none';
  writeIndicatorGeometry(element, rect);
  void element.offsetWidth;
  element.style.transition = '';
}

function indicatorTransitionDisabled(element: HTMLElement): boolean {
  return getComputedStyle(element)
    .transitionDuration.split(',')
    .every((value) => Number.parseFloat(value) === 0);
}

function measureIndicator() {
  if (!props.navigationIndicator || !primary.value) return;
  const element = indicator.value;
  const marker = primary.value.querySelector<HTMLElement>(
    '.ui-navigation-item--active .ui-navigation-item__indicator',
  );
  if (!marker || !element) {
    indicatorBase = undefined;
    indicatorTarget = undefined;
    indicatorReady.value = false;
    if (element) {
      element.style.visibility = 'hidden';
      element.style.transform = '';
    }
    return;
  }
  const group = primary.value.getBoundingClientRect();
  const rect = marker.getBoundingClientRect();
  const zoom = getCumulativeScale(primary.value);
  const target: IndicatorRect = {
    left: (rect.left - group.left) / zoom,
    top: (rect.top - group.top) / zoom,
    width: rect.width / zoom,
    height: rect.height / zoom,
  };
  indicatorTarget = target;
  const base = indicatorBase;
  if (!base) {
    writeIndicatorGeometry(element, target);
    indicatorBase = target;
    if (!indicatorReady.value) {
      void nextTick().then(() => {
        frame = requestAnimationFrame(() => {
          indicatorReady.value = true;
        });
      });
    }
    return;
  }
  if (sameIndicatorRect(target, base)) {
    // Returning to the committed item: CSS interpolates the flight back to none.
    if (element.style.transform !== '') element.style.transform = '';
    return;
  }
  if (base.width === 0 || base.height === 0 || indicatorTransitionDisabled(element)) {
    commitIndicator(element, target);
    indicatorBase = target;
    return;
  }
  const translateX = target.left - base.left;
  const translateY = target.top - base.top;
  const scaleX = target.width / base.width;
  const scaleY = target.height / base.height;
  element.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
}

function settleIndicator(event: Event) {
  const transition = event as TransitionEvent;
  if (transition.propertyName !== 'transform' || transition.target !== indicator.value) return;
  const element = indicator.value;
  const target = indicatorTarget;
  const base = indicatorBase;
  if (!element || !target || !base) return;
  if (sameIndicatorRect(target, base) && element.style.transform === '') return;
  commitIndicator(element, target);
  indicatorBase = target;
}

function scheduleIndicatorMeasurement() {
  cancelAnimationFrame(measurementFrame);
  measurementFrame = requestAnimationFrame(measureIndicator);
}

onMounted(() => {
  if (
    !props.navigationIndicator ||
    !primary.value ||
    typeof ResizeObserver === 'undefined' ||
    typeof MutationObserver === 'undefined'
  )
    return;
  resizeObserver = new ResizeObserver(measureIndicator);
  const observeItems = () => {
    resizeObserver?.disconnect();
    if (!primary.value) return;
    resizeObserver?.observe(primary.value);
    for (const item of primary.value.querySelectorAll('.ui-navigation-item')) {
      resizeObserver?.observe(item);
    }
  };
  observeItems();
  mutationObserver = new MutationObserver((records) => {
    if (
      records.every((record) =>
        (record.target as HTMLElement).classList?.contains('ui-control-surface__indicator'),
      )
    )
      return;
    observeItems();
    measureIndicator();
    scheduleIndicatorMeasurement();
  });
  mutationObserver.observe(primary.value, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'aria-current'],
  });
  measureIndicator();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  mutationObserver?.disconnect();
  cancelAnimationFrame(frame);
  cancelAnimationFrame(measurementFrame);
});
const surface = computed(() => props.surface ?? 'glass-subtle');
const classes = computed(() => [
  'ui-control-surface',
  getSurfaceClass(surface.value),
  `ui-control-surface--scale-${props.scale}`,
]);
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <component
    :is="props.as"
    v-bind="forwardedAttrs"
    :class="[
      classes,
      { 'ui-control-surface--shared-indicator': props.navigationIndicator },
      attrs.class,
    ]"
    :style="attrs.style"
    :data-surface="surface"
    :data-neoverse-navigation-indicator-ready="
      props.navigationIndicator && indicatorReady ? 'true' : undefined
    "
    :data-neoverse-surface-hover="props.hoverMode === 'static' ? 'static' : undefined"
    :data-neoverse-glass-edge-pass="props.edgeMode === 'local' ? 'css' : undefined"
  >
    <div ref="primary" class="ui-control-surface__group ui-control-surface__group--primary">
      <slot />
      <span
        v-if="props.navigationIndicator"
        ref="indicator"
        class="ui-control-surface__indicator"
        style="visibility: hidden"
        :data-ready="indicatorReady"
        aria-hidden="true"
        @transitionend="settleIndicator"
      />
    </div>
    <template v-if="slots.trailing">
      <span class="ui-control-surface__divider" aria-hidden="true" />
      <div class="ui-control-surface__group ui-control-surface__group--trailing">
        <slot name="trailing" />
      </div>
    </template>
  </component>
</template>
