import { h, type VNode } from 'vue';
import ReadingComposition from '../modules/ReadingComposition.vue';
import ReducedTransparencyComposition from '../modules/ReducedTransparencyComposition.vue';
import type { Locale } from '../playground-content';
import { resolvedTheme } from '../theme-state';
import ControlCluster from './scenes/ControlCluster.vue';
import DocsArticleHeader from './scenes/DocsArticleHeader.vue';
import DocsContentSurface from './scenes/DocsContentSurface.vue';
import DocsNavigationGroup from './scenes/DocsNavigationGroup.vue';
import DocsToolbar from './scenes/DocsToolbar.vue';
import FloatingToolbar from './scenes/FloatingToolbar.vue';
import GiscusTheme from './scenes/GiscusTheme.vue';
import ProjectCard from './scenes/ProjectCard.vue';

export function standardComposition(locale: Locale): VNode {
  return h(
    'div',
    {
      class: 'grid w-full min-w-0 max-w-reading-wide gap-grid',
      'data-composition-mode': 'glass',
    },
    [h(ControlCluster, { locale }), h(ProjectCard, { locale })],
  );
}

export function accessibleComposition(locale: Locale): VNode {
  return h(ReducedTransparencyComposition, { locale });
}

export function controlCluster(locale: Locale): VNode {
  return h(ControlCluster, { locale });
}

export function projectCard(locale: Locale): VNode {
  return h(ProjectCard, { locale });
}

export function floatingToolbar(locale: Locale): VNode {
  return h(FloatingToolbar, { locale });
}

export function docsArticleHeader(locale: Locale): VNode {
  return h(DocsArticleHeader, { locale });
}

export function docsNavigationGroup(locale: Locale): VNode {
  return h(DocsNavigationGroup, { locale });
}

export function docsToolbar(locale: Locale): VNode {
  return h(DocsToolbar, { locale });
}

export function docsContentSurface(locale: Locale): VNode {
  return h(DocsContentSurface, { locale });
}

export function reading(locale: Locale): VNode {
  return h(ReadingComposition, { locale, id: 'composition-reading-content' });
}

export function giscus(locale: Locale): VNode {
  return h(GiscusTheme, { locale, theme: resolvedTheme.value });
}
