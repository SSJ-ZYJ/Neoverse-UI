<script setup lang="ts">
import {
  type AnchoredOverlayOptions,
  hideAnchoredOverlay,
  isOverlayOpen,
  showAnchoredOverlay,
  stopOverlayTracking,
} from '@neoverse-ui/overlay-runtime';
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { presence } from './presence';
import type { DropdownMenuItem, DropdownMenuProps } from './types';

const props = withDefaults(defineProps<DropdownMenuProps>(), {
  open: undefined,
  defaultOpen: false,
  disabled: false,
  placement: 'auto',
});
const emit = defineEmits<{
  'update:open': [value: boolean];
  select: [item: DropdownMenuItem];
}>();

const triggerRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const panelId = `${useId()}-menu`;
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
    placement: props.placement,
    fallbackOpenClass: 'ui-overlay-panel--fallback-open',
    onDismiss: () => void requestDismiss(),
  };
}

function menuItems(): HTMLButtonElement[] {
  return Array.from(
    panelRef.value?.querySelectorAll<HTMLButtonElement>('.ui-dropdown-menu__item:not(:disabled)') ??
      [],
  );
}

function focusFirstItem() {
  requestAnimationFrame(() => {
    const panel = panelRef.value;
    if (expandedOpen.value && panel && isOverlayOpen(panel, 'ui-overlay-panel--fallback-open')) {
      menuItems()[0]?.focus();
    }
  });
}

async function syncOverlay(value: boolean) {
  await nextTick();
  const options = overlayOptions();
  if (options === undefined) return;
  if (value && !props.disabled) {
    showAnchoredOverlay(options);
    focusFirstItem();
  } else {
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

function closeAndRestoreFocus() {
  setOpen(false);
  void nextTick(() => triggerRef.value?.focus());
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

function selectItem(item: DropdownMenuItem) {
  if (item.disabled) return;
  emit('select', item);
  closeAndRestoreFocus();
}

function focusRelative(current: HTMLButtonElement, direction: 1 | -1) {
  const items = menuItems();
  if (items.length === 0) return;
  const index = items.indexOf(current);
  const next = items[(index + direction + items.length) % items.length];
  next?.focus();
}

function onMenuKeydown(event: KeyboardEvent) {
  const current = event.target;
  if (!(current instanceof HTMLButtonElement)) return;

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    focusRelative(current, event.key === 'ArrowDown' ? 1 : -1);
    return;
  }

  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    const items = menuItems();
    (event.key === 'Home' ? items[0] : items.at(-1))?.focus();
  }
}

watch(
  () => [resolvedOpen.value, props.disabled, props.placement] as const,
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
  <span class="ui-dropdown-menu">
    <button
      ref="triggerRef"
      class="ui-dropdown-menu__trigger ui-button ui-button--secondary ui-button--md"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="expandedOpen"
      :aria-controls="panelId"
      :disabled="props.disabled"
      @click="toggleOpen"
    >
      <slot name="trigger" />
    </button>

    <div
      ref="panelRef"
      :id="panelId"
      class="ui-overlay-panel ui-dropdown-menu__panel material-glass-elevated nv-presence"
      popover="auto"
      role="menu"
      :aria-label="props.ariaLabel"
      v-bind="presence('pop', 'top')"
      @toggle="onPanelToggle"
      @keydown="onMenuKeydown"
    >
      <button
        v-for="item in props.items"
        :key="item.id"
        class="ui-dropdown-menu__item"
        type="button"
        role="menuitem"
        :disabled="item.disabled"
        :data-tone="item.tone ?? 'default'"
        @click="selectItem(item)"
      >
        <slot name="item" :item="item">{{ item.label }}</slot>
      </button>
    </div>
  </span>
</template>
