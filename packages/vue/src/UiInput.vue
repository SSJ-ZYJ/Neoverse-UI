<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useAttrs, watch } from 'vue';
import { slideCaret } from './caret-motion';
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
const inputElement = ref<HTMLInputElement>();
const caretGlyph = ref<HTMLElement>();
const focused = ref(false);
const composing = ref(false);
const caretOffset = ref<number | null>(null);
const caretPrefix = ref('');
const caretText = ref('');
const scrollOffset = ref(0);
const caretHolding = ref(false);
let holdTimer: ReturnType<typeof setTimeout> | undefined;
let caretLeft: number | null = null;
let caretScroll = 0;
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
const value = computed({
  get: () => props.modelValue ?? '',
  set: (next: string | number) => emit('update:modelValue', String(next)),
});
// The shell mirrors a blinking caret; number spinners, masking, selection and
// assistive states keep the browser caret.
const showsCaret = computed(
  () =>
    focused.value &&
    !composing.value &&
    !props.disabled &&
    !props.readonly &&
    !isNumber.value &&
    attrs.type !== 'password' &&
    caretOffset.value !== null,
);

function syncCaret() {
  const editor = inputElement.value;
  if (!editor) {
    caretOffset.value = null;
    return;
  }
  // Types without a text selection read null here, so they keep the native caret.
  let caret: number | null = null;
  try {
    const start = editor.selectionStart;
    if (start !== null && start === editor.selectionEnd) caret = start;
  } catch {
    caret = null;
  }
  caretOffset.value = caret;
  caretPrefix.value = caret === null ? '' : editor.value.slice(0, caret);
  caretText.value = editor.value;
  scrollOffset.value = editor.scrollLeft;
}
// Editing keeps the caret solid for one blink cycle before it blinks again.
function holdCaret() {
  if (!showsCaret.value) return;
  caretHolding.value = true;
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    caretHolding.value = false;
  }, 600);
}
onBeforeUnmount(() => clearTimeout(holdTimer));
watch(() => props.modelValue, syncCaret, { flush: 'post' });
// A new caret position slides from the previous one instead of jumping.
watch(
  [caretPrefix, scrollOffset, showsCaret, caretText],
  () => {
    caretLeft = slideCaret(
      caretGlyph.value,
      caretLeft,
      caretText.value,
      scrollOffset.value !== caretScroll,
    );
    caretScroll = scrollOffset.value;
  },
  { flush: 'post' },
);

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
  focused.value = false;
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
  <span v-else class="ui-input-shell" :data-caret="showsCaret ? 'overlay' : 'native'">
    <span
      v-if="showsCaret"
      class="ui-input-caret"
      :class="{ 'ui-input-caret--holding': caretHolding }"
      aria-hidden="true"
    >
      <span :style="{ transform: `translateX(${-scrollOffset}px)` }"
        ><span class="ui-input-caret__prefix">{{ caretPrefix }}</span
        ><span ref="caretGlyph" class="ui-input-caret__glyph"></span></span
      >
    </span>
    <input
      ref="inputElement"
      v-model="value"
      v-bind="forwardedAttrs"
      class="ui-input"
      :class="attrs.class"
      :style="attrs.style"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :data-validation="props.validation"
      :aria-invalid="ariaInvalid"
      @focus="
        focused = true;
        syncCaret();
      "
      @input="
        syncCaret();
        holdCaret();
      "
      @select="
        syncCaret();
        holdCaret();
      "
      @click="syncCaret()"
      @keyup="syncCaret()"
      @scroll="syncCaret()"
      @compositionstart="composing = true"
      @compositionend="
        composing = false;
        syncCaret();
      "
      @pointerdown="onPointerDown"
      @blur="onBlur"
    >
  </span>
</template>
