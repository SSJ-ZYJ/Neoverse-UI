<script setup lang="ts">
import {
  UiButton,
  UiControlSurface,
  UiIconButton,
  UiNavigationItem,
  UiSegmentedControl,
} from '@neoverse-ui/vue';
import { ref } from 'vue';
import LabIcon from '../LabIcon.vue';
import { localize, localized, moduleCopy } from '../playground-content';
import QaPreviewMatrix from '../QaPreviewMatrix.vue';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.controlSurface;
const surfaceVariants = [
  { surface: 'glass-subtle', label: 'subtle' },
  { surface: 'glass-elevated', label: 'elevated' },
  { surface: 'glass-immersive', label: 'immersive' },
] as const;
const viewOptions = [
  { value: 'map', label: 'Map' },
  { value: 'list', label: 'List' },
] as const;
const activeNavigation = ref('overview');
const navigationItems = [
  { id: 'overview', label: localized('Overview', '总览') },
  { id: 'components', label: localized('Components', '组件') },
  { id: 'patterns', label: localized('Patterns', '组合') },
] as const;
const extraCopy = {
  surface: {
    label: localized('Canonical surface', '规范 Surface'),
    hint: localized(
      'The explicit surface prop can opt out of Glass or choose another shared semantic material.',
      '显式 surface 属性可以退出玻璃材质，或选择其他共享语义表面。',
    ),
  },
  hover: {
    label: localized('Hover ownership', '悬停归属'),
    hint: localized(
      'auto delegates hover handling to the surface runtime; static keeps the group visually stable.',
      'auto 将悬停处理交给表面运行时；static 则保持组合表面视觉稳定。',
    ),
  },
  edge: {
    label: localized('Edge ownership', '边缘归属'),
    hint: localized(
      'local keeps the CSS edge pass on the grouped surface when composition-level ownership is required.',
      '需要由组合层负责边缘时，local 会将 CSS 边缘处理保留在分组表面。',
    ),
  },
  scale: {
    label: localized('Uniform scale', '整体缩放'),
    hint: localized(
      'Scale changes the whole grouped control while keeping internal spacing relationships intact.',
      'Scale 统一调整整个控件组，并保持内部间距关系不变。',
    ),
  },
  indicator: {
    label: localized('Shared navigation indicator', '共享导航指示器'),
    hint: localized(
      'The surface measures the active NavigationItem and moves one shared indicator between destinations.',
      '表面测量当前 NavigationItem，并在不同目标之间移动同一个共享指示器。',
    ),
    aria: localized('Control surface navigation', '控件表面导航'),
  },
  qa: {
    label: localized('Cross-component QA', '跨组件 QA'),
    hint: localized(
      'One grouped cluster checks icon, text, segmented, and navigation geometry against the same backdrop contexts.',
      '使用同一组背景环境同时检查图标、文本、分段控件与导航几何关系。',
    ),
  },
} as const;
</script>

<template>
  <StateRow
    :label="copy.states.toolbar.label"
    :hint="copy.states.toolbar.hint"
    :locale="props.locale"
  >
    <UiControlSurface
      role="toolbar"
      edge-mode="local"
      :aria-label="localize(copy.controls.toolbar, props.locale)"
    >
      <UiIconButton
        variant="ghost"
        size="sm"
        surface="none"
        :label="localize(copy.controls.add, props.locale)"
      >
        <LabIcon name="plus" />
      </UiIconButton>
      <UiIconButton
        variant="ghost"
        size="sm"
        surface="none"
        :label="localize(copy.controls.confirm, props.locale)"
      >
        <LabIcon name="check" />
      </UiIconButton>
      <template #trailing>
        <UiButton size="sm" surface="none">
          {{ localize(copy.controls.publish, props.locale) }}
        </UiButton>
      </template>
    </UiControlSurface>
  </StateRow>

  <StateRow
    :label="copy.states.variants.label"
    :hint="copy.states.variants.hint"
    :locale="props.locale"
  >
    <div class="grid w-full gap-3 md:grid-cols-3">
      <UiControlSurface
        v-for="variant in surfaceVariants"
        :key="variant.surface"
        :surface="variant.surface"
        hover-mode="static"
        edge-mode="local"
      >
        <span class="px-2 text-caption font-label text-primary">{{ variant.label }}</span>
      </UiControlSurface>
    </div>
  </StateRow>

  <StateRow
    :label="copy.states.trailing.label"
    :hint="copy.states.trailing.hint"
    :locale="props.locale"
  >
    <UiControlSurface
      as="nav"
      edge-mode="local"
      :aria-label="localize(copy.controls.view, props.locale)"
    >
      <UiButton variant="ghost" size="sm" surface="none">
        {{ localize(copy.controls.canvas, props.locale) }}
      </UiButton>
      <template #trailing>
        <UiSegmentedControl
          surface="none"
          :aria-label="localize(copy.controls.view, props.locale)"
          :options="viewOptions"
        />
      </template>
    </UiControlSurface>
  </StateRow>

  <StateRow :label="extraCopy.surface.label" :hint="extraCopy.surface.hint" :locale="props.locale">
    <div class="grid w-full gap-2">
      <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <code class="min-w-0 text-caption text-muted">surface="none"</code>
        <UiControlSurface surface="none">
          <UiButton size="sm" variant="ghost" surface="none">none</UiButton>
        </UiControlSurface>
      </div>
      <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <code class="min-w-0 text-caption text-muted">surface="chrome"</code>
        <UiControlSurface surface="chrome">
          <UiButton size="sm" variant="ghost" surface="none">chrome</UiButton>
        </UiControlSurface>
      </div>
      <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <code class="min-w-0 text-caption text-muted">surface="glass-subtle"</code>
        <UiControlSurface surface="glass-subtle" edge-mode="local">
          <UiButton size="sm" variant="ghost" surface="none">glass</UiButton>
        </UiControlSurface>
      </div>
    </div>
  </StateRow>

  <StateRow :label="extraCopy.hover.label" :hint="extraCopy.hover.hint" :locale="props.locale">
    <div class="flex flex-wrap items-center gap-3">
      <UiControlSurface hover-mode="auto" edge-mode="local">
        <UiButton size="sm" variant="ghost" surface="none">hoverMode="auto"</UiButton>
      </UiControlSurface>
      <UiControlSurface hover-mode="static" edge-mode="local">
        <UiButton size="sm" variant="ghost" surface="none">hoverMode="static"</UiButton>
      </UiControlSurface>
    </div>
  </StateRow>

  <StateRow :label="extraCopy.edge.label" :hint="extraCopy.edge.hint" :locale="props.locale">
    <div class="flex flex-wrap items-center gap-3">
      <UiControlSurface edge-mode="auto">
        <UiButton size="sm" variant="ghost" surface="none">edgeMode="auto"</UiButton>
      </UiControlSurface>
      <UiControlSurface edge-mode="local">
        <UiButton size="sm" variant="ghost" surface="none">edgeMode="local"</UiButton>
      </UiControlSurface>
    </div>
  </StateRow>

  <StateRow :label="extraCopy.scale.label" :hint="extraCopy.scale.hint" :locale="props.locale">
    <div class="flex flex-wrap items-center gap-3">
      <UiControlSurface scale="md" edge-mode="local">
        <UiButton size="sm" variant="ghost" surface="none">scale="md"</UiButton>
      </UiControlSurface>
      <UiControlSurface scale="lg" edge-mode="local">
        <UiButton size="sm" variant="ghost" surface="none">scale="lg"</UiButton>
      </UiControlSurface>
    </div>
  </StateRow>

  <StateRow
    :label="extraCopy.indicator.label"
    :hint="extraCopy.indicator.hint"
    :locale="props.locale"
  >
    <UiControlSurface
      as="nav"
      navigation-indicator
      edge-mode="local"
      :aria-label="localize(extraCopy.indicator.aria, props.locale)"
    >
      <UiNavigationItem
        v-for="item in navigationItems"
        :key="item.id"
        href="#controls-surface"
        :label="localize(item.label, props.locale)"
        :active="activeNavigation === item.id"
        surface="none"
        @click.prevent="activeNavigation = item.id"
      />
    </UiControlSurface>
  </StateRow>

  <StateRow :label="extraCopy.qa.label" :hint="extraCopy.qa.hint" :locale="props.locale">
    <QaPreviewMatrix :locale="props.locale">
      <UiControlSurface
        role="toolbar"
        edge-mode="local"
        :aria-label="localize(copy.controls.toolbar, props.locale)"
      >
        <UiIconButton
          variant="ghost"
          size="sm"
          surface="none"
          :label="localize(copy.controls.add, props.locale)"
        >
          <LabIcon name="plus" />
        </UiIconButton>
        <UiNavigationItem
          href="#controls-surface"
          :label="localize(navigationItems[0].label, props.locale)"
          active
          surface="none"
          @click.prevent
        />
        <template #trailing>
          <UiSegmentedControl
            surface="none"
            :aria-label="localize(copy.controls.view, props.locale)"
            :options="viewOptions"
          />
        </template>
      </UiControlSurface>
    </QaPreviewMatrix>
  </StateRow>
</template>
