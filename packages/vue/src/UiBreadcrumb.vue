<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { BreadcrumbItem, BreadcrumbProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<BreadcrumbProps>(), {
  ariaLabel: 'Breadcrumb',
  separator: '›',
});

const attrs = useAttrs();
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

const explicitCurrentIndex = computed(() =>
  props.items.findIndex((item: BreadcrumbItem) => item.current === true),
);
const isCurrent = (_item: BreadcrumbItem, index: number): boolean =>
  explicitCurrentIndex.value >= 0
    ? index === explicitCurrentIndex.value
    : index === props.items.length - 1;
</script>

<template>
  <nav
    v-bind="forwardedAttrs"
    class="ui-breadcrumb"
    :class="attrs.class"
    :style="attrs.style"
    :aria-label="props.ariaLabel"
  >
    <ol class="ui-breadcrumb__list">
      <li
        v-for="(item, index) in props.items"
        :key="item.id ?? item.href ?? item.label"
        class="ui-breadcrumb__item"
      >
        <span v-if="index > 0" class="ui-breadcrumb__separator" aria-hidden="true">
          <slot name="separator" :index="index">{{ props.separator }}</slot>
        </span>

        <slot name="item" :item="item" :index="index" :current="isCurrent(item, index)">
          <span
            v-if="isCurrent(item, index)"
            class="ui-breadcrumb__current"
            aria-current="page"
            :title="item.label"
          >
            {{ item.label }}
          </span>
          <a
            v-else-if="item.href !== undefined"
            class="ui-breadcrumb__link"
            :href="item.href"
            :title="item.label"
          >
            {{ item.label }}
          </a>
          <span v-else class="ui-breadcrumb__label" :title="item.label">
            {{ item.label }}
          </span>
        </slot>
      </li>
    </ol>
  </nav>
</template>
