<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { resolveAriaInvalid } from './form-control';
import type { FormControlValue, RadioGroupProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<RadioGroupProps>(), {
  validation: 'none',
  disabled: false,
  readonly: false,
});
const emit = defineEmits<{ 'update:modelValue': [value: FormControlValue] }>();
const attrs = useAttrs();
const forwardedAttrs = computed(() => {
  const {
    class: _class,
    style: _style,
    'aria-label': _ariaLabel,
    'aria-invalid': _ariaInvalid,
    ...rest
  } = attrs;
  return rest;
});
const ariaInvalid = computed(() => resolveAriaInvalid(attrs['aria-invalid'], props.validation));
const ariaLabel = computed(() => props.ariaLabel ?? (attrs['aria-label'] as string | undefined));

function isSelected(value: FormControlValue): boolean {
  return String(value) === String(props.modelValue ?? '');
}

function onOptionClick(event: MouseEvent) {
  if (props.readonly) event.preventDefault();
}

function onOptionChange(value: FormControlValue, event: Event) {
  if (props.readonly || !(event.currentTarget as HTMLInputElement).checked) return;
  emit('update:modelValue', value);
}
</script>

<template>
  <div
    v-bind="forwardedAttrs"
    class="ui-radio-group"
    :class="attrs.class"
    :style="attrs.style"
    role="radiogroup"
    :aria-label="ariaLabel"
    :aria-disabled="props.disabled || props.readonly || undefined"
    :aria-invalid="ariaInvalid"
    :data-validation="props.validation"
    :data-disabled="props.disabled || undefined"
    :data-readonly="props.readonly || undefined"
  >
    <label
      v-for="option in props.options"
      :key="String(option.value)"
      class="ui-choice ui-radio"
      :data-disabled="props.disabled || option.disabled || undefined"
      :data-readonly="props.readonly || undefined"
    >
      <input
        class="ui-choice__native"
        type="radio"
        :name="props.name"
        :value="option.value"
        :checked="isSelected(option.value)"
        :disabled="props.disabled || option.disabled"
        :aria-disabled="props.disabled || option.disabled || props.readonly || undefined"
        :aria-invalid="ariaInvalid"
        @click="onOptionClick"
        @change="onOptionChange(option.value, $event)"
      >
      <span class="ui-choice__control" aria-hidden="true">
        <span class="ui-choice__indicator" />
      </span>
      <span class="ui-choice__content">
        <span class="ui-choice__label">{{ option.label }}</span>
        <span v-if="option.description" class="ui-choice__description"
          >{{ option.description }}</span
        >
      </span>
    </label>
  </div>
</template>
