<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { updateButtonPointerGlow } from './button-pointer-glow';
import {
  actionScaleClasses,
  actionSizeClasses,
  actionStretchClasses,
  buttonBaseClasses,
  buttonVariantClasses,
} from './classes';
import { getSurfaceClass } from './surface';
import type { ActionProps, ActionScale, ActionSize, ButtonVariant } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ActionProps>(), {
  as: 'a',
  variant: 'primary',
  size: 'md',
  scale: 'md',
  type: 'button',
  disabled: false,
  stretch: false,
  surface: 'glass-subtle',
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
const targetProps = computed(() => {
  if (props.as === 'button') {
    return {
      type: props.type,
      disabled: props.disabled,
    };
  }

  return props.disabled || props.href === undefined ? {} : { href: props.href };
});
const classes = computed(() => [
  buttonBaseClasses,
  'ui-action',
  getSurfaceClass(props.surface),
  buttonVariantClasses[props.variant as ButtonVariant] ?? buttonVariantClasses.primary,
  actionSizeClasses[props.size as ActionSize] ?? actionSizeClasses.md,
  actionScaleClasses[props.scale as ActionScale] ?? actionScaleClasses.md,
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
    :aria-disabled="props.as === 'button' ? undefined : props.disabled || undefined"
    :tabindex="props.disabled ? -1 : (attrs.tabindex as number | string | undefined)"
    :data-surface="props.surface"
    :class="[classes, attrs.class]"
    :style="attrs.style"
    @click.capture="handleDisabledClick"
    @pointerdown="handlePointerdown"
  >
    <span class="ui-button__edge-field" aria-hidden="true" />
    <span v-if="$slots.leading" class="ui-action__leading" aria-hidden="true">
      <slot name="leading" />
    </span>
    <span class="ui-action__content"><slot /></span>
    <span v-if="$slots.trailing" class="ui-action__trailing" aria-hidden="true">
      <slot name="trailing" />
    </span>
    <slot name="decoration" />
  </component>
</template>
