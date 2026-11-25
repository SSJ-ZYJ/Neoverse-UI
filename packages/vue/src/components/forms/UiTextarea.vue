<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useAttrs, watch } from 'vue';
import type { TextareaProps } from '../../types';
import {
  type CaretPoint,
  deferPointerFocus,
  slideCaret2d,
  watchCaretSelection,
} from '../motion/caret-motion';
import { resolveAriaInvalid } from './form-control';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TextareaProps>(), {
  validation: 'none',
  disabled: false,
  readonly: false,
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const textareaElement = ref<HTMLTextAreaElement>();
const caretGlyph = ref<HTMLElement>();
const focused = ref(false);
const composing = ref(false);
const caretOffset = ref<number | null>(null);
const caretPrefix = ref('');
const caretSuffix = ref('');
const caretText = ref('');
const caretWidth = ref(0);
const scrollLeft = ref(0);
const scrollTop = ref(0);
const caretHolding = ref(false);
let holdTimer: ReturnType<typeof setTimeout> | undefined;
let caretPoint: CaretPoint | null = null;
let lastScrollLeft = 0;
let lastScrollTop = 0;
let pointerFocusing = false;
let cancelPointerFocus: (() => void) | undefined;
let stopSelectionWatch: (() => void) | undefined;

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

// Mirror the shared breathing and gliding caret in two axes; selection, IME
// composition and locked states keep native editing behavior.
const showsCaret = computed(
  () =>
    focused.value &&
    !composing.value &&
    !props.disabled &&
    !props.readonly &&
    caretOffset.value !== null,
);

function clearPointerFocus() {
  pointerFocusing = false;
  cancelPointerFocus?.();
  cancelPointerFocus = undefined;
}

function syncCaret() {
  clearPointerFocus();
  const editor = textareaElement.value;
  if (!editor) {
    caretOffset.value = null;
    return;
  }
  const start = editor.selectionStart;
  const caret = start !== null && start === editor.selectionEnd ? start : null;
  caretOffset.value = caret;
  caretPrefix.value = caret === null ? '' : editor.value.slice(0, caret);
  caretSuffix.value = caret === null ? '' : editor.value.slice(caret);
  caretText.value = editor.value;
  caretWidth.value = editor.clientWidth;
  scrollLeft.value = editor.scrollLeft;
  scrollTop.value = editor.scrollTop;
}

function holdCaret() {
  if (!showsCaret.value) return;
  caretHolding.value = true;
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    caretHolding.value = false;
  }, 600);
}

watch(focused, (active) => {
  stopSelectionWatch?.();
  stopSelectionWatch = active
    ? watchCaretSelection(() => textareaElement.value, syncCaret)
    : undefined;
});
onBeforeUnmount(() => {
  clearTimeout(holdTimer);
  clearPointerFocus();
  stopSelectionWatch?.();
});
watch(
  () => props.modelValue,
  () => {
    if (focused.value) syncCaret();
  },
  { flush: 'post' },
);
watch(
  [caretPrefix, scrollLeft, scrollTop, showsCaret, caretText],
  () => {
    const scrolled = scrollLeft.value !== lastScrollLeft || scrollTop.value !== lastScrollTop;
    caretPoint = slideCaret2d(caretGlyph.value, caretPoint, caretText.value, scrolled);
    lastScrollLeft = scrollLeft.value;
    lastScrollTop = scrollTop.value;
  },
  { flush: 'post' },
);

function onPointerDown(event: PointerEvent) {
  (event.currentTarget as HTMLElement).dataset.neoverseFocusOrigin = 'pointer';
  if (!focused.value) pointerFocusing = true;
}

function onFocus() {
  focused.value = true;
  if (pointerFocusing) {
    cancelPointerFocus?.();
    cancelPointerFocus = deferPointerFocus(syncCaret);
  } else {
    syncCaret();
  }
}

function onBlur(event: FocusEvent) {
  delete (event.currentTarget as HTMLElement).dataset.neoverseFocusOrigin;
  clearPointerFocus();
  focused.value = false;
  caretOffset.value = null;
}
</script>

<template>
  <span
    class="ui-textarea-shell"
    :class="attrs.class"
    :style="attrs.style"
    :data-caret="showsCaret ? 'overlay' : 'native'"
  >
    <textarea
      ref="textareaElement"
      v-model="value"
      v-bind="forwardedAttrs"
      class="ui-textarea"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :data-validation="props.validation"
      :aria-invalid="ariaInvalid"
      @pointerdown="onPointerDown"
      @focus="onFocus"
      @blur="onBlur"
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
    />
    <span
      v-if="showsCaret"
      class="ui-textarea-caret"
      :class="{ 'ui-textarea-caret--holding': caretHolding }"
      aria-hidden="true"
    >
      <span
        class="ui-textarea-caret__mirror"
        :style="{
          width: caretWidth > 0 ? `${caretWidth}px` : undefined,
          transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
        }"
        ><span class="ui-textarea-caret__prefix">{{ caretPrefix }}</span
        ><span class="ui-textarea-caret__anchor"
          ><span ref="caretGlyph" class="ui-textarea-caret__glyph"></span></span
        ><span class="ui-textarea-caret__suffix">{{ caretSuffix || '\u200b' }}</span></span
      >
    </span>
  </span>
</template>
