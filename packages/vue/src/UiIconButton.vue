<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { updateButtonPointerGlow } from './button-pointer-glow';
import {
  buttonBaseClasses,
  buttonVariantClasses,
  controlFocusClasses,
  controlTransitionClasses,
  disabledControlClasses,
  iconButtonSizeClasses,
  iconButtonStretchSizeClasses,
} from './classes';
import { getSurfaceClass } from './surface';
import type { ButtonSize, ButtonVariant, IconButtonProps } from './types';
import UiLoadingIndicator from './UiLoadingIndicator.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<IconButtonProps>(), {
  as: 'button',
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  stretch: false,
  surface: 'glass-subtle',
});

const attrs = useAttrs();
const tag = computed(() => props.as);
const isButton = computed(() => props.as === 'button');
const isDisabled = computed(() => props.disabled || props.loading);
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, href: _href, ...rest } = attrs;
  if (isButton.value) return rest;
  const { tabindex: _tabindex, ...destinationRest } = rest;
  return destinationRest;
});
const targetProps = computed(() => {
  if (isButton.value) {
    return {
      type: props.type,
      disabled: isDisabled.value,
    };
  }

  return {
    href: isDisabled.value ? undefined : props.href,
    'aria-disabled': isDisabled.value || undefined,
    tabindex: isDisabled.value ? -1 : (attrs.tabindex as number | string | undefined),
  };
});
const ariaBusy = computed<'true' | 'false' | undefined>(() => {
  if (props.loading) return 'true';

  const value = attrs['aria-busy'];
  if (value === true || value === 'true') return 'true';
  if (value === false || value === 'false') return 'false';
  return undefined;
});

const classes = computed(() => [
  buttonBaseClasses,
  'p-0',
  controlTransitionClasses,
  controlFocusClasses,
  isButton.value ? disabledControlClasses : '',
  !isButton.value && isDisabled.value ? 'cursor-not-allowed opacity-60' : '',
  getSurfaceClass(props.surface),
  buttonVariantClasses[props.variant as ButtonVariant] ?? buttonVariantClasses.primary,
  (props.stretch ? iconButtonStretchSizeClasses : iconButtonSizeClasses)[
    props.size as ButtonSize
  ] ?? iconButtonSizeClasses.md,
]);

function handleDisabledClick(event: MouseEvent): void {
  if (!isDisabled.value || isButton.value) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function handlePointerdown(event: PointerEvent): void {
  if (!isDisabled.value) updateButtonPointerGlow(event);
}
</script>

<template>
  <!-- biome-ignore lint/a11y/noStaticElementInteractions: the polymorphic tag resolves to an interactive button or destination. -->
  <component
    :is="tag"
    v-bind="{ ...forwardedAttrs, ...targetProps }"
    :aria-label="props.label"
    :aria-busy="ariaBusy"
    :data-surface="props.surface"
    :class="[classes, attrs.class]"
    :style="attrs.style"
    @click.capture="handleDisabledClick"
    @pointerdown="handlePointerdown"
  >
    <span class="ui-button__edge-field" aria-hidden="true" />
    <span class="inline-flex shrink-0 items-center justify-center" aria-hidden="true">
      <UiLoadingIndicator v-if="props.loading" />
      <slot v-else />
    </span>
  </component>
</template>
