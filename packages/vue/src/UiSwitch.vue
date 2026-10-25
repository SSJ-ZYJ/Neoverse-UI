<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';
import { resolveAriaInvalid, restoreControlledChecked } from './form-control';
import type { SwitchProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SwitchProps>(), {
  modelValue: false,
  validation: 'none',
  disabled: false,
  readonly: false,
});
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const attrs = useAttrs();
const generatedId = useId();
const inputId = computed(() => (typeof attrs.id === 'string' ? attrs.id : generatedId));
const labelId = computed(() => `${inputId.value}-label`);
const ariaLabelledby = computed(() => {
  if (typeof attrs['aria-labelledby'] === 'string') return attrs['aria-labelledby'];
  if (typeof attrs['aria-label'] === 'string') return undefined;
  return labelId.value;
});
const forwardedAttrs = computed(() => {
  const {
    class: _class,
    style: _style,
    id: _id,
    checked: _checked,
    type: _type,
    role: _role,
    'aria-invalid': _ariaInvalid,
    ...rest
  } = attrs;
  return rest;
});
const ariaInvalid = computed(() => resolveAriaInvalid(attrs['aria-invalid'], props.validation));

function onClick(event: MouseEvent) {
  if (props.readonly) event.preventDefault();
}

function onChange(event: Event) {
  if (props.readonly) return;
  const input = event.currentTarget as HTMLInputElement;
  emit('update:modelValue', input.checked);
  // The switch mirrors state into aria-checked, so restore both.
  restoreControlledChecked(input, () => props.modelValue, true);
}
</script>

<template>
  <span
    class="ui-choice ui-switch"
    :class="attrs.class"
    :style="attrs.style"
    :data-validation="props.validation"
    :data-disabled="props.disabled || undefined"
    :data-readonly="props.readonly || undefined"
  >
    <input
      v-bind="forwardedAttrs"
      :id="inputId"
      class="ui-choice__native ui-switch__native"
      type="checkbox"
      role="switch"
      :checked="props.modelValue"
      :disabled="props.disabled"
      :aria-checked="props.modelValue"
      :aria-disabled="props.disabled || props.readonly || undefined"
      :aria-invalid="ariaInvalid"
      :aria-labelledby="ariaLabelledby"
      @click="onClick"
      @change="onChange"
    >
    <span class="ui-choice__control ui-switch__control" aria-hidden="true">
      <span class="ui-switch__thumb" />
    </span>
    <span :id="labelId" class="ui-choice__content"><slot /></span>
  </span>
</template>
