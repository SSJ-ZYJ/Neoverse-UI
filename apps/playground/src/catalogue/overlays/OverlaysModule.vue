<script setup lang="ts">
import { UiNavigationItem, UiSurface } from '@neoverse-ui/vue';
import { localize, localized, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabSpecimenSection from '../../features/stage/LabSpecimenSection.vue';
import MaterialBackdrop from '../materials/MaterialBackdrop.vue';
import ContextMenuPreview from './ContextMenuPreview.vue';
import OverlayModule from './OverlayModule.vue';
import { DialogPreview, DrawerPreview, OverlayScenarios } from './overlays';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.overlays;
const popoverCopy = {
  label: localized('Popover & dropdown', '弹层与下拉菜单'),
  description: localized(
    'Popover and dropdown menu share one top-layer positioning, dismiss, focus, and Motion runtime.',
    'Popover 与下拉菜单共享同一套顶层定位、关闭、焦点与 Motion Runtime。',
  ),
} as const;
const contextMenuCopy = {
  label: localized('Context menu', '右键菜单'),
  description: localized(
    'Cursor-anchored menus add grouping, checkable rows, submenus, and shortcuts on the same runtime; a pointer open keeps focus in the region while a keyboard open moves it into the panel.',
    '指针定位菜单在同一运行时上增加分组、可勾选行、二级菜单与快捷键；指针打开保留区域焦点，键盘打开把焦点移入面板。',
  ),
} as const;
const dialogCopy = {
  label: localized('Modal dialog', '模态对话框'),
  description: localized(
    'Native modal focus containment with shared Glass surface and focus restoration.',
    '原生模态焦点约束、共享玻璃材质与关闭后的焦点恢复。',
  ),
} as const;
const drawerCopy = {
  label: localized('Drawer', '抽屉'),
  description: localized(
    'A viewport-edge panel that shares the modal layer with Dialog.',
    '从视口边缘打开的面板，与对话框共用模态层级。',
  ),
} as const;
const sections = [
  { id: 'overlays-popover', label: popoverCopy.label },
  { id: 'overlays-context-menu', label: contextMenuCopy.label },
  { id: 'overlays-dialog', label: dialogCopy.label },
  { id: 'overlays-drawer', label: drawerCopy.label },
] as const;
</script>

<template>
  <div class="grid gap-grid">
    <UiSurface
      as="nav"
      surface="glass-subtle"
      content-overflow="visible"
      class="playground-floating-interaction-surface flex flex-wrap gap-1 rounded-card p-2"
      :aria-label="localize(copy.label, props.locale)"
    >
      <UiNavigationItem
        v-for="section in sections"
        :key="section.id"
        :href="`#${section.id}`"
        :label="localize(section.label, props.locale)"
        size="lg"
        class="h-auto min-h-0 rounded-control px-3 py-1.5 text-body-sm font-regular text-secondary hover:text-primary"
      />
    </UiSurface>

    <LabSpecimenSection
      id="overlays-popover"
      :title="localize(popoverCopy.label, props.locale)"
      :description="localize(popoverCopy.description, props.locale)"
    >
      <div class="grid gap-4">
        <OverlayModule :locale="props.locale" />
        <OverlayScenarios :locale="props.locale" />
      </div>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="overlays-context-menu"
      :title="localize(contextMenuCopy.label, props.locale)"
      :description="localize(contextMenuCopy.description, props.locale)"
    >
      <MaterialBackdrop edge="inset">
        <ContextMenuPreview :locale="props.locale" />
      </MaterialBackdrop>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="overlays-dialog"
      :title="localize(dialogCopy.label, props.locale)"
      :description="localize(dialogCopy.description, props.locale)"
    >
      <DialogPreview :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="overlays-drawer"
      :title="localize(drawerCopy.label, props.locale)"
      :description="localize(drawerCopy.description, props.locale)"
    >
      <DrawerPreview :locale="props.locale" />
    </LabSpecimenSection>
  </div>
</template>
