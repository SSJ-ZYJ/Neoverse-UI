<script setup lang="ts">
import { computed, ref, useAttrs, useId, watch } from 'vue';
import TerminalPromptSegments from './TerminalPromptSegments.vue';
import type { TerminalPromptProps, TerminalPromptSegment } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TerminalPromptProps>(), {
  type: 'text',
  symbol: '❯',
  segments: () => [],
  disabled: false,
  readonly: false,
  error: false,
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
defineSlots<{
  context?: () => unknown;
  segment?: (props: { segment: TerminalPromptSegment }) => unknown;
}>();
const attrs = useAttrs();
const generatedId = useId();
const inputElement = ref<HTMLInputElement | null>(null);
const focused = ref(false);
const composing = ref(false);
const atEnd = ref(false);
const scrollOffset = ref(0);
const resolvedId = computed(
  () => props.id ?? (typeof attrs.id === 'string' ? attrs.id : generatedId),
);
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, id: _id, ...rest } = attrs;
  return rest;
});
const value = computed({
  get: () => props.modelValue ?? '',
  set: (next: string) => emit('update:modelValue', next),
});
const suffix = computed(() => {
  const suggestion = props.suggestion ?? '';
  if (
    !focused.value ||
    !atEnd.value ||
    composing.value ||
    props.disabled ||
    props.readonly ||
    props.type === 'password' ||
    !value.value ||
    !suggestion.startsWith(value.value)
  )
    return '';
  return suggestion.slice(value.value.length);
});

function syncEditor() {
  const editor = inputElement.value;
  atEnd.value =
    !!editor &&
    editor.selectionStart === editor.value.length &&
    editor.selectionEnd === editor.value.length;
  scrollOffset.value = editor?.scrollLeft ?? 0;
}
watch(() => [props.modelValue, props.suggestion], syncEditor, { flush: 'post' });

function focus() {
  inputElement.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <div
    :class="['ui-terminal-prompt', attrs.class]"
    :style="attrs.style"
    :data-error="props.error ? 'true' : 'false'"
    :data-disabled="props.disabled ? 'true' : 'false'"
  >
    <div v-if="props.segments.length > 0 || $slots.context" class="ui-terminal-prompt__context">
      <slot name="context">
        <TerminalPromptSegments :segments="props.segments">
          <template #segment="{ segment }">
            <slot name="segment" :segment="segment">{{ segment.label }}</slot>
          </template>
        </TerminalPromptSegments>
      </slot>
    </div>
    <label class="ui-terminal-prompt__entry" :for="resolvedId">
      <span class="ui-terminal-prompt__symbol" aria-hidden="true">{{ props.symbol }}</span>
      <span class="ui-terminal-prompt__input-wrap">
        <span v-if="suffix" class="ui-terminal-prompt__ghost" aria-hidden="true">
          <span :style="{ transform: `translateX(${-scrollOffset}px)` }"
            ><span class="ui-terminal-prompt__ghost-prefix">{{ value }}</span
            ><span class="ui-terminal-prompt__ghost-suffix">{{ suffix }}</span></span
          >
        </span>
        <input
          ref="inputElement"
          v-model="value"
          v-bind="forwardedAttrs"
          :id="resolvedId"
          class="ui-terminal-prompt__editor"
          :type="props.type"
          :disabled="props.disabled"
          :readonly="props.readonly"
          :aria-label="props.label"
          :aria-invalid="props.error || undefined"
          :autocomplete="typeof attrs.autocomplete === 'string' ? attrs.autocomplete : 'off'"
          :autocapitalize="typeof attrs.autocapitalize === 'string' ? attrs.autocapitalize : 'off'"
          :spellcheck="attrs.spellcheck === true || attrs.spellcheck === 'true'"
          @focus="focused = true; syncEditor()"
          @blur="focused = false"
          @input="syncEditor"
          @select="syncEditor"
          @click="syncEditor"
          @keyup="syncEditor"
          @scroll="syncEditor"
          @compositionstart="composing = true"
          @compositionend="composing = false; syncEditor()"
        >
      </span>
    </label>
  </div>
</template>
