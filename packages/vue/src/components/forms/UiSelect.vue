<script setup lang="ts">
import {
  type AnchoredOverlayOptions,
  focusElement,
  hideAnchoredOverlay,
  installFocusModality,
  isOverlayOpen,
  markPointerModality,
  showAnchoredOverlay,
  stopOverlayTracking,
} from '@neoverse-ui/overlay-runtime';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue';
import type { FormControlValue, SelectOption, SelectProps } from '../../types';
import { presence } from '../motion/presence';
import { resolveAriaInvalid } from './form-control';

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
const listboxId = `${useId()}-listbox`;

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

function focusTrigger(modality: 'auto' | 'keyboard' | 'pointer' = 'auto') {
  void nextTick(() => {
    focusElement(detailsRef.value?.querySelector<HTMLElement>('.ui-select'), {
      preventScroll: true,
      modality,
    });
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
  // Closing the popover lets the engine move focus to the surrounding dialog
  // after the commit. Restore the trigger once the closed state has settled.
  if (restoreTriggerFocus) {
    restoreTriggerFocus = false;
    focusTrigger();
  }
}

function onTriggerClick(event: MouseEvent) {
  if (!blocked.value) return;
  event.preventDefault();
}

async function onTriggerKeydown(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    blocked.value ||
    (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')
  )
    return;
  event.preventDefault();
  if (!detailsRef.value) return;
  detailsRef.value.open = true;
  open.value = true;
  await openPopover();
  const panel = popoverRef.value;
  if (panel === null) return;
  const selected = panel.querySelector<HTMLButtonElement>(
    '.ui-select__option[aria-selected="true"]:not(:disabled)',
  );
  if (selected) {
    focusElement(selected, { modality: 'keyboard' });
    return;
  }
  const options = panel.querySelectorAll<HTMLButtonElement>('.ui-select__option:not(:disabled)');
  focusElement(event.key === 'ArrowDown' ? options[0] : options[options.length - 1], {
    modality: 'keyboard',
  });
}

function markTriggerPointerFocus() {
  const trigger = detailsRef.value?.querySelector<HTMLElement>('.ui-select');
  if (trigger !== null && trigger !== undefined) {
    trigger.dataset.neoverseFocusOrigin = 'pointer';
    markPointerModality(trigger.ownerDocument);
  }
}

function clearTriggerFocusOrigin(event: FocusEvent) {
  delete (event.currentTarget as HTMLElement).dataset.neoverseFocusOrigin;
}

function selectOption(option: SelectOption) {
  if (blocked.value || option.disabled) return;
  emit('update:modelValue', option.value);
  restoreTriggerFocus = detailsRef.value?.open === true;
  if (detailsRef.value) detailsRef.value.open = false;
  open.value = false;
  closePopover();
  focusTrigger();
}

// WebKit dismisses the native popover between pointerdown and click, so the
// press itself must commit the option. The click that belongs to the same
// gesture is then ignored, while a click dispatched without a pointer pair
// (assistive technology) still selects.
let pointerCommitAt = Number.NEGATIVE_INFINITY;
let restoreTriggerFocus = false;
function onOptionPointerDown(option: SelectOption, event: PointerEvent) {
  markTriggerPointerFocus();
  if (!event.isPrimary || event.button !== 0) return;
  pointerCommitAt = performance.now();
  selectOption(option);
}
function onOptionClick(option: SelectOption) {
  if (performance.now() - pointerCommitAt < 500) return;
  selectOption(option);
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
  focusElement(next, { modality: 'keyboard' });
}

function onOptionKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab') {
    const closeOnShift = event.shiftKey;
    queueMicrotask(() => {
      if (closeOnShift || !popoverRef.value?.contains(document.activeElement)) {
        if (detailsRef.value) detailsRef.value.open = false;
        open.value = false;
        closePopover();
      }
    });
    return;
  }
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
    focusElement(event.key === 'Home' ? options[0] : options.at(-1), { modality: 'keyboard' });
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    if (detailsRef.value) detailsRef.value.open = false;
    open.value = false;
    closePopover();
    focusTrigger('keyboard');
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') installFocusModality(document);
});

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
      :aria-controls="listboxId"
      :aria-disabled="blocked || undefined"
      :aria-invalid="ariaInvalid"
      :data-validation="props.validation"
      @click="onTriggerClick"
      @keydown="onTriggerKeydown"
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
      :id="listboxId"
      class="ui-overlay-panel ui-select__popover material-glass-elevated nv-presence"
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
        tabindex="-1"
        role="option"
        :disabled="option.disabled"
        :aria-selected="String(option.value) === String(props.modelValue ?? '')"
        @pointerdown="onOptionPointerDown(option, $event)"
        @click="onOptionClick(option)"
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
