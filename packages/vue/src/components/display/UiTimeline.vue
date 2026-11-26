<script setup lang="ts">
import { getSurfaceClass } from '@neoverse-ui/tokens';
import type { TimelineItem, TimelineProps } from '../../types';

const groupMaterial = getSurfaceClass('auto', 'group');

const props = defineProps<TimelineProps>();

defineSlots<{
  item?: (props: { item: TimelineItem; index: number }) => unknown;
}>();
</script>

<template>
  <ol class="ui-timeline" :aria-label="props.ariaLabel">
    <li v-for="(item, index) in props.items" :key="item.id" class="ui-timeline__item">
      <span
        class="ui-surface ui-timeline__node"
        :class="groupMaterial"
        data-surface="auto"
        aria-hidden="true"
      />
      <div class="ui-surface ui-timeline__content" :class="groupMaterial" data-surface="auto">
        <slot name="item" :item="item" :index="index">
          <time v-if="item.time" class="ui-timeline__time" :datetime="item.dateTime || undefined">
            {{ item.time }}
          </time>
          <p class="ui-timeline__title">{{ item.title }}</p>
          <p v-if="item.description" class="ui-timeline__description">
            {{ item.description }}
          </p>
        </slot>
      </div>
    </li>
  </ol>
</template>
