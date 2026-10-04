<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { TableProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TableProps>(), {
  striped: true,
  hoverable: true,
});
const attrs = useAttrs();
const classes = computed(() => [
  'ui-table',
  props.striped && 'ui-table--striped',
  props.hoverable && 'ui-table--hoverable',
]);
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <div class="ui-table-region" data-ui-table-region>
    <table v-bind="forwardedAttrs" :class="[classes, attrs.class]" :style="attrs.style">
      <caption v-if="props.caption || $slots.caption" class="ui-table__caption">
        <slot name="caption">{{ props.caption }}</slot>
      </caption>
      <slot />
    </table>
  </div>
</template>
