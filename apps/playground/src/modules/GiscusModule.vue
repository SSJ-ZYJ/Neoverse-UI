<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, localized } from '../playground-content';
import GiscusTheme from '../previews/scenes/GiscusTheme.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();

const copy = {
  title: localized('Giscus widget theme', 'Giscus 评论主题'),
  description: localized(
    'The published iframe theme rendered with the CSS the comment widget actually loads. Each preview is isolated so the widget global cannot leak into the Design Lab.',
    '使用评论组件实际加载的 CSS 渲染已发布的 iframe 主题。每个预览独立隔离，组件全局样式不会影响设计实验室。',
  ),
} as const;
</script>

<template>
  <LabSpecimenSection
    id="giscus-themes"
    :title="localize(copy.title, props.locale)"
    :description="localize(copy.description, props.locale)"
  >
    <GiscusTheme :locale="props.locale" />
  </LabSpecimenSection>
</template>
