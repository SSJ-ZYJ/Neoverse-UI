<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useAttrs } from 'vue';
import type { FormControlValue, SelectOption, SelectProps } from './types';

defineOptions({ inheritAttrs: false });

const props = defineProps<SelectProps>();
const emit = defineEmits<{ 'update:modelValue': [value: FormControlValue] }>();
const attrs = useAttrs();
const detailsRef = ref<HTMLDetailsElement | null>(null);
const popoverRef = ref<HTMLElement | null>(null);
const open = ref(false);
let stopPopoverTracking: (() => void) | undefined;

const disabled = computed(
  () => attrs.disabled === '' || attrs.disabled === true || attrs.disabled === 'disabled',
);
const name = computed(() => (typeof attrs.name === 'string' ? attrs.name : undefined));
const selectedOption = computed(() =>
  props.options.find((option) => String(option.value) === String(props.modelValue ?? '')),
);
const forwardedAttrs = computed(() => {
  const {
    class: _class,
    style: _style,
    value: _value,
    disabled: _disabled,
    name: _name,
    ...rest
  } = attrs;
  return rest;
});

function focusTrigger() {
  void nextTick(() => {
    detailsRef.value?.querySelector<HTMLElement>('.ui-select')?.focus();
  });
}

function supportsPopover(element: HTMLElement): boolean {
  return typeof element.showPopover === 'function' && typeof element.hidePopover === 'function';
}

function isPopoverOpen(element: HTMLElement): boolean {
  if (!supportsPopover(element)) {
    return element.classList.contains('ui-select__popover--fallback-open');
  }

  return element.matches(':popover-open');
}

function stopTrackingPopover() {
  stopPopoverTracking?.();
  stopPopoverTracking = undefined;
}

function resolveCssLength(element: HTMLElement, value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;

  const normalized = value.trim().toLowerCase();
  if (normalized.endsWith('rem')) {
    return parsed * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  if (normalized.endsWith('em')) {
    return parsed * Number.parseFloat(getComputedStyle(element).fontSize);
  }
  return parsed;
}

function resolveEffectiveZoom(element: HTMLElement): number {
  let zoom = 1;
  let node: HTMLElement | null = element;
  while (node !== null) {
    const value = Number.parseFloat(getComputedStyle(node).zoom);
    if (Number.isFinite(value) && value > 0) zoom *= value;
    node = node.parentElement;
  }
  return zoom;
}

function updatePopoverPosition() {
  const details = detailsRef.value;
  const popover = popoverRef.value;
  const trigger = details?.querySelector<HTMLElement>('.ui-select');
  if (details === null || popover === null || trigger === null || trigger === undefined) return;
  if (!details.open || !isPopoverOpen(popover)) return;

  const triggerRect = trigger.getBoundingClientRect();
  const popoverStyle = getComputedStyle(popover);
  const effectiveZoom = resolveEffectiveZoom(popover);
  const gap =
    Math.max(
      0,
      resolveCssLength(popover, popoverStyle.getPropertyValue('--neoverse-select-popover-gap')),
    ) * effectiveZoom;

  popover.style.setProperty(
    '--neoverse-select-popover-inline-size',
    `${triggerRect.width / effectiveZoom}px`,
  );

  const popoverRect = popover.getBoundingClientRect();
  const maxLeft = Math.max(gap, window.innerWidth - popoverRect.width - gap);
  const left = Math.min(Math.max(triggerRect.left, gap), maxLeft);
  const spaceBelow = window.innerHeight - triggerRect.bottom - gap;
  const spaceAbove = triggerRect.top - gap;
  const shouldOpenAbove = popoverRect.height > spaceBelow && spaceAbove >= popoverRect.height;
  const unclampedTop = shouldOpenAbove
    ? triggerRect.top - popoverRect.height - gap
    : triggerRect.bottom + gap;
  const maxTop = Math.max(gap, window.innerHeight - popoverRect.height - gap);
  const top = Math.min(Math.max(unclampedTop, gap), maxTop);

  popover.style.setProperty('--neoverse-select-popover-left', `${left / effectiveZoom}px`);
  popover.style.setProperty('--neoverse-select-popover-top', `${top / effectiveZoom}px`);
}

function startTrackingPopover() {
  stopTrackingPopover();
  const update = () => updatePopoverPosition();
  window.addEventListener('resize', update);
  window.addEventListener('scroll', update, true);
  stopPopoverTracking = () => {
    window.removeEventListener('resize', update);
    window.removeEventListener('scroll', update, true);
  };
}

function closePopover() {
  const popover = popoverRef.value;
  if (popover === null) return;

  if (supportsPopover(popover)) {
    if (popover.matches(':popover-open')) popover.hidePopover();
  } else {
    popover.classList.remove('ui-select__popover--fallback-open');
  }
  stopTrackingPopover();
}

async function openPopover() {
  const popover = popoverRef.value;
  if (popover === null || disabled.value) return;

  if (supportsPopover(popover)) {
    if (!popover.matches(':popover-open')) popover.showPopover();
  } else {
    popover.classList.add('ui-select__popover--fallback-open');
  }

  await nextTick();
  updatePopoverPosition();
  startTrackingPopover();
}

function onToggle(event: Event) {
  const details = event.currentTarget as HTMLDetailsElement;
  const nextOpen = details.open && !disabled.value;
  open.value = nextOpen;

  if (nextOpen) {
    void openPopover();
    return;
  }

  closePopover();
}

function onTriggerClick(event: MouseEvent) {
  if (!disabled.value) return;
  event.preventDefault();
}

function markTriggerPointerFocus() {
  const trigger = detailsRef.value?.querySelector<HTMLElement>('.ui-select');
  if (trigger !== null && trigger !== undefined) {
    trigger.dataset.neoverseFocusOrigin = 'pointer';
  }
}

function clearTriggerFocusOrigin(event: FocusEvent) {
  delete (event.currentTarget as HTMLElement).dataset.neoverseFocusOrigin;
}

function selectOption(option: SelectOption) {
  if (disabled.value || option.disabled) return;
  emit('update:modelValue', option.value);
  if (detailsRef.value) detailsRef.value.open = false;
  open.value = false;
  closePopover();
  focusTrigger();
}

function onPopoverToggle(event: Event) {
  const popover = event.currentTarget as HTMLElement;
  if (isPopoverOpen(popover)) return;

  stopTrackingPopover();
  if (detailsRef.value?.open) detailsRef.value.open = false;
  open.value = false;
}

function focusOption(direction: 1 | -1, event: KeyboardEvent) {
  const current = event.currentTarget as HTMLButtonElement;
  const options = Array.from(
    current
      .closest('.ui-select__popover')
      ?.querySelectorAll<HTMLButtonElement>('.ui-select__option:not(:disabled)') ?? [],
  );
  const index = options.indexOf(current);
  const next = options[(index + direction + options.length) % options.length];
  next?.focus();
}

function onOptionKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusOption(1, event);
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusOption(-1, event);
    return;
  }
  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    const current = event.currentTarget as HTMLButtonElement;
    const options = Array.from(
      current
        .closest('.ui-select__popover')
        ?.querySelectorAll<HTMLButtonElement>('.ui-select__option:not(:disabled)') ?? [],
    );
    (event.key === 'Home' ? options[0] : options.at(-1))?.focus();
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    if (detailsRef.value) detailsRef.value.open = false;
    open.value = false;
    closePopover();
    focusTrigger();
  }
}

onBeforeUnmount(() => {
  closePopover();
});
</script>

<template>
  <details
    ref="detailsRef"
    class="ui-select-shell"
    :class="{ 'ui-select-shell--disabled': disabled }"
    @toggle="onToggle"
  >
    <summary
      v-bind="forwardedAttrs"
      class="ui-select"
      :class="attrs.class"
      :style="attrs.style"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-disabled="disabled || undefined"
      @click="onTriggerClick"
      @pointerdown="markTriggerPointerFocus"
      @blur="clearTriggerFocusOrigin"
    >
      <span class="ui-select__value" :class="{ 'ui-select__value--placeholder': !selectedOption }">
        {{ selectedOption?.label ?? props.placeholder ?? '' }}
      </span>
      <svg class="ui-select__indicator" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </summary>

    <div
      ref="popoverRef"
      class="ui-select__popover"
      role="listbox"
      popover="auto"
      @toggle="onPopoverToggle"
    >
      <button
        v-for="option in props.options"
        :key="String(option.value)"
        class="ui-select__option"
        type="button"
        role="option"
        :disabled="option.disabled"
        :aria-selected="String(option.value) === String(props.modelValue ?? '')"
        @pointerdown="markTriggerPointerFocus"
        @click="selectOption(option)"
        @keydown="onOptionKeydown"
      >
        <span>{{ option.label }}</span>
        <svg
          v-if="String(option.value) === String(props.modelValue ?? '')"
          class="ui-select__check"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
      </button>
    </div>

    <input
      v-if="name"
      type="hidden"
      :name="name"
      :value="props.modelValue ?? ''"
      :disabled="disabled"
    >
  </details>
</template>
