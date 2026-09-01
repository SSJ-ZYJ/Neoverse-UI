<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import { computed, nextTick, ref, useAttrs, watch } from 'vue';
import { controlFocusClasses, segmentedTransitionClasses } from './classes';
import type { SegmentedControlProps, SegmentedControlSize, SegmentOption } from './types';
import UiLoadingIndicator from './UiLoadingIndicator.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SegmentedControlProps>(), {
  size: 'sm',
  disabled: false,
  loading: false,
});

const emit = defineEmits<(event: 'update:modelValue', value: string) => void>();

const attrs = useAttrs();
const ariaBusy = computed<'true' | 'false' | undefined>(() => {
  if (props.loading) {
    return 'true';
  }

  const value = attrs['aria-busy'];
  if (value === true || value === 'true') {
    return 'true';
  }
  if (value === false || value === 'false') {
    return 'false';
  }

  return undefined;
});
const internalValue = ref<string | undefined>(initialValue(props.options, props.defaultValue));
const focusedIndex = ref<number | null>(null);
const optionRefs = ref<Array<HTMLButtonElement | null>>([]);

const optionSizeClasses: Record<SegmentedControlSize, string> = {
  sm: 'h-7 px-2 text-caption',
  md: 'h-9 px-3 text-label',
  lg: 'h-10 px-3 text-label',
};

const selectedOptionClasses = 'ui-segmented-control__option--active text-primary';
const unselectedOptionClasses = 'text-secondary';
const disabledOptionClasses = 'disabled:text-disabled disabled:cursor-not-allowed';

const isControlled = computed(() => props.modelValue !== undefined);
const currentValue = computed(() => (isControlled.value ? props.modelValue : internalValue.value));
const activeIndex = computed(() =>
  props.options.findIndex((option) => !option.disabled && option.value === currentValue.value),
);
const segmentStyle = computed(() => ({
  '--segment-count': Math.max(props.options.length, 1),
  '--segment-index': Math.max(activeIndex.value, 0),
}));
const enabledIndexes = computed(() =>
  props.options.flatMap((option, index) => (option.disabled ? [] : [index])),
);
const rovingIndex = computed(() => {
  if (focusedIndex.value !== null && enabledIndexes.value.includes(focusedIndex.value)) {
    return focusedIndex.value;
  }

  const selectedIndex = props.options.findIndex(
    (option) => !option.disabled && option.value === currentValue.value,
  );

  return selectedIndex >= 0 ? selectedIndex : (enabledIndexes.value[0] ?? -1);
});

const classes = computed(() => [
  'ui-segmented-control inline-flex items-center gap-1 rounded-control p-1',
]);
const forwardedAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

function firstEnabledValue(options: readonly SegmentOption[]): string | undefined {
  return options.find((option) => !option.disabled)?.value;
}

function initialValue(
  options: readonly SegmentOption[],
  defaultValue: string | undefined,
): string | undefined {
  if (
    defaultValue !== undefined &&
    options.some((option) => !option.disabled && option.value === defaultValue)
  ) {
    return defaultValue;
  }

  return firstEnabledValue(options);
}

function hasEnabledValue(value: string | undefined, options: readonly SegmentOption[]): boolean {
  return (
    value !== undefined && options.some((option) => !option.disabled && option.value === value)
  );
}

function validateOptions(options: readonly SegmentOption[]): void {
  if (!import.meta.env.DEV) {
    return;
  }

  const seenValues = new Set<string>();
  for (const option of options) {
    if (seenValues.has(option.value)) {
      console.warn(
        `[UiSegmentedControl] Duplicate option value "${option.value}" makes selection ambiguous.`,
      );
    }
    seenValues.add(option.value);
  }
}

watch(
  () => props.options,
  (options) => {
    validateOptions(options);

    if (!isControlled.value && !hasEnabledValue(internalValue.value, options)) {
      internalValue.value = firstEnabledValue(options);
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined && hasEnabledValue(value, props.options)) {
      internalValue.value = value;
    }
  },
);

function isSelected(option: SegmentOption): boolean {
  return !option.disabled && option.value === currentValue.value;
}

function selectOption(option: SegmentOption, index: number): void {
  if (props.disabled || props.loading || option.disabled) {
    return;
  }

  focusedIndex.value = index;
  const wasSelected = isSelected(option);
  internalValue.value = option.value;

  if (!wasSelected) {
    emit('update:modelValue', option.value);
  }
}

function focusOption(index: number): void {
  focusedIndex.value = index;
  void nextTick(() => optionRefs.value[index]?.focus());
}

function selectAndFocus(index: number): void {
  const option = props.options[index];
  if (option === undefined || props.disabled || props.loading || option.disabled) {
    return;
  }

  selectOption(option, index);
  focusOption(index);
}

function handleKeydown(event: KeyboardEvent, index: number): void {
  if (props.disabled || props.loading) {
    return;
  }

  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    const targetIndex =
      event.key === 'Home'
        ? enabledIndexes.value[0]
        : enabledIndexes.value[enabledIndexes.value.length - 1];
    if (targetIndex !== undefined) {
      selectAndFocus(targetIndex);
    }
    return;
  }

  const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
  if (direction === 0) {
    return;
  }

  event.preventDefault();
  const currentPosition = enabledIndexes.value.indexOf(index);
  if (currentPosition < 0 || enabledIndexes.value.length === 0) {
    return;
  }

  const nextPosition =
    (currentPosition + direction + enabledIndexes.value.length) % enabledIndexes.value.length;
  const targetIndex = enabledIndexes.value[nextPosition];
  if (targetIndex !== undefined) {
    selectAndFocus(targetIndex);
  }
}

function setOptionRef(element: Element | ComponentPublicInstance | null, index: number): void {
  optionRefs.value[index] = element as HTMLButtonElement | null;
}

function optionClasses(option: SegmentOption): string[] {
  return [
    'ui-segmented-control__option rounded-control-inner',
    segmentedTransitionClasses,
    controlFocusClasses,
    'font-label',
    optionSizeClasses[props.size as SegmentedControlSize] ?? optionSizeClasses.md,
    isSelected(option) ? selectedOptionClasses : unselectedOptionClasses,
    disabledOptionClasses,
  ];
}
</script>

<template>
  <div
    v-bind="forwardedAttrs"
    :class="[classes, attrs.class]"
    :style="[attrs.style, segmentStyle]"
    role="radiogroup"
    aria-orientation="horizontal"
    :aria-disabled="props.disabled || undefined"
    :aria-busy="ariaBusy"
  >
    <span class="ui-segmented-control__options">
      <span v-if="activeIndex >= 0" class="ui-segmented-control__slider" aria-hidden="true" />
      <!-- biome-ignore lint/a11y/useSemanticElements: Custom radio widget needs button keyboard behavior. -->
      <button
        v-for="(option, index) in props.options"
        :key="`${option.value}-${index}`"
        :ref="(element) => setOptionRef(element, index)"
        type="button"
        role="radio"
        :aria-checked="isSelected(option)"
        :tabindex="index === rovingIndex ? 0 : -1"
        :disabled="props.disabled || props.loading || option.disabled"
        :class="optionClasses(option)"
        @click="selectOption(option, index)"
        @keydown="handleKeydown($event, index)"
        @focus="focusedIndex = index"
      >
        {{ option.label }}
      </button>
    </span>
    <span
      v-if="props.loading"
      class="ui-segmented-control__loading ml-1 inline-flex size-4 items-center justify-center"
      aria-hidden="true"
    >
      <UiLoadingIndicator />
    </span>
  </div>
</template>
