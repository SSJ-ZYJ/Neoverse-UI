<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import {
  buttonBaseClasses,
  buttonSizeClasses,
  buttonVariantClasses,
  controlFocusClasses,
  controlTransitionClasses,
  disabledControlClasses,
} from './classes';
import type { ButtonProps, ButtonSize, ButtonVariant } from './types';
import UiLoadingIndicator from './UiLoadingIndicator.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
});

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

const classes = computed(() => [
  buttonBaseClasses,
  controlTransitionClasses,
  controlFocusClasses,
  disabledControlClasses,
  buttonVariantClasses[props.variant as ButtonVariant] ?? buttonVariantClasses.primary,
  buttonSizeClasses[props.size as ButtonSize] ?? buttonSizeClasses.md,
]);
</script>

<template>
  <button
    v-bind="attrs"
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :aria-busy="ariaBusy"
    :class="[classes, attrs.class]"
  >
    <span
      v-if="props.loading || $slots.leading"
      class="relative inline-flex shrink-0 items-center justify-center"
      :class="{ 'size-4': props.loading && !$slots.leading }"
    >
      <template v-if="props.loading">
        <span
          v-if="$slots.leading"
          class="invisible inline-flex items-center justify-center"
          aria-hidden="true"
        >
          <slot name="leading" />
        </span>
        <span class="absolute inset-0 inline-flex items-center justify-center" aria-hidden="true">
          <UiLoadingIndicator />
        </span>
      </template>
      <slot v-else name="leading" />
    </span>
    <span class="min-w-0">
      <slot />
    </span>
    <span v-if="$slots.trailing" class="inline-flex shrink-0 items-center justify-center">
      <slot name="trailing" />
    </span>
  </button>
</template>
