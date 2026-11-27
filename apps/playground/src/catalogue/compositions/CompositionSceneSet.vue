<script setup lang="ts">
import type { LabModuleProps } from '../../features/catalogue/types';
import ReadingComposition from './ReadingComposition.vue';
import ControlCluster from './scenes/ControlCluster.vue';
import DocsArticleHeader from './scenes/DocsArticleHeader.vue';
import DocsContentSurface from './scenes/DocsContentSurface.vue';
import DocsNavigationGroup from './scenes/DocsNavigationGroup.vue';
import DocsToolbar from './scenes/DocsToolbar.vue';
import FloatingToolbar from './scenes/FloatingToolbar.vue';
import ProjectCard from './scenes/ProjectCard.vue';
import SceneSection from './scenes/SceneSection.vue';

const props = defineProps<LabModuleProps>();
</script>

<template>
  <div class="grid gap-grid md:grid-cols-2" data-composition-mode="glass">
    <SceneSection id="composition-control-cluster" scene="controlCluster" :locale="props.locale">
      <ControlCluster :locale="props.locale" />
    </SceneSection>
    <SceneSection id="composition-project-card" scene="projectCard" :locale="props.locale">
      <ProjectCard :locale="props.locale" />
    </SceneSection>
    <SceneSection
      id="composition-floating-toolbar"
      scene="floatingToolbar"
      :locale="props.locale"
      wide
    >
      <FloatingToolbar :locale="props.locale" />
    </SceneSection>
    <SceneSection
      id="composition-docs-article-header"
      scene="docsArticleHeader"
      :locale="props.locale"
      wide
    >
      <DocsArticleHeader :locale="props.locale" />
    </SceneSection>
    <SceneSection
      id="composition-docs-navigation-group"
      scene="docsNavigationGroup"
      :locale="props.locale"
    >
      <DocsNavigationGroup :locale="props.locale" />
    </SceneSection>
    <SceneSection id="composition-docs-toolbar" scene="docsToolbar" :locale="props.locale">
      <DocsToolbar :locale="props.locale" />
    </SceneSection>
    <SceneSection
      id="composition-docs-content-surface"
      scene="docsContentSurface"
      :locale="props.locale"
      wide
    >
      <DocsContentSurface :locale="props.locale" />
    </SceneSection>
    <ReadingComposition :locale="props.locale" />
  </div>
</template>
