<script setup lang="ts">
import {
  type AnchoredOverlayOptions,
  hideAnchoredOverlay,
  installFocusModality,
  isOverlayOpen,
  markPointerModality,
  showAnchoredOverlay,
  stopOverlayTracking,
} from '@neoverse-ui/overlay-runtime';
import { getSurfaceClass } from '@neoverse-ui/tokens';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import type { ButtonSize, ButtonVariant, PopoverProps } from '../../types';
import { buttonSizeClasses, buttonVariantClasses } from '../actions/classes';
import { presence } from '../motion/presence';

const props = withDefaults(defineProps<PopoverProps>(), {
  open: undefined,
  defaultOpen: false,
  disabled: false,
  placement: 'auto',
  matchTriggerWidth: false,
  triggerVariant: 'secondary',
  triggerSize: 'md',
});
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const triggerClasses = computed(() => [
  'ui-popover__trigger',
  'ui-button',
  getSurfaceClass('auto', 'control'),
  buttonVariantClasses[props.triggerVariant as ButtonVariant] ?? buttonVariantClasses.secondary,
  buttonSizeClasses[props.triggerSize as ButtonSize] ?? buttonSizeClasses.md,
]);

const triggerRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const panelId = `${useId()}-popover`;
const ignoreDisabledNativeClose = ref(false);
const internalOpen = ref(props.defaultOpen);
const resolvedOpen = computed(() => props.open ?? internalOpen.value);
const expandedOpen = computed(() => resolvedOpen.value && !props.disabled);

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
  else {
    if (props.disabled && isOverlayOpen(options.overlay, options.fallbackOpenClass)) {
      ignoreDisabledNativeClose.value = true;
    }
    hideAnchoredOverlay(options);
  }
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

function onTriggerPointerDown(event: PointerEvent) {
  const trigger = event.currentTarget as HTMLElement;
  trigger.dataset.neoverseFocusOrigin = 'pointer';
  markPointerModality(trigger.ownerDocument);
}

function onTriggerBlur(event: FocusEvent) {
  delete (event.currentTarget as HTMLElement).dataset.neoverseFocusOrigin;
}

function onPanelToggle(event: Event) {
  const panel = event.currentTarget as HTMLElement;
  const newState = (event as Event & { newState?: 'open' | 'closed' }).newState;
  if (newState === 'open') {
    ignoreDisabledNativeClose.value = false;
    return;
  }
  if (newState === 'closed' && ignoreDisabledNativeClose.value) {
    ignoreDisabledNativeClose.value = false;
    return;
  }
  if (isOverlayOpen(panel, 'ui-overlay-panel--fallback-open')) return;

  stopOverlayTracking(panel);
  if (expandedOpen.value) void requestDismiss();
}

watch(
  () => [resolvedOpen.value, props.disabled, props.placement, props.matchTriggerWidth] as const,
  ([value]) => {
    void syncOverlay(value);
  },
  { immediate: true },
);

onMounted(() => {
  if (typeof document !== 'undefined') installFocusModality(document);
});

onBeforeUnmount(() => {
  const options = overlayOptions();
  if (options !== undefined) hideAnchoredOverlay(options);
});
</script>

<template>
  <span class="ui-popover">
    <button
      ref="triggerRef"
      :class="triggerClasses"
      data-surface="auto"
      type="button"
      :disabled="props.disabled"
      :aria-expanded="expandedOpen"
      :aria-controls="panelId"
      @pointerdown="onTriggerPointerDown"
      @blur="onTriggerBlur"
      @click="toggleOpen"
    >
      <slot name="trigger" />
    </button>

    <div
      ref="panelRef"
      :id="panelId"
      class="ui-overlay-panel ui-popover__content nv-presence"
      :class="getSurfaceClass('auto', 'overlay')"
      data-surface="auto"
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
