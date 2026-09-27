<script setup lang="ts">
import { UiBreadcrumb, UiSurface } from '@neoverse-ui/vue';
import { computed } from 'vue';
import { localize, localized } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = {
  label: localized('Breadcrumb', '面包屑导航'),
  description: localized(
    'Route hierarchy with a single current-page state, stable item identity, and local overflow handling.',
    '路径层级保持单一当前页状态、稳定条目标识与局部溢出处理。',
  ),
  sampleLabel: localized('Documentation breadcrumb', '文档路径导航'),
} as const;
const items = computed(() =>
  props.locale === 'zh'
    ? [
        { id: 'home', label: '主页', href: '#top' },
        { id: 'docs', label: '文档', href: '#composition' },
        { id: 'design-system', label: '设计系统', href: '#controls' },
        { id: 'breadcrumb', label: '面包屑导航', current: true },
      ]
    : [
        { id: 'home', label: 'Home', href: '#top' },
        { id: 'docs', label: 'Docs', href: '#composition' },
        { id: 'design-system', label: 'Design system', href: '#controls' },
        { id: 'breadcrumb', label: 'Breadcrumb', current: true },
      ],
);
</script>

<template>
  <div class="grid gap-3">
    <p class="text-caption text-secondary">
      {{ localize(copy.description, props.locale) }}
    </p>
    <UiSurface surface="subtle" class="min-w-0 rounded-control p-4">
      <UiBreadcrumb :items="items" :aria-label="localize(copy.sampleLabel, props.locale)" />
    </UiSurface>
  </div>
</template>
