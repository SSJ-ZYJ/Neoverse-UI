<script setup lang="ts">
import { UiButton, UiDialog, UiNavigationItem, UiSurface } from '@neoverse-ui/vue';
import { ref } from 'vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { injectSpecimenSelection } from '../lab-specimen-scope';
import { localize, localized, moduleCopy } from '../playground-content';
import ContextMenuModule from './ContextMenuModule.vue';
import OverlayModule from './OverlayModule.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const { isFocused } = injectSpecimenSelection();
const dialogOpen = ref(false);
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
  open: localized('Open dialog', '打开对话框'),
  title: localized('Confirm changes', '确认修改'),
  body: localized('Review this action before continuing.', '继续前请确认本次操作。'),
  cancel: localized('Cancel', '取消'),
  confirm: localized('Continue', '继续'),
} as const;
const sections = [
  { id: 'overlays-popover', label: popoverCopy.label },
  { id: 'overlays-context-menu', label: contextMenuCopy.label },
  { id: 'overlays-dialog', label: dialogCopy.label },
] as const;
</script>

<template>
  <div class="grid gap-grid">
    <UiSurface
      v-if="!isFocused"
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
        class="h-auto min-h-0 rounded-control px-3 py-1.5 text-body-sm font-regular text-secondary hover:bg-accent-soft hover:text-primary"
      />
    </UiSurface>

    <LabSpecimenSection
      id="overlays-popover"
      :selection-ids="['overlays-dropdown-menu']"
      :title="localize(popoverCopy.label, props.locale)"
      :description="localize(popoverCopy.description, props.locale)"
    >
      <OverlayModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="overlays-context-menu"
      :title="localize(contextMenuCopy.label, props.locale)"
      :description="localize(contextMenuCopy.description, props.locale)"
    >
      <ContextMenuModule :locale="props.locale" />
    </LabSpecimenSection>

    <LabSpecimenSection
      id="overlays-dialog"
      :title="localize(dialogCopy.label, props.locale)"
      :description="localize(dialogCopy.description, props.locale)"
    >
      <UiButton data-dialog-open @click="dialogOpen = true">
        {{ localize(dialogCopy.open, props.locale) }}
      </UiButton>
      <UiDialog v-model:open="dialogOpen" :title="localize(dialogCopy.title, props.locale)">
        <p>{{ localize(dialogCopy.body, props.locale) }}</p>
        <template #footer>
          <UiButton variant="ghost" @click="dialogOpen = false">
            {{ localize(dialogCopy.cancel, props.locale) }}
          </UiButton>
          <UiButton @click="dialogOpen = false">
            {{ localize(dialogCopy.confirm, props.locale) }}
          </UiButton>
        </template>
      </UiDialog>
    </LabSpecimenSection>
  </div>
</template>
