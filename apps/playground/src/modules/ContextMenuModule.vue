<script setup lang="ts">
import { UiContextMenu } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();

const contextMenuOpen = ref(false);
const contextMenuPoint = ref({ x: 0, y: 0 });
const contextMenuAutoFocus = ref(true);
const selectedAction = ref('');
const contextTheme = ref('system');
const contextLocale = ref('en');
const contextShowDetails = ref(true);

function openContextMenu(event: MouseEvent) {
  event.preventDefault();
  contextMenuPoint.value = { x: event.clientX, y: event.clientY };
  // A pointer open keeps the region's focus so an editor keeps its selection; the
  // keyboard button below opens with focus in the panel.
  contextMenuAutoFocus.value = false;
  contextMenuOpen.value = true;
}

function openContextMenuFromKeyboard() {
  const zone = document.querySelector<HTMLElement>('[data-context-menu-zone]');
  const rect = zone?.getBoundingClientRect();
  contextMenuPoint.value = { x: (rect?.left ?? 0) + 24, y: (rect?.top ?? 0) + 24 };
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
} as const;

const entries = computed(() => [
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

/** Applies the specimen's own state so checkable rows and submenus stay observable. */
function applySelection(id: string) {
  if (id === 'details') contextShowDetails.value = !contextShowDetails.value;
  else if (id.startsWith('theme:')) contextTheme.value = id.slice(6);
  else if (id.startsWith('locale:')) contextLocale.value = id.slice(7);
  else selectedAction.value = id;
}
</script>

<template>
  <MaterialBackdrop edge="inset">
    <div class="grid gap-4" data-contract-state="default">
      <section
        class="rounded-control border border-subtle p-4 text-caption text-secondary"
        data-context-menu-zone
        :aria-label="localize(copy.zone, props.locale)"
        @contextmenu="openContextMenu"
      >
        <p class="m-0">{{ localize(copy.zone, props.locale) }}</p>
        <p class="m-0 mt-2">
          {{ localize(copy.theme, props.locale) }}: {{ contextTheme }} ·
          {{ localize(copy.locale, props.locale) }}: {{ contextLocale }} ·
          {{ localize(copy.details, props.locale) }}: {{ contextShowDetails ? 'on' : 'off' }}
        </p>
        <button
          class="mt-2 rounded-control border border-default px-2 py-1 text-caption"
          type="button"
          data-context-menu-keyboard
          @click="openContextMenuFromKeyboard"
        >
          {{ localize(copy.keyboard, props.locale) }}
        </button>
      </section>

      <UiContextMenu
        :open="contextMenuOpen"
        v-bind="{ ariaLabel: localize(copy.label, props.locale) }"
        :point="contextMenuPoint"
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
  </MaterialBackdrop>
</template>
