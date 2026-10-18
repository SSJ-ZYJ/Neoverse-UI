<script setup lang="ts">
import type { TimelineItem, TimelineProps } from './types';
import UiSurface from './UiSurface.vue';

const props = defineProps<TimelineProps>();

defineSlots<{
  item?: (props: { item: TimelineItem; index: number }) => unknown;
}>();
</script>

<template>
  <ol class="ui-timeline" :aria-label="props.ariaLabel">
    <li v-for="(item, index) in props.items" :key="item.id" class="ui-timeline__item">
      <UiSurface as="span" surface="glass-subtle" class="ui-timeline__node" aria-hidden="true" />
      <UiSurface surface="glass-subtle" class="ui-timeline__content">
        <slot name="item" :item="item" :index="index">
          <time v-if="item.time" class="ui-timeline__time" :datetime="item.dateTime || undefined">
            {{ item.time }}
          </time>
          <p class="ui-timeline__title">{{ item.title }}</p>
          <p v-if="item.description" class="ui-timeline__description">
            {{ item.description }}
          </p>
        </slot>
      </UiSurface>
    </li>
  </ol>
</template>
