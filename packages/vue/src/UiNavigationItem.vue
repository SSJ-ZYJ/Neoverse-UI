<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { NavigationItemProps } from './types';
import UiAction from './UiAction.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<NavigationItemProps>(), {
  as: 'a',
  size: 'md',
  active: false,
  compact: false,
  disabled: false,
  stretch: false,
  surface: 'none',
  indicatorPlacement: 'bottom',
});

const attrs = useAttrs();
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, 'aria-current': _ariaCurrent, ...rest } = attrs;
  return {
    ...rest,
    ...(props.href === undefined ? {} : { href: props.href }),
  };
});
const ariaCurrent = computed(() => attrs['aria-current'] ?? (props.active ? 'page' : undefined));
</script>

<template>
  <UiAction
    v-bind="forwardedAttrs"
    :as="props.as"
    variant="ghost"
    :size="props.size"
    :disabled="props.disabled"
    :stretch="props.stretch"
    :surface="props.surface"
    :aria-current="ariaCurrent"
    :class="[
      'ui-navigation-item',
      {
        'ui-navigation-item--active': props.active,
        'ui-navigation-item--compact': props.compact,
        'ui-navigation-item--stretch': props.stretch,
        'ui-navigation-item--indicator-start': props.indicatorPlacement === 'start',
      },
      attrs.class,
    ]"
    :style="attrs.style"
  >
    <template v-if="$slots.icon" #leading><slot name="icon" /></template>
    <span class="ui-navigation-item__label" :class="{ 'sr-only': props.compact }">
      {{ props.label }}
    </span>
    <template #decoration>
      <span class="ui-navigation-item__indicator" aria-hidden="true" />
    </template>
  </UiAction>
</template>
