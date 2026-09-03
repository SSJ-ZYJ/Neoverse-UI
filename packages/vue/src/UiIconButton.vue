<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import {
  buttonBaseClasses,
  buttonVariantClasses,
  controlFocusClasses,
  controlTransitionClasses,
  disabledControlClasses,
  iconButtonSizeClasses,
} from './classes';
import type { ButtonSize, ButtonVariant, IconButtonProps } from './types';
import UiLoadingIndicator from './UiLoadingIndicator.vue';
import { updateButtonPointerGlow } from './button-pointer-glow';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<IconButtonProps>(), {
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
  'p-0',
  controlTransitionClasses,
  controlFocusClasses,
  disabledControlClasses,
  buttonVariantClasses[props.variant as ButtonVariant] ?? buttonVariantClasses.primary,
  iconButtonSizeClasses[props.size as ButtonSize] ?? iconButtonSizeClasses.md,
]);
</script>

<template>
  <button
    v-bind="attrs"
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :aria-label="props.label"
    :aria-busy="ariaBusy"
    :class="[classes, attrs.class]"
    @pointerdown="updateButtonPointerGlow"
  >
    <span class="inline-flex shrink-0 items-center justify-center" aria-hidden="true">
      <UiLoadingIndicator v-if="props.loading" />
      <slot v-else />
    </span>
  </button>
</template>
