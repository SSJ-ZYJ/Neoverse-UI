<script setup lang="ts">
import {
  type AnchoredOverlayOptions,
  hideAnchoredOverlay,
  isOverlayOpen,
  showAnchoredOverlay,
  stopOverlayTracking,
} from '@neoverse-ui/overlay-runtime';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { presence } from './presence';
import type { PopoverProps } from './types';

const props = withDefaults(defineProps<PopoverProps>(), {
  open: undefined,
  defaultOpen: false,
  disabled: false,
  placement: 'auto',
  matchTriggerWidth: false,
});
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const triggerRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const internalOpen = ref(props.defaultOpen);
const resolvedOpen = computed(() => props.open ?? internalOpen.value);

function setOpen(value: boolean) {
  if (props.open === undefined) internalOpen.value = value;
  emit('update:open', value);
}

function overlayOptions(): AnchoredOverlayOptions | undefined {
  const trigger = triggerRef.value;
  const overlay = panelRef.value;
  if (trigger === null || overlay === null) return undefined;

  return {
    trigger,
    overlay,
    gapVariable: '--neoverse-overlay-gap',
    leftVariable: '--neoverse-overlay-left',
    topVariable: '--neoverse-overlay-top',
    inlineSizeVariable: '--neoverse-overlay-inline-size',
    matchTriggerWidth: props.matchTriggerWidth,
    placement: props.placement,
    fallbackOpenClass: 'ui-overlay-panel--fallback-open',
    onDismiss: () => void requestDismiss(),
  };
}

async function syncOverlay(value: boolean) {
  await nextTick();
  const options = overlayOptions();
  if (options === undefined) return;
  if (value && !props.disabled) showAnchoredOverlay(options);
  else hideAnchoredOverlay(options);
}

async function requestDismiss() {
  setOpen(false);
  await nextTick();
  await syncOverlay(resolvedOpen.value);
}

function toggleOpen() {
  if (props.disabled) return;
  setOpen(!resolvedOpen.value);
}

function onPanelToggle(event: Event) {
  const panel = event.currentTarget as HTMLElement;
  const newState = (event as Event & { newState?: 'open' | 'closed' }).newState;
  if (newState === 'open' || isOverlayOpen(panel, 'ui-overlay-panel--fallback-open')) return;

  stopOverlayTracking(panel);
  if (resolvedOpen.value) void requestDismiss();
}

watch(
  () => [resolvedOpen.value, props.disabled, props.placement, props.matchTriggerWidth] as const,
  ([value]) => {
    void syncOverlay(value);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  const options = overlayOptions();
  if (options !== undefined) hideAnchoredOverlay(options);
});
</script>

<template>
  <span class="ui-popover">
    <button
      ref="triggerRef"
      class="ui-popover__trigger ui-button ui-button--secondary ui-button--md"
      type="button"
      :disabled="props.disabled"
      :aria-expanded="resolvedOpen"
      @click="toggleOpen"
    >
      <slot name="trigger" />
    </button>

    <div
      ref="panelRef"
      class="ui-overlay-panel ui-popover__content material-glass-elevated nv-presence"
      popover="auto"
      role="dialog"
      :aria-label="props.ariaLabel"
      v-bind="presence('pop', 'top')"
      @toggle="onPanelToggle"
    >
      <slot />
    </div>
  </span>
</template>
