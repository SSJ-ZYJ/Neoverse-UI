import { h, type VNode } from 'vue';
import { defineComposition } from '../lab-specimen-config';
import ReadingComposition from '../modules/ReadingComposition.vue';
import ReducedTransparencyComposition from '../modules/ReducedTransparencyComposition.vue';
import { type Locale, localized } from '../playground-content';
import { resolvedTheme } from '../theme-state';
import {
  type ControlClusterConfiguration,
  type ControlClusterMode,
  compactControl,
  controlClusterMode,
  controlClusterPresets,
  type DocsToolbarMode,
  docsToolbarMode,
  docsToolbarPresets,
  type FloatingToolbarMode,
  floatingToolbarMode,
  floatingToolbarPresets,
  type ProjectCardConfiguration,
  projectCardPresets,
  projectContentControl,
  projectStatusControl,
  showActionsControl,
  surfaceControl,
  type ToolbarConfiguration,
} from './composition-settings';
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

export const controlCluster = defineComposition<
  ControlClusterConfiguration,
  { mode: ControlClusterMode }
>()({
  presets: controlClusterPresets,
  controls: {
    props: {
      compact: compactControl,
      surface: surfaceControl,
      showStatus: {
        kind: 'boolean',
        group: 'content',
        label: localized('Show status', '显示状态'),
      },
    },
    state: { mode: controlClusterMode },
  },
  render: ({ locale, props, state, setState }) =>
    h(ControlCluster, {
      locale,
      configuration: props,
      modelValue: state.mode,
      'onUpdate:modelValue': (mode) => setState('mode', mode),
    }),
});

export const projectCard = defineComposition<ProjectCardConfiguration>()({
  presets: projectCardPresets,
  controls: {
    props: {
      content: projectContentControl,
      surface: surfaceControl,
      status: projectStatusControl,
      progress: {
        kind: 'number',
        group: 'content',
        label: localized('Delivery progress', '交付进度'),
        min: 0,
        max: 100,
      },
    },
    state: {},
  },
  render: ({ locale, props }) => h(ProjectCard, { locale, configuration: props }),
});

export const floatingToolbar = defineComposition<
  ToolbarConfiguration,
  { mode: FloatingToolbarMode }
>()({
  presets: floatingToolbarPresets,
  controls: {
    props: { compact: compactControl, surface: surfaceControl, showActions: showActionsControl },
    state: { mode: floatingToolbarMode },
  },
  render: ({ locale, props, state, setState }) =>
    h(FloatingToolbar, {
      locale,
      configuration: props,
      modelValue: state.mode,
      'onUpdate:modelValue': (mode) => setState('mode', mode),
    }),
});

export function docsArticleHeader(locale: Locale): VNode {
  return h(DocsArticleHeader, { locale });
}

export function docsNavigationGroup(locale: Locale): VNode {
  return h(DocsNavigationGroup, { locale });
}

export const docsToolbar = defineComposition<ToolbarConfiguration, { mode: DocsToolbarMode }>()({
  presets: docsToolbarPresets,
  controls: {
    props: {
      compact: compactControl,
      surface: surfaceControl,
      showActions: { ...showActionsControl, label: localized('Show copy link', '显示复制链接') },
    },
    state: { mode: docsToolbarMode },
  },
  render: ({ locale, props, state, setState }) =>
    h(DocsToolbar, {
      locale,
      configuration: props,
      modelValue: state.mode,
      'onUpdate:modelValue': (mode) => setState('mode', mode),
    }),
});

export function docsContentSurface(locale: Locale): VNode {
  return h(DocsContentSurface, { locale });
}

export function reading(locale: Locale): VNode {
  return h(ReadingComposition, { locale, id: 'composition-reading-content' });
}

export function giscus(locale: Locale): VNode {
  return h(GiscusTheme, { locale, theme: resolvedTheme.value });
}
