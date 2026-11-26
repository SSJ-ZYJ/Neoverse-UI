<script setup lang="ts">
import { attachSelectionIndicator } from '@neoverse-ui/motion';
import { getSurfaceClass } from '@neoverse-ui/tokens';
import type { ComponentPublicInstance } from 'vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import type { TabsProps } from '../../types';

const props = defineProps<TabsProps>();
const presentation = computed(() => props.variant ?? 'glass');
const surface = computed(() =>
  presentation.value === 'glass'
    ? props.variant === undefined
      ? 'auto'
      : 'glass-subtle'
    : undefined,
);
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const id = useId();
const internalValue = ref(
  props.defaultValue ?? props.options.find((option) => !option.disabled)?.value,
);
const focusedIndex = ref<number | null>(null);
const tabRefs = ref<Array<HTMLButtonElement | null>>([]);
const track = ref<HTMLElement | null>(null);
const indicator = ref<HTMLElement | null>(null);
let disposeIndicator: (() => void) | undefined;
onMounted(() => {
  if (track.value && indicator.value) {
    disposeIndicator = attachSelectionIndicator(
      track.value,
      indicator.value,
      '[role="tab"][aria-selected="true"]',
    );
  }
});
onBeforeUnmount(() => disposeIndicator?.());
const enabled = computed(() =>
  props.options.flatMap((option, index) => (option.disabled ? [] : [index])),
);
const selected = computed(() => {
  const value = props.modelValue ?? internalValue.value;
  return props.options.some((option) => !option.disabled && option.value === value)
    ? value
    : props.options.find((option) => !option.disabled)?.value;
});
const selectedIndex = computed(() =>
  props.options.findIndex((option) => option.value === selected.value),
);
const tabStop = computed(() =>
  focusedIndex.value !== null && enabled.value.includes(focusedIndex.value)
    ? focusedIndex.value
    : selectedIndex.value,
);
function tabId(index: number): string {
  return `${id}-tab-${index}`;
}
function select(index: number, shouldFocus = false): void {
  const option = props.options[index];
  if (!option || option.disabled) return;
  const changed = selected.value !== option.value;
  focusedIndex.value = index;
  if (props.modelValue === undefined) internalValue.value = option.value;
  if (changed) {
    emit('update:modelValue', option.value);
  }
  if (shouldFocus) void nextTick().then(() => tabRefs.value[index]?.focus());
}
function handleKeydown(event: KeyboardEvent, index: number): void {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const options = enabled.value;
  if (options.length === 0) return;
  const at = options.indexOf(index);
  const next =
    event.key === 'Home'
      ? options[0]
      : event.key === 'End'
        ? options[options.length - 1]
        : options[(at + (event.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length];
  if (next !== undefined) select(next, true);
}
function setRef(element: Element | ComponentPublicInstance | null, index: number): void {
  tabRefs.value[index] = element as HTMLButtonElement | null;
}
</script>

<template>
  <div class="ui-tabs" :data-variant="presentation">
    <div
      ref="track"
      class="ui-tabs__list"
      :class="surface && getSurfaceClass(surface, 'group')"
      :data-surface="surface"
      :data-neoverse-surface-hover="surface ? 'static' : undefined"
      role="tablist"
      :aria-label="ariaLabel"
      aria-orientation="horizontal"
    >
      <span ref="indicator" class="ui-tabs__indicator" aria-hidden="true" data-ready="false" />
      <button
        v-for="(option, index) in options"
        :id="tabId(index)"
        :key="option.value"
        :ref="(element) => setRef(element, index)"
        type="button"
        role="tab"
        class="ui-tabs__tab"
        :class="{ 'ui-tabs__tab--active': selected === option.value }"
        :aria-selected="selected === option.value"
        :aria-controls="`${id}-panel`"
        :tabindex="tabStop === index ? 0 : -1"
        :disabled="option.disabled"
        @focus="focusedIndex = index"
        @click="select(index)"
        @keydown="handleKeydown($event, index)"
      >
        {{ option.label }}
      </button>
    </div>
    <div
      v-if="selected !== undefined"
      :id="`${id}-panel`"
      class="ui-tabs__panel"
      role="tabpanel"
      :aria-labelledby="tabId(selectedIndex)"
    >
      <div :key="selected" class="nv-appear" data-neoverse-motion="fade">
        <slot :value="selected" />
      </div>
    </div>
  </div>
</template>
