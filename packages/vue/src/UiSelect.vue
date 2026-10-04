<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { SelectProps } from './types';

defineOptions({ inheritAttrs: false });

const props = defineProps<SelectProps>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, value: _value, ...rest } = attrs;
  return rest;
});

function onChange(event: Event) {
  emit('update:modelValue', (event.currentTarget as HTMLSelectElement).value);
}
</script>

<template>
  <select
    v-bind="forwardedAttrs"
    class="ui-select"
    :class="attrs.class"
    :style="attrs.style"
    :value="props.modelValue"
    @change="onChange"
  >
    <slot />
  </select>
</template>
