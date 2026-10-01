<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { updateButtonPointerGlow } from './button-pointer-glow';
import {
  buttonBaseClasses,
  buttonSizeClasses,
  buttonStretchSizeClasses,
  buttonVariantClasses,
} from './classes';
import { getSurfaceClass } from './surface';
import type { ButtonProps, ButtonSize, ButtonVariant } from './types';
import UiLoadingIndicator from './UiLoadingIndicator.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  stretch: false,
  surface: 'glass-subtle',
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
  getSurfaceClass(props.surface),
  buttonVariantClasses[props.variant as ButtonVariant] ?? buttonVariantClasses.primary,
  (props.stretch ? buttonStretchSizeClasses : buttonSizeClasses)[props.size as ButtonSize] ??
    buttonSizeClasses.md,
]);
</script>

<template>
  <button
    v-bind="attrs"
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :aria-busy="ariaBusy"
    :data-surface="props.surface"
    :class="[classes, attrs.class]"
    @pointerdown="updateButtonPointerGlow"
  >
    <span class="ui-button__edge-field" aria-hidden="true" />
    <span v-if="props.loading || $slots.leading" class="ui-button__leading">
      <template v-if="props.loading">
        <span v-if="$slots.leading" class="ui-button__leading-placeholder" aria-hidden="true">
          <slot name="leading" />
        </span>
        <span class="ui-button__spinner" aria-hidden="true">
          <UiLoadingIndicator />
        </span>
      </template>
      <slot v-else name="leading" />
    </span>
    <span class="ui-button__content">
      <slot />
    </span>
    <span v-if="$slots.trailing" class="ui-button__trailing">
      <slot name="trailing" />
    </span>
  </button>
</template>
