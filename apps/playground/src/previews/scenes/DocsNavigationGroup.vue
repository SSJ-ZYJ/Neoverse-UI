<script setup lang="ts">
import { UiBadge, UiNavigationItem } from '@neoverse-ui/vue';
import { computed } from 'vue';
import type { LabModuleProps } from '../../modules/types';
import { localize, moduleCopy } from '../../playground-content';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.composition;
const navigationItems = computed(() => [
  {
    id: 'foundations',
    label: localize(copy.scenes.docsNavigationGroup.links.foundations, props.locale),
    selected: true,
  },
  {
    id: 'tokens',
    label: localize(copy.scenes.docsNavigationGroup.links.tokens, props.locale),
    selected: false,
  },
  {
    id: 'materials',
    label: localize(copy.scenes.docsNavigationGroup.links.materials, props.locale),
    selected: false,
  },
  {
    id: 'controls',
    label: localize(copy.scenes.docsNavigationGroup.links.controls, props.locale),
    selected: false,
  },
]);
</script>

<template>
  <nav
    class="grid min-w-0 gap-3 p-3"
    data-composition-surface
    data-composition-measure="narrow"
    :aria-label="localize(copy.scenes.docsNavigationGroup.navigationLabel, props.locale)"
  >
    <div class="flex items-center justify-between gap-2">
      <h4 class="text-label font-label text-primary">
        {{ localize(copy.scenes.docsNavigationGroup.group, props.locale) }}
      </h4>
      <UiBadge>{{ localize(copy.scenes.docsNavigationGroup.count, props.locale) }}</UiBadge>
    </div>

    <ul class="grid gap-1">
      <li v-for="item in navigationItems" :key="item.id">
        <UiNavigationItem
          href="#composition"
          @click.prevent
          :label="item.label"
          size="lg"
          stretch
          indicator-placement="start"
          :active="item.selected"
          :class="[
            'playground-navigation-item--flat-active h-auto min-h-0 w-full justify-start rounded-control px-3 py-2 text-caption',
            item.selected
              ? 'bg-accent-soft font-semibold text-accent-primary'
              : 'text-secondary hover:bg-accent-soft hover:text-primary',
          ]"
        />
      </li>
    </ul>
  </nav>
</template>
