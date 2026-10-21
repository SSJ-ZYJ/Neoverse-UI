<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';
import { resolveAriaInvalid } from './form-control';
import type { CheckboxProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<CheckboxProps>(), {
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
  emit('update:modelValue', (event.currentTarget as HTMLInputElement).checked);
}
</script>

<template>
  <span
    class="ui-choice ui-checkbox"
    :class="attrs.class"
    :style="attrs.style"
    :data-validation="props.validation"
    :data-disabled="props.disabled || undefined"
    :data-readonly="props.readonly || undefined"
  >
    <input
      v-bind="forwardedAttrs"
      :id="inputId"
      class="ui-choice__native"
      type="checkbox"
      :checked="props.modelValue"
      :disabled="props.disabled"
      :aria-disabled="props.disabled || props.readonly || undefined"
      :aria-invalid="ariaInvalid"
      :aria-labelledby="ariaLabelledby"
      @click="onClick"
      @change="onChange"
    >
    <span class="ui-choice__control" aria-hidden="true">
      <svg class="ui-choice__indicator" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5 12 4 4L19 6" />
      </svg>
    </span>
    <span :id="labelId" class="ui-choice__content"><slot /></span>
  </span>
</template>
