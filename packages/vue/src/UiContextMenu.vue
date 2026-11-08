<script setup lang="ts">
import {
  type AnchoredOverlayOptions,
  hideAnchoredOverlay,
  isOverlayOpen,
  showAnchoredOverlay,
  stopOverlayTracking,
  supportsPopover,
} from '@neoverse-ui/overlay-runtime';
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { presence } from './presence';
import type { ContextMenuEntry, ContextMenuItem, ContextMenuProps } from './types';

const props = withDefaults(defineProps<ContextMenuProps>(), { autoFocus: true });
const emit = defineEmits<{
  'update:open': [value: boolean];
  select: [item: ContextMenuItem];
}>();

const panelRef = ref<HTMLElement | null>(null);
const panelId = `${useId()}-context-menu`;
const submenuId = `${useId()}-context-submenu`;
// Remember the pre-open focus owner so a cursor-opened menu still returns focus.
let restoreTarget: HTMLElement | null = null;
let ignoreNativeClose = false;

const visibleEntries = computed(() => props.entries);
// The submenu is a second column of the same glass panel: a second popover would
// light-dismiss the parent, and a nested glass surface cannot sample the page behind it.
// 二级菜单是同一玻璃面板的第二列：第二个浮层会轻触关闭父面板，嵌套的玻璃面又采样不到背后的页面。
const openSubmenu = ref<ContextMenuItem | null>(null);
// The submenu column starts at the row that opened it, the way a native submenu aligns to
// its parent item, so the offset is measured from the panel's content box.
// 二级列从打开它的行开始，与原生二级菜单对齐父项的方式一致，因此偏移量相对面板内容盒测量。
const submenuRef = ref<HTMLElement | null>(null);
// The row that opened the column, kept so the column can follow the panel while it moves.
// 打开该列的行，保留它以便列在面板移动时跟随。
let submenuOpener: HTMLButtonElement | null = null;
let observer: ResizeObserver | null = null;
const submenuEntries = computed(() => openSubmenu.value?.children ?? []);

function isItem(entry: ContextMenuEntry): entry is ContextMenuItem {
  return !('type' in entry);
}

function itemRole(item: ContextMenuItem): string {
  if (item.selection === 'single') return 'menuitemradio';
  if (item.selection === 'multiple') return 'menuitemcheckbox';
  return 'menuitem';
}

// Checkable state only exists for radio and checkbox rows, so it is bound as a
// whole attribute map instead of a permanently present attribute.
function checkableState(item: ContextMenuItem): Record<string, string> {
  if (item.selection === undefined) return {};
  return { 'aria-checked': item.checked === true ? 'true' : 'false' };
}

function overlayOptions(): AnchoredOverlayOptions | undefined {
  const overlay = panelRef.value;
  if (overlay === null) return undefined;

  return {
    ...(props.point === undefined ? {} : { point: props.point }),
    ...(props.focusReturn === undefined ? {} : { focusReturn: props.focusReturn }),
    overlay,
    gapVariable: '--neoverse-overlay-gap',
    leftVariable: '--neoverse-overlay-left',
    topVariable: '--neoverse-overlay-top',
    placement: 'auto',
    fallbackOpenClass: 'ui-overlay-panel--fallback-open',
    // The panel owns a nested submenu popover, which must not count as an outside click.
    // 面板拥有一个嵌套的二级浮层，它不能被算作外部点击。
    manual: true,
    containedElements: () => [submenuRef.value],
    onDismiss: () => requestDismiss(),
  };
}

function rowsOf(root: HTMLElement | null): HTMLButtonElement[] {
  return Array.from(
    root?.querySelectorAll<HTMLButtonElement>('.ui-context-menu__item:not(:disabled)') ?? [],
  );
}

function menuItems(): HTMLButtonElement[] {
  return rowsOf(panelRef.value);
}

function focusFirstItem() {
  requestAnimationFrame(() => {
    const panel = panelRef.value;
    if (props.open && panel && isOverlayOpen(panel, 'ui-overlay-panel--fallback-open')) {
      menuItems()[0]?.focus();
    }
  });
}

// The panel grows from the edge it rests against, so a menu that flips above
// its pointer does not slide in from the wrong side.
function syncMotionOrigin() {
  const side = panelRef.value?.dataset.neoverseOverlaySide;
  panelRef.value?.setAttribute('data-neoverse-motion-origin', side === 'top' ? 'bottom' : 'top');
}

async function syncOverlay(value: boolean) {
  await nextTick();
  const options = overlayOptions();
  if (options === undefined) return;
  if (value) {
    restoreTarget = props.focusReturn ?? (document.activeElement as HTMLElement | null);
    showAnchoredOverlay(options);
    syncMotionOrigin();
    // A pointer open keeps the editor's focus and selection; a keyboard open must move
    // focus into the panel so the rows are reachable.
    // 指针打开保留编辑器的焦点与选区；键盘打开必须把焦点移入面板，菜单行才可操作。
    if (props.autoFocus) focusFirstItem();
  } else {
    if (isOverlayOpen(options.overlay, options.fallbackOpenClass)) ignoreNativeClose = true;
    // The submenu is its own popover, so it must be dismissed with the panel.
    // 二级菜单是独立浮层，必须随面板一起关闭。
    closeSubmenuPopover();
    openSubmenu.value = null;
    hideAnchoredOverlay(options);
  }
}

function requestDismiss() {
  emit('update:open', false);
}

function closeAndRestoreFocus() {
  emit('update:open', false);
  void nextTick(() => {
    const target = props.focusReturn ?? restoreTarget;
    if (target?.isConnected) target.focus();
    restoreTarget = null;
  });
}

function onPanelToggle(event: Event) {
  const panel = event.currentTarget as HTMLElement;
  const newState = (event as Event & { newState?: 'open' | 'closed' }).newState;
  if (newState === 'open') {
    ignoreNativeClose = false;
    return;
  }
  if (newState === 'closed' && ignoreNativeClose) {
    ignoreNativeClose = false;
    return;
  }
  if (isOverlayOpen(panel, 'ui-overlay-panel--fallback-open')) return;

  closeSubmenuPopover();
  openSubmenu.value = null;
  stopOverlayTracking(panel);
  if (props.open) requestDismiss();
}

function selectItem(item: ContextMenuItem) {
  if (item.disabled) return;
  emit('select', item);
  closeAndRestoreFocus();
}

/**
 * Opens the submenu beside its opener row. The column is its own manual popover in the top
 * layer: it touches the panel edge, aligns to the row that opened it, and flips to the
 * inline start when it does not fit.
 * 在打开它的行旁展开二级列。该列是顶层里独立的 manual 浮层：它贴着面板边缘，与打开它的行对齐，
 * 放不下时翻到起始侧。
 */
async function enterSubmenu(item: ContextMenuItem, opener: HTMLButtonElement, moveFocus = true) {
  if (item.disabled || !item.children?.length) return;
  openSubmenu.value = item;
  submenuOpener = opener;
  await nextTick();
  const panel = panelRef.value;
  const submenu = submenuRef.value;
  if (panel === null || submenu === null) return;
  if (supportsPopover(submenu)) {
    if (!submenu.matches(':popover-open')) submenu.showPopover();
  } else {
    submenu.classList.add('ui-context-menu__submenu--open');
  }
  // The column is placed after it is shown so its measured size is real, and re-placed
  // whenever the panel or the page moves: a fixed column must not drift from its panel.
  // 该列在显示后定位，尺寸测量才真实；面板或页面移动时重新定位，固定定位的列不能偏离面板。
  placeSubmenu(opener);
  observer?.disconnect();
  observer = new ResizeObserver(() => placeSubmenu(opener));
  observer.observe(panel);
  window.addEventListener('scroll', onViewportChange, true);
  window.addEventListener('resize', onViewportChange);
  if (moveFocus) void nextTick(() => rowsOf(submenu)[0]?.focus());
}

/** Places the open column flush against the panel, aligned to the row that opened it. */
function placeSubmenu(opener: HTMLButtonElement) {
  const panel = panelRef.value;
  const submenu = submenuRef.value;
  if (panel === null || submenu === null) return;
  const panelRect = panel.getBoundingClientRect();
  const openerRect = opener.getBoundingClientRect();
  const margin = 8;
  const width = submenu.offsetWidth;
  const height = submenu.offsetHeight;
  // Flush with the panel edge, flipping to the inline start when the viewport has no room.
  // 贴着面板边缘，视口放不下时翻到起始侧。
  const toStart = panelRect.right + width > window.innerWidth - margin;
  const left = toStart ? panelRect.left - width : panelRect.right;
  // The column's own padding sits above its first row, so it is lifted by that amount to put
  // the first row on the parent item, the way a native submenu lines up.
  // 该列自身的内边距位于首行之上，因此上移同样的距离，使首行与父项对齐，与原生二级菜单一致。
  const paddingTop = Number.parseFloat(getComputedStyle(submenu).paddingTop) || 0;
  const top = Math.min(
    Math.max(margin, openerRect.top - paddingTop),
    Math.max(margin, window.innerHeight - height - margin),
  );
  submenu.style.setProperty('--neoverse-overlay-left', `${left}px`);
  submenu.style.setProperty('--neoverse-overlay-top', `${top}px`);
}

function onViewportChange() {
  if (submenuOpener !== null) placeSubmenu(submenuOpener);
}

function stopTrackingSubmenu() {
  observer?.disconnect();
  observer = null;
  window.removeEventListener('scroll', onViewportChange, true);
  window.removeEventListener('resize', onViewportChange);
  submenuOpener = null;
}

/**
 * Pointer hover opens a submenu row and closes the open column when another row is entered,
 * the way a native menu tracks the pointer. Hover never moves focus.
 * 指针悬停展开二级菜单行，进入其他行时关闭已展开的列，与原生菜单跟随指针的方式一致。悬停不移动焦点。
 */
function onItemPointerEnter(entry: ContextMenuItem, event: PointerEvent) {
  if (entry.disabled) return;
  if (entry.children?.length) {
    if (openSubmenu.value?.id === entry.id) return;
    void enterSubmenu(entry, event.currentTarget as HTMLButtonElement, false);
    return;
  }
  closeSubmenuPopover();
  openSubmenu.value = null;
}

/** Hides the submenu popover without touching focus or the selected entry. */
function closeSubmenuPopover() {
  stopTrackingSubmenu();
  const submenu = submenuRef.value;
  if (submenu === null) return;
  if (supportsPopover(submenu)) {
    if (submenu.matches(':popover-open')) submenu.hidePopover();
  } else {
    submenu.classList.remove('ui-context-menu__submenu--open');
  }
}

/** Closes the submenu column and returns focus to the row that opened it. */
function leaveSubmenu() {
  const openerId = openSubmenu.value?.id;
  closeSubmenuPopover();
  openSubmenu.value = null;
  void nextTick(() => {
    const row = menuItems().find((element) => element.dataset.entryId === openerId);
    (row ?? menuItems()[0])?.focus();
  });
}

function focusRelative(current: HTMLButtonElement, direction: 1 | -1) {
  const scope = current.closest('.ui-context-menu__submenu') ?? panelRef.value;
  const items = rowsOf(scope as HTMLElement | null);
  if (items.length === 0) return;
  const index = items.indexOf(current);
  items[(index + direction + items.length) % items.length]?.focus();
}

// With focus left in the region (a pointer open), panel-scoped keydown never fires. The
// document listener lets an arrow key enter the panel from wherever focus currently sits.
// 指针打开时焦点留在区域，面板内的 keydown 不会触发。文档级监听使方向键能从当前焦点进入面板。
function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  if (!props.open) return;
  const panel = panelRef.value;
  if (panel === null) return;
  const target = event.target;
  if (target instanceof Node && panel.contains(target)) return;
  const items = menuItems();
  if (items.length === 0) return;
  event.preventDefault();
  (event.key === 'ArrowDown' ? items[0] : items.at(-1))?.focus();
}

function onMenuKeydown(event: KeyboardEvent) {
  const inSubmenu = openSubmenu.value !== null;
  if (!(event.target instanceof HTMLButtonElement)) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = menuItems();
    if (items.length === 0) return;
    event.preventDefault();
    (event.key === 'ArrowDown' ? items[0] : items.at(-1))?.focus();
    return;
  }
  const current = event.target;

  if (event.key === 'ArrowRight' && !inSubmenu) {
    const item = visibleEntries.value.find(
      (entry): entry is ContextMenuItem => isItem(entry) && entry.id === current.dataset.entryId,
    );
    if (item !== undefined) {
      event.preventDefault();
      void enterSubmenu(item, current);
    }
    return;
  }

  if (event.key === 'ArrowLeft' && inSubmenu) {
    event.preventDefault();
    leaveSubmenu();
    return;
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    focusRelative(current, event.key === 'ArrowDown' ? 1 : -1);
    return;
  }

  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    const scope = current.closest('.ui-context-menu__submenu') ?? panelRef.value;
    const items = rowsOf(scope as HTMLElement | null);
    (event.key === 'Home' ? items[0] : items.at(-1))?.focus();
  }
}

watch(
  () => props.open,
  (value) => {
    if (typeof document === 'undefined') return;
    if (value) document.addEventListener('keydown', onDocumentKeydown);
    else document.removeEventListener('keydown', onDocumentKeydown);
  },
  { immediate: true },
);

watch(
  () => [props.open, props.point] as const,
  ([value]) => {
    void syncOverlay(value);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  closeSubmenuPopover();
  stopTrackingSubmenu();
  if (typeof document !== 'undefined') document.removeEventListener('keydown', onDocumentKeydown);
  const options = overlayOptions();
  if (options !== undefined) hideAnchoredOverlay(options);
});
</script>

<template>
  <div
    ref="panelRef"
    :id="panelId"
    class="ui-overlay-panel ui-context-menu material-glass-immersive nv-presence"
    popover="manual"
    role="menu"
    :aria-label="props.ariaLabel"
    v-bind="presence('pop', 'top')"
    @toggle="onPanelToggle"
    @keydown="onMenuKeydown"
  >
    <div class="ui-context-menu__level" role="none">
      <template
        v-for="(entry, index) in visibleEntries"
        :key="'id' in entry && entry.id ? entry.id : index"
      >
        <hr v-if="'type' in entry && entry.type === 'separator'" class="ui-context-menu__separator">
        <p v-else-if="'type' in entry && entry.type === 'heading'" class="ui-context-menu__heading">
          {{ entry.label }}
        </p>
        <button
          v-else-if="isItem(entry)"
          class="ui-context-menu__item"
          type="button"
          :role="itemRole(entry)"
          :disabled="entry.disabled"
          :data-entry-id="entry.id"
          :data-tone="entry.tone ?? 'default'"
          :data-open="openSubmenu?.id === entry.id ? 'true' : undefined"
          :aria-haspopup="entry.children?.length ? 'menu' : undefined"
          :aria-expanded="
            entry.children?.length ? (openSubmenu?.id === entry.id ? 'true' : 'false') : undefined
          "
          :aria-controls="entry.children?.length ? submenuId : undefined"
          v-bind="checkableState(entry)"
          @pointerenter="onItemPointerEnter(entry, $event)"
          @click="
            entry.children?.length
              ? enterSubmenu(entry, $event.currentTarget as HTMLButtonElement)
              : selectItem(entry)
          "
        >
          <span
            v-if="entry.selection !== undefined"
            class="ui-context-menu__check"
            aria-hidden="true"
            >{{ entry.checked ? '✓' : '' }}</span
          >
          <span class="ui-context-menu__label">{{ entry.label }}</span>
          <span v-if="entry.shortcut" class="ui-context-menu__shortcut">{{ entry.shortcut }}</span>
          <span
            v-else-if="entry.children?.length"
            class="ui-context-menu__chevron"
            aria-hidden="true"
            >›</span
          >
        </button>
      </template>
    </div>

    <Teleport to="body">
      <div
        v-if="openSubmenu !== null"
        :id="submenuId"
        ref="submenuRef"
        class="ui-context-menu__submenu nv-presence"
        popover="manual"
        role="menu"
        :aria-label="openSubmenu.label"
        v-bind="presence('slide-end', 'start')"
      >
        <button
          v-for="child in submenuEntries"
          :key="child.id"
          class="ui-context-menu__item"
          type="button"
          :role="itemRole(child)"
          :disabled="child.disabled"
          :data-entry-id="child.id"
          v-bind="checkableState(child)"
          @click="selectItem(child)"
        >
          <span
            v-if="child.selection !== undefined"
            class="ui-context-menu__check"
            aria-hidden="true"
            >{{ child.checked ? '✓' : '' }}</span
          >
          <span class="ui-context-menu__label">{{ child.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>
