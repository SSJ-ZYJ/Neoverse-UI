<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { TextareaProps } from './types';

defineOptions({ inheritAttrs: false });

const props = defineProps<TextareaProps>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, value: _value, ...rest } = attrs;
  return rest;
});

function onInput(event: Event) {
  emit('update:modelValue', (event.currentTarget as HTMLTextAreaElement).value);
}
</script>

<template>
  <textarea
    v-bind="forwardedAttrs"
    class="ui-textarea"
    :class="attrs.class"
    :style="attrs.style"
    :value="props.modelValue"
    @input="onInput"
  />
</template>
