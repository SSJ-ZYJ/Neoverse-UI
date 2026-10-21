<script setup lang="ts">
import {
  type AnchoredOverlayOptions,
  hideAnchoredOverlay,
  isOverlayOpen,
  showAnchoredOverlay,
  stopOverlayTracking,
} from '@neoverse-ui/overlay-runtime';
import { computed, nextTick, onBeforeUnmount, ref, useAttrs, watch } from 'vue';
import { resolveAriaInvalid } from './form-control';
import { presence } from './presence';
import type { FormControlValue, SelectOption, SelectProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SelectProps>(), {
  validation: 'none',
  disabled: false,
  readonly: false,
});
const emit = defineEmits<{ 'update:modelValue': [value: FormControlValue] }>();
const attrs = useAttrs();
const detailsRef = ref<HTMLDetailsElement | null>(null);
const popoverRef = ref<HTMLElement | null>(null);
const open = ref(false);

const disabled = computed(() => props.disabled);
const readonlyState = computed(() => props.readonly);
const blocked = computed(() => disabled.value || readonlyState.value);
const name = computed(() => (typeof attrs.name === 'string' ? attrs.name : undefined));
const selectedOption = computed(() =>
  props.options.find((option) => String(option.value) === String(props.modelValue ?? '')),
);
const ariaInvalid = computed(() => resolveAriaInvalid(attrs['aria-invalid'], props.validation));
const forwardedAttrs = computed(() => {
  const {
    class: _class,
    style: _style,
    value: _value,
    name: _name,
    'aria-invalid': _ariaInvalid,
    ...rest
  } = attrs;
  return rest;
});

function focusTrigger() {
  void nextTick(() => {
    detailsRef.value?.querySelector<HTMLElement>('.ui-select')?.focus();
  });
}

function overlayOptions(): AnchoredOverlayOptions | undefined {
  const details = detailsRef.value;
  const popover = popoverRef.value;
  const trigger = details?.querySelector<HTMLElement>('.ui-select');
  if (details === null || popover === null || trigger === null || trigger === undefined) {
    return undefined;
  }

  return {
    trigger,
    overlay: popover,
    gapVariable: '--neoverse-select-popover-gap',
    leftVariable: '--neoverse-select-popover-left',
    topVariable: '--neoverse-select-popover-top',
    inlineSizeVariable: '--neoverse-select-popover-inline-size',
    matchTriggerWidth: true,
    fallbackOpenClass: 'ui-select__popover--fallback-open',
    onDismiss: () => {
      details.open = false;
      open.value = false;
    },
  };
}

function closePopover() {
  const options = overlayOptions();
  if (options !== undefined) hideAnchoredOverlay(options);
}

async function openPopover() {
  if (blocked.value) return;
  await nextTick();
  if (blocked.value) return;
  const options = overlayOptions();
  if (options !== undefined) showAnchoredOverlay(options);
}

watch(blocked, (isBlocked) => {
  if (!isBlocked) return;
  if (detailsRef.value) detailsRef.value.open = false;
  open.value = false;
  closePopover();
});

function onToggle(event: Event) {
  const details = event.currentTarget as HTMLDetailsElement;
  const nextOpen = details.open && !blocked.value;
  open.value = nextOpen;

  if (nextOpen) {
    void openPopover();
    return;
  }

  closePopover();
}

function onTriggerClick(event: MouseEvent) {
  if (!blocked.value) return;
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
  if (blocked.value || option.disabled) return;
  emit('update:modelValue', option.value);
  if (detailsRef.value) detailsRef.value.open = false;
  open.value = false;
  closePopover();
  focusTrigger();
}

function onPopoverToggle(event: Event) {
  const popover = event.currentTarget as HTMLElement;
  if (isOverlayOpen(popover, 'ui-select__popover--fallback-open')) return;

  stopOverlayTracking(popover);
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
    :class="{
      'ui-select-shell--disabled': disabled,
      'ui-select-shell--readonly': readonlyState,
    }"
    @toggle="onToggle"
  >
    <summary
      v-bind="forwardedAttrs"
      class="ui-select"
      :class="attrs.class"
      :style="attrs.style"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open && !blocked"
      :aria-disabled="blocked || undefined"
      :aria-invalid="ariaInvalid"
      :data-validation="props.validation"
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
      class="ui-select__popover nv-presence"
      role="listbox"
      popover="auto"
      v-bind="presence('pop', 'top')"
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
        <Transition name="nv">
          <svg
            v-if="String(option.value) === String(props.modelValue ?? '')"
            v-bind="presence('pop')"
            class="ui-select__check"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
        </Transition>
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
