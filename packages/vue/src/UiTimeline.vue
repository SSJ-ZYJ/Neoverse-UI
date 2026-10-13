<script setup lang="ts">
import type { TimelineItem, TimelineProps } from './types';

const props = defineProps<TimelineProps>();

defineSlots<{
  item?: (props: { item: TimelineItem; index: number }) => unknown;
}>();
</script>

<template>
  <ol class="ui-timeline" :aria-label="props.ariaLabel">
    <li v-for="(item, index) in props.items" :key="item.id" class="ui-timeline__item">
      <span class="ui-timeline__node" aria-hidden="true" />
      <div class="ui-timeline__content">
        <slot name="item" :item="item" :index="index">
          <p class="ui-timeline__title">{{ item.title }}</p>
          <p v-if="item.description" class="ui-timeline__description">
            {{ item.description }}
          </p>
          <time v-if="item.time" class="ui-timeline__time" :datetime="item.dateTime || undefined">
            {{ item.time }}
          </time>
        </slot>
      </div>
    </li>
  </ol>
</template>
