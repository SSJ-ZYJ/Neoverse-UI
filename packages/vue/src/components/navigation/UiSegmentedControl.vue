<script setup lang="ts">
import { attachSegmentedControlSlider } from '@neoverse-ui/motion';
import { getSurfaceClass } from '@neoverse-ui/tokens';
import type { ComponentPublicInstance } from 'vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue';
import type { SegmentedControlProps, SegmentedControlVariant, SegmentOption } from '../../types';

defineOptions({ inheritAttrs: false });

// Declare the runtime discriminator in the SFC so a warm Vite watch can recompile it.
const props = withDefaults(
  defineProps<SegmentedControlProps & { variant?: SegmentedControlVariant }>(),
  {
    size: 'sm',
    shape: 'pill',
    variant: 'text',
    disabled: false,
    surface: 'auto',
  },
);

const emit = defineEmits<(event: 'update:modelValue', value: string) => void>();

const attrs = useAttrs();
const ariaLabel = computed(() => props.ariaLabel ?? (attrs['aria-label'] as string | undefined));
const internalValue = ref<string | undefined>(initialValue(props.options, props.defaultValue));
const focusedIndex = ref<number | null>(null);
const optionRefs = ref<Array<HTMLButtonElement | null>>([]);
const optionsElement = ref<HTMLElement | null>(null);
let detachSlider: (() => void) | undefined;

const selectedOptionClasses = 'ui-segmented-control__option--active';
const unselectedOptionClasses = '';

const isControlled = computed(() => props.modelValue !== undefined);
const currentValue = computed(() => (isControlled.value ? props.modelValue : internalValue.value));
const activeIndex = computed(() =>
  props.options.findIndex((option) => !option.disabled && option.value === currentValue.value),
);
const segmentStyle = computed(() => ({
  '--segment-count': Math.max(props.options.length, 1),
  '--segment-index': Math.max(activeIndex.value, 0),
}));

onMounted(() => {
  if (optionsElement.value) detachSlider = attachSegmentedControlSlider(optionsElement.value);
});
onBeforeUnmount(() => detachSlider?.());

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
  'ui-segmented-control',
  `ui-segmented-control--${props.shape}`,
  getSurfaceClass(props.surface, 'group'),
]);
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, 'aria-label': _ariaLabel, ...rest } = attrs;
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
  if (props.disabled || option.disabled) {
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
  if (option === undefined || props.disabled || option.disabled) {
    return;
  }

  selectOption(option, index);
  focusOption(index);
}

function handleKeydown(event: KeyboardEvent, index: number): void {
  if (props.disabled) {
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

function handleFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget;
  if (next instanceof Node && optionsElement.value?.contains(next)) return;
  focusedIndex.value = null;
}

function setOptionRef(element: Element | ComponentPublicInstance | null, index: number): void {
  optionRefs.value[index] = element as HTMLButtonElement | null;
}

function optionClasses(option: SegmentOption): string[] {
  return [
    'ui-segmented-control__option',
    isSelected(option) ? selectedOptionClasses : unselectedOptionClasses,
  ];
}
</script>

<template>
  <div
    v-bind="forwardedAttrs"
    :aria-label="ariaLabel"
    :data-shape="props.shape"
    :data-variant="props.variant"
    :data-surface="props.surface"
    data-neoverse-surface-hover="static"
    :class="[classes, attrs.class]"
    :style="[attrs.style, segmentStyle]"
    role="radiogroup"
    aria-orientation="horizontal"
    :aria-disabled="props.disabled || undefined"
  >
    <span ref="optionsElement" class="ui-segmented-control__options" @focusout="handleFocusOut">
      <span v-if="activeIndex >= 0" class="ui-segmented-control__slider-track" aria-hidden="true">
        <span class="ui-segmented-control__slider" />
      </span>
      <!-- biome-ignore lint/a11y/useSemanticElements: Custom radio widget needs button keyboard behavior. -->
      <button
        v-for="(option, index) in props.options"
        :key="`${option.value}-${index}`"
        :ref="(element) => setOptionRef(element, index)"
        type="button"
        role="radio"
        :aria-checked="isSelected(option)"
        :aria-label="option.ariaLabel ?? (props.variant === 'icon' ? option.label : undefined)"
        :tabindex="index === rovingIndex ? 0 : -1"
        :disabled="props.disabled || option.disabled"
        :class="optionClasses(option)"
        @click="selectOption(option, index)"
        @keydown="handleKeydown($event, index)"
        @focus="focusedIndex = index"
      >
        <span
          v-if="props.variant === 'icon' && option.icon"
          class="ui-segmented-control__icon"
          aria-hidden="true"
        >
          <component :is="option.icon" />
        </span>
        <template v-else>{{ option.label }}</template>
      </button>
    </span>
  </div>
</template>
