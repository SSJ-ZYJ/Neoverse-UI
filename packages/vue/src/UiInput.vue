<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue';
import { resolveAriaInvalid } from './form-control';
import type { InputProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<InputProps>(), {
  validation: 'none',
  disabled: false,
  readonly: false,
  incrementLabel: 'Increase value',
  decrementLabel: 'Decrease value',
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const numberInput = ref<HTMLInputElement>();
const isNumber = computed(() => attrs.type === 'number');
const forwardedAttrs = computed(() => {
  const {
    class: _class,
    style: _style,
    value: _value,
    'aria-invalid': _ariaInvalid,
    ...rest
  } = attrs;
  return rest;
});
const ariaInvalid = computed(() => resolveAriaInvalid(attrs['aria-invalid'], props.validation));

function onInput(event: Event) {
  emit('update:modelValue', (event.currentTarget as HTMLInputElement).value);
}

function stepValue(direction: number) {
  const input = numberInput.value;
  if (!input || input.disabled || input.readOnly) return;
  const previous = input.value;
  if (input.step === 'any') {
    const next = Number(((input.valueAsNumber || 0) + direction).toPrecision(12));
    input.valueAsNumber = Math.min(
      input.max === '' ? Infinity : Number(input.max),
      Math.max(input.min === '' ? -Infinity : Number(input.min), next),
    );
  } else if (direction > 0) {
    input.stepUp();
  } else {
    input.stepDown();
  }
  input.dataset.neoverseFocusOrigin = 'pointer';
  input.focus({ preventScroll: true });
  if (input.value !== previous) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function onPointerDown(event: PointerEvent) {
  (event.currentTarget as HTMLElement).dataset.neoverseFocusOrigin = 'pointer';
}

function onBlur(event: FocusEvent) {
  delete (event.currentTarget as HTMLElement).dataset.neoverseFocusOrigin;
}
</script>

<template>
  <span v-if="isNumber" class="ui-input-number">
    <input
      ref="numberInput"
      v-bind="forwardedAttrs"
      class="ui-input"
      :class="attrs.class"
      :style="attrs.style"
      :value="props.modelValue"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :data-validation="props.validation"
      :aria-invalid="ariaInvalid"
      @input="onInput"
      @pointerdown="onPointerDown"
      @blur="onBlur"
    >
    <span class="ui-input-number__steps">
      <button
        v-for="direction in [1, -1]"
        :key="direction"
        class="ui-input-number__step"
        type="button"
        tabindex="-1"
        :aria-label="direction > 0 ? props.incrementLabel : props.decrementLabel"
        :title="direction > 0 ? props.incrementLabel : props.decrementLabel"
        :disabled="props.disabled || props.readonly"
        @mousedown.prevent
        @click.prevent="stepValue(direction)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" class="ui-input-number__indicator">
          <path :d="direction > 0 ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'" />
        </svg>
      </button>
    </span>
  </span>
  <input
    v-else
    v-bind="forwardedAttrs"
    class="ui-input"
    :class="attrs.class"
    :style="attrs.style"
    :value="props.modelValue"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :data-validation="props.validation"
    :aria-invalid="ariaInvalid"
    @input="onInput"
    @pointerdown="onPointerDown"
    @blur="onBlur"
  >
</template>
