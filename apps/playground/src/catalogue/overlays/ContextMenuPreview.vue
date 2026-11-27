<script setup lang="ts">
import { UiButton, UiContextMenu } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import { localize, localized } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';

const props = defineProps<LabModuleProps>();

const contextMenuOpen = ref(false);
const contextMenuPoint = ref({ x: 0, y: 0 });
const contextMenuAutoFocus = ref(true);
const selectedAction = ref('');
const contextTheme = ref('system');
const contextLocale = ref('en');
const contextShowDetails = ref(true);
const contextMenuTarget = ref<'canvas' | 'asset'>('canvas');
const assetLocked = ref(false);
const contextMenuFocusReturn = ref<HTMLElement>();

function openContextMenu(event: MouseEvent, target: 'canvas' | 'asset' = 'canvas') {
  event.preventDefault();
  contextMenuTarget.value = target;
  contextMenuPoint.value = { x: event.clientX, y: event.clientY };
  contextMenuFocusReturn.value = undefined;
  // A pointer open keeps the region's focus so an editor keeps its selection; the
  // keyboard button below opens with focus in the panel.
  contextMenuAutoFocus.value = false;
  contextMenuOpen.value = true;
}

function openContextMenuFromKeyboard(event: MouseEvent, target: 'canvas' | 'asset') {
  const trigger = event.currentTarget as HTMLElement;
  const rect = trigger.getBoundingClientRect();
  contextMenuTarget.value = target;
  contextMenuPoint.value = { x: rect.left, y: rect.bottom };
  contextMenuFocusReturn.value = trigger;
  contextMenuAutoFocus.value = true;
  contextMenuOpen.value = true;
}

const copy = {
  zone: localized('Right-click inside this area', '在此区域右键打开上下文菜单'),
  label: localized('Page actions', '页面操作'),
  edit: localized('Edit', '编辑'),
  copy: localized('Copy', '复制'),
  archive: localized('Archive', '归档'),
  remove: localized('Remove', '移除'),
  disabled: localized('Disabled action', '禁用操作'),
  theme: localized('Theme', '主题'),
  locale: localized('Language', '语言'),
  details: localized('Show details', '显示详情'),
  keyboard: localized('Open with keyboard focus', '以键盘焦点打开'),
  light: localized('Light', '浅色'),
  dark: localized('Dark', '深色'),
  system: localized('System', '系统'),
  english: localized('English', 'English'),
  chinese: localized('Chinese', '中文'),
  selected: localized('Selected action', '已选择操作'),
  assetZone: localized('Right-click asset item', '右键资源卡片操作'),
  assetTitle: localized('glass-surface-spec.fig', 'glass-surface-spec.fig'),
  assetMeta: localized('Layer preset · Shared Glass', '图层预设 · 共享玻璃材质'),
  openAssetMenu: localized('Asset menu', '资源菜单'),
  rename: localized('Rename asset', '重命名资源'),
  duplicate: localized('Duplicate', '创建副本'),
  lockLayer: localized('Lock layer', '锁定图层'),
  exportPreset: localized('Export preset', '导出预设'),
} as const;

const canvasEntries = computed(() => [
  { type: 'heading' as const, id: 'edit', label: localize(copy.edit, props.locale) },
  { id: 'copy', label: localize(copy.copy, props.locale), shortcut: 'Ctrl+C' },
  {
    id: 'details',
    label: localize(copy.details, props.locale),
    selection: 'multiple' as const,
    checked: contextShowDetails.value,
  },
  { type: 'separator' as const, id: 'sep' },
  { id: 'archive', label: localize(copy.archive, props.locale) },
  {
    id: 'theme',
    label: localize(copy.theme, props.locale),
    children: (['light', 'dark', 'system'] as const).map((value) => ({
      id: `theme:${value}`,
      label: localize(
        value === 'light' ? copy.light : value === 'dark' ? copy.dark : copy.system,
        props.locale,
      ),
      group: 'theme',
      selection: 'single' as const,
      checked: contextTheme.value === value,
    })),
  },
  {
    id: 'locale',
    label: localize(copy.locale, props.locale),
    children: [
      {
        id: 'locale:en',
        label: localize(copy.english, props.locale),
        group: 'locale',
        selection: 'single' as const,
        checked: contextLocale.value === 'en',
      },
      {
        id: 'locale:zh',
        label: localize(copy.chinese, props.locale),
        group: 'locale',
        selection: 'single' as const,
        checked: contextLocale.value === 'zh',
      },
    ],
  },
  { type: 'separator' as const, id: 'sep-danger' },
  { id: 'disabled', label: localize(copy.disabled, props.locale), disabled: true },
  { id: 'remove', label: localize(copy.remove, props.locale), tone: 'danger' as const },
]);

const assetEntries = computed(() => [
  { type: 'heading' as const, id: 'asset-hdr', label: localize(copy.assetTitle, props.locale) },
  { id: 'rename', label: localize(copy.rename, props.locale), shortcut: 'F2' },
  { id: 'duplicate', label: localize(copy.duplicate, props.locale), shortcut: 'Ctrl+D' },
  {
    id: 'lock',
    label: localize(copy.lockLayer, props.locale),
    selection: 'multiple' as const,
    checked: assetLocked.value,
  },
  { type: 'separator' as const, id: 'asset-sep' },
  {
    id: 'export',
    label: localize(copy.exportPreset, props.locale),
    children: [
      { id: 'export:tokens', label: 'Tokens JSON' },
      { id: 'export:css', label: 'CSS Variables' },
    ],
  },
  { id: 'remove', label: localize(copy.remove, props.locale), tone: 'danger' as const },
]);

const entries = computed(() =>
  contextMenuTarget.value === 'asset' ? assetEntries.value : canvasEntries.value,
);

/** Applies the specimen's own state so checkable rows and submenus stay observable. */
function applySelection(id: string) {
  if (id === 'details') contextShowDetails.value = !contextShowDetails.value;
  else if (id === 'lock') assetLocked.value = !assetLocked.value;
  else if (id.startsWith('theme:')) contextTheme.value = id.slice(6);
  else if (id.startsWith('locale:')) contextLocale.value = id.slice(7);
  else selectedAction.value = id;
}
</script>

<template>
  <div class="grid gap-4" data-contract-state="default">
    <div class="grid gap-3 md:grid-cols-2">
      <section
        class="rounded-control border border-subtle p-4 text-caption text-secondary"
        data-context-menu-zone
        :aria-label="localize(copy.zone, props.locale)"
        @contextmenu="openContextMenu($event, 'canvas')"
      >
        <p class="m-0">{{ localize(copy.zone, props.locale) }}</p>
        <p class="m-0 mt-2">
          {{ localize(copy.theme, props.locale) }}: {{ contextTheme }} ·
          {{ localize(copy.locale, props.locale) }}: {{ contextLocale }} ·
          {{ localize(copy.details, props.locale) }}: {{ contextShowDetails ? 'on' : 'off' }}
        </p>
        <UiButton
          class="mt-3"
          size="sm"
          variant="secondary"
          data-context-menu-keyboard
          @click="openContextMenuFromKeyboard($event, 'canvas')"
        >
          {{ localize(copy.keyboard, props.locale) }}
        </UiButton>
      </section>

      <section
        class="rounded-control border border-subtle p-4 text-caption text-secondary"
        data-context-menu-asset-zone
        :aria-label="localize(copy.assetZone, props.locale)"
        @contextmenu="openContextMenu($event, 'asset')"
      >
        <p class="m-0 text-primary">{{ localize(copy.assetTitle, props.locale) }}</p>
        <p class="m-0 mt-2">
          {{ localize(copy.assetMeta, props.locale) }} ·
          {{ localize(copy.lockLayer, props.locale) }}: {{ assetLocked ? 'on' : 'off' }}
        </p>
        <UiButton
          class="mt-3"
          size="sm"
          variant="ghost"
          data-context-menu-asset-trigger
          @click="
            $event.detail === 0
              ? openContextMenuFromKeyboard($event, 'asset')
              : openContextMenu($event, 'asset')
          "
        >
          {{ localize(copy.openAssetMenu, props.locale) }}
        </UiButton>
      </section>
    </div>

    <UiContextMenu
      :open="contextMenuOpen"
      v-bind="{ ariaLabel: localize(copy.label, props.locale) }"
      :point="contextMenuPoint"
      :focus-return="contextMenuFocusReturn"
      :auto-focus="contextMenuAutoFocus"
      :entries="entries"
      data-overlay-context-menu
      @update:open="contextMenuOpen = $event"
      @select="applySelection($event.id)"
    />

    <output class="text-caption text-secondary" aria-live="polite" data-overlay-selection>
      {{ localize(copy.selected, props.locale) }}: {{ selectedAction || '—' }}
    </output>
  </div>
</template>
