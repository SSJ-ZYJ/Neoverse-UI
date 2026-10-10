<script setup lang="ts">
import { computed, useAttrs, useId, type VNodeChild } from 'vue';
import type { FieldControlAttrs, FieldProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<FieldProps>(), {
  validation: 'none',
  required: false,
  disabled: false,
});
const attrs = useAttrs();
const slots = defineSlots<{
  default?: (props: { controlAttrs: FieldControlAttrs }) => VNodeChild;
  label?: () => VNodeChild;
  description?: () => VNodeChild;
  message?: () => VNodeChild;
}>();
const generatedId = useId();
const descriptionId = computed(
  () => props.descriptionId ?? `${props.controlId ?? generatedId}-description`,
);
const messageId = computed(() => props.messageId ?? `${props.controlId ?? generatedId}-message`);
const hasLabel = computed(() => Boolean(props.label || slots.label || props.required));
const hasDescription = computed(() => Boolean(props.description || slots.description));
const hasMessage = computed(() => Boolean(props.message || slots.message));
const controlAttrs = computed<FieldControlAttrs>(() => {
  const describedBy = [
    hasDescription.value ? descriptionId.value : undefined,
    hasMessage.value ? messageId.value : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  return {
    ...(props.controlId ? { id: props.controlId } : {}),
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(props.required ? { required: true } : {}),
    ...(props.disabled ? { disabled: true } : {}),
  };
});
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <div
    v-bind="forwardedAttrs"
    class="ui-field"
    :class="attrs.class"
    :style="attrs.style"
    :data-validation="props.validation"
    :data-disabled="props.disabled || undefined"
    :aria-disabled="props.disabled || undefined"
  >
    <div v-if="hasLabel" class="ui-field__label-row">
      <component
        :is="props.controlId ? 'label' : 'span'"
        class="ui-field__label"
        :for="props.controlId || undefined"
      >
        <slot name="label">{{ props.label }}</slot>
      </component>
      <span v-if="props.required" class="ui-field__required" aria-hidden="true">*</span>
    </div>

    <p v-if="hasDescription" :id="descriptionId" class="ui-field__description">
      <slot name="description">{{ props.description }}</slot>
    </p>

    <div class="ui-field__control">
      <slot :control-attrs="controlAttrs" />
    </div>

    <p v-if="hasMessage" :id="messageId" class="ui-field__message">
      <slot name="message">{{ props.message }}</slot>
    </p>
  </div>
</template>
