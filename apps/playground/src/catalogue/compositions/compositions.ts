import { h, type VNode } from 'vue';
import { lazyComponent, withPreload } from '../../app/lazy-component';
import { type Locale, localized } from '../../content/playground-content';
import { defineComposition } from '../../features/specimens/lab-specimen-config';
import { resolvedTheme } from '../../runtime/theme-state';
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

const ReadingComposition = lazyComponent(() => import('./ReadingComposition.vue'));
const ReducedTransparencyComposition = lazyComponent(
  () => import('./ReducedTransparencyComposition.vue'),
);
const ControlCluster = lazyComponent(() => import('./scenes/ControlCluster.vue'));
const DocsArticleHeader = lazyComponent(() => import('./scenes/DocsArticleHeader.vue'));
const DocsContentSurface = lazyComponent(() => import('./scenes/DocsContentSurface.vue'));
const DocsNavigationGroup = lazyComponent(() => import('./scenes/DocsNavigationGroup.vue'));
const DocsToolbar = lazyComponent(() => import('./scenes/DocsToolbar.vue'));
const FloatingToolbar = lazyComponent(() => import('./scenes/FloatingToolbar.vue'));
const GiscusTheme = lazyComponent(() => import('./scenes/GiscusTheme.vue'));
const ProjectCard = lazyComponent(() => import('./scenes/ProjectCard.vue'));

export const standardComposition = withPreload(
  (locale: Locale): VNode =>
    h(
      'div',
      {
        class: 'grid w-full min-w-0 max-w-reading-wide gap-grid',
        'data-composition-mode': 'glass',
      },
      [h(ControlCluster, { locale }), h(ProjectCard, { locale })],
    ),
  [ControlCluster, ProjectCard],
);

export const accessibleComposition = withPreload(
  (locale: Locale): VNode => h(ReducedTransparencyComposition, { locale }),
  ReducedTransparencyComposition,
);

export const controlCluster = withPreload(
  defineComposition<ControlClusterConfiguration, { mode: ControlClusterMode }>()({
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
  }),
  ControlCluster,
);

export const projectCard = withPreload(
  defineComposition<ProjectCardConfiguration>()({
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
  }),
  ProjectCard,
);

export const floatingToolbar = withPreload(
  defineComposition<ToolbarConfiguration, { mode: FloatingToolbarMode }>()({
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
  }),
  FloatingToolbar,
);

export const docsArticleHeader = withPreload(
  (locale: Locale): VNode => h(DocsArticleHeader, { locale }),
  DocsArticleHeader,
);

export const docsNavigationGroup = withPreload(
  (locale: Locale): VNode => h(DocsNavigationGroup, { locale }),
  DocsNavigationGroup,
);

export const docsToolbar = withPreload(
  defineComposition<ToolbarConfiguration, { mode: DocsToolbarMode }>()({
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
  }),
  DocsToolbar,
);

export const docsContentSurface = withPreload(
  (locale: Locale): VNode => h(DocsContentSurface, { locale }),
  DocsContentSurface,
);

export const reading = withPreload(
  (locale: Locale): VNode => h(ReadingComposition, { locale, id: 'composition-reading-content' }),
  ReadingComposition,
);

export const giscus = withPreload(
  (locale: Locale): VNode => h(GiscusTheme, { locale, theme: resolvedTheme.value }),
  GiscusTheme,
);
