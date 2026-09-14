<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useSlots } from 'vue';
import { getSurfaceClass, glassVariantToSurface } from './surface';
import type { ControlSurfaceProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ControlSurfaceProps>(), {
  as: 'div',
  variant: 'subtle',
  hoverMode: 'auto',
  edgeMode: 'auto',
  scale: 'md',
});

const attrs = useAttrs();
const slots = useSlots();
const surfaceRoot = ref<HTMLElement>();
const primary = ref<HTMLElement>();
const indicatorStyle = ref<Record<string, string>>();
const indicatorReady = ref(false);
let resizeObserver: ResizeObserver | undefined;
let mutationObserver: MutationObserver | undefined;
let frame = 0;

function measureIndicator() {
  if (!props.navigationIndicator || !primary.value) return;
  const marker = primary.value.querySelector<HTMLElement>(
    '.ui-navigation-item--active .ui-navigation-item__indicator',
  );
  if (!marker) {
    indicatorStyle.value = undefined;
    indicatorReady.value = false;
    return;
  }
  const group = primary.value.getBoundingClientRect();
  const rect = marker.getBoundingClientRect();
  const zoomValue = surfaceRoot.value
    ? Number.parseFloat(getComputedStyle(surfaceRoot.value).getPropertyValue('zoom'))
    : 1;
  const zoom = Number.isFinite(zoomValue) && zoomValue > 0 ? zoomValue : 1;
  indicatorStyle.value = {
    left: `${(rect.left - group.left) / zoom}px`,
    top: `${(rect.top - group.top) / zoom}px`,
    width: `${rect.width / zoom}px`,
    height: `${rect.height / zoom}px`,
  };
  if (!indicatorReady.value) {
    void nextTick(() => {
      frame = requestAnimationFrame(() => {
        indicatorReady.value = true;
      });
    });
  }
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
});
const surface = computed(() => props.surface ?? glassVariantToSurface(props.variant));
const classes = computed(() => [
  'ui-control-surface inline-flex max-w-full items-stretch rounded-control',
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
    ref="surfaceRoot"
    :is="props.as"
    v-bind="forwardedAttrs"
    :class="[classes, { 'ui-control-surface--shared-indicator': props.navigationIndicator }, attrs.class]"
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
        v-if="props.navigationIndicator && indicatorStyle"
        class="ui-control-surface__indicator"
        :style="indicatorStyle"
        :data-ready="indicatorReady"
        aria-hidden="true"
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
