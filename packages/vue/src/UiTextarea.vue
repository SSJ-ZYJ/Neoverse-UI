<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { resolveAriaInvalid } from './form-control';
import type { TextareaProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TextareaProps>(), {
  validation: 'none',
  disabled: false,
  readonly: false,
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
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

const value = computed({
  get: () => props.modelValue ?? '',
  set: (next: string) => emit('update:modelValue', next),
});

function onPointerDown(event: PointerEvent) {
  (event.currentTarget as HTMLElement).dataset.neoverseFocusOrigin = 'pointer';
}

function onBlur(event: FocusEvent) {
  delete (event.currentTarget as HTMLElement).dataset.neoverseFocusOrigin;
}
</script>

<template>
  <span class="ui-textarea-shell">
    <textarea
      v-model="value"
      v-bind="forwardedAttrs"
      class="ui-textarea"
      :class="attrs.class"
      :style="attrs.style"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :data-validation="props.validation"
      :aria-invalid="ariaInvalid"
      @pointerdown="onPointerDown"
      @blur="onBlur"
    />
  </span>
</template>
