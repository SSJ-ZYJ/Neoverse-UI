<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { updateButtonPointerGlow } from './button-pointer-glow';
import {
  actionSizeClasses,
  actionStretchClasses,
  buttonVariantClasses,
  controlFocusClasses,
  controlTransitionClasses,
} from './classes';
import type { ActionProps, ActionSize, ButtonVariant } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ActionProps>(), {
  as: 'a',
  variant: 'primary',
  size: 'md',
  disabled: false,
  stretch: false,
});

const attrs = useAttrs();
const tag = computed(() => props.as);
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  if (!props.disabled) {
    return rest;
  }

  const { href: _href, to: _to, tabindex: _tabindex, ...disabledRest } = rest;
  return disabledRest;
});
const targetProps = computed(() =>
  props.disabled || props.href === undefined ? {} : { href: props.href },
);
const classes = computed(() => [
  'ui-button ui-action material-glass-subtle inline-flex shrink-0 cursor-pointer select-none items-center justify-center rounded-control-inner font-label',
  controlTransitionClasses,
  controlFocusClasses,
  buttonVariantClasses[props.variant as ButtonVariant] ?? buttonVariantClasses.primary,
  actionSizeClasses[props.size as ActionSize] ?? actionSizeClasses.md,
  props.stretch ? actionStretchClasses : '',
]);

function handleDisabledClick(event: MouseEvent): void {
  if (!props.disabled) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
}

function handlePointerdown(event: PointerEvent): void {
  if (!props.disabled) {
    updateButtonPointerGlow(event);
  }
}
</script>

<template>
  <!-- biome-ignore lint/a11y/noStaticElementInteractions: the polymorphic tag is a consumer-provided interactive destination. -->
  <component
    :is="tag"
    v-bind="{ ...forwardedAttrs, ...targetProps }"
    :aria-disabled="props.disabled || undefined"
    :tabindex="props.disabled ? -1 : (attrs.tabindex as number | string | undefined)"
    :class="[classes, attrs.class]"
    :style="attrs.style"
    @click.capture="handleDisabledClick"
    @pointerdown="handlePointerdown"
  >
    <span class="ui-button__edge-field" aria-hidden="true" />
    <span v-if="$slots.leading" class="ui-action__leading" aria-hidden="true">
      <slot name="leading" />
    </span>
    <span class="ui-action__content min-w-0"><slot /></span>
    <span v-if="$slots.trailing" class="ui-action__trailing" aria-hidden="true">
      <slot name="trailing" />
    </span>
    <slot name="decoration" />
  </component>
</template>
