<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { NoticeProps, NoticeVariant } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<NoticeProps>(), {
  as: 'div',
  variant: 'neutral',
});
const attrs = useAttrs();
const classes = computed(() => ['ui-notice', `ui-notice--${props.variant as NoticeVariant}`]);
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <component
    :is="props.as"
    v-bind="forwardedAttrs"
    :class="[classes, attrs.class]"
    :style="attrs.style"
  >
    <div class="ui-notice__content"><slot /></div>
    <div v-if="$slots.action" class="ui-notice__action"><slot name="action" /></div>
  </component>
</template>
