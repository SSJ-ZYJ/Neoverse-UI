import {
  type AnchoredOverlayOptions,
  focusElement,
  hideAnchoredOverlay,
  installFocusModality,
  isOverlayOpen,
  openOverlayWithMotion,
  refreshOverlayExit,
  resolveOverlayViewportLayoutBounds,
  showAnchoredOverlay,
  stopOverlayTracking,
  supportsPopover,
} from '@neoverse-ui/overlay-runtime';
import { computed, nextTick, onBeforeUnmount, type Ref, ref, watch } from 'vue';
import type { ContextMenuEntry, ContextMenuItem, ContextMenuProps } from '../../types';

// Overlap enough for the submenu surface to cover the parent's CSS rim.
const SUBMENU_EDGE_OVERLAP = 4;

export function isContextMenuItem(entry: ContextMenuEntry): entry is ContextMenuItem {
  return !('type' in entry);
}

export function contextMenuItemRole(item: ContextMenuItem): string {
  if (item.selection === 'single') return 'menuitemradio';
  if (item.selection === 'multiple') return 'menuitemcheckbox';
  return 'menuitem';
}

// Checkable state only exists for radio and checkbox rows, so it is bound as a
// whole attribute map instead of a permanently present attribute.
export function contextMenuCheckableState(item: ContextMenuItem): Record<string, string> {
  if (item.selection === undefined) return {};
  return { 'aria-checked': item.checked === true ? 'true' : 'false' };
}

function rowsOf(root: HTMLElement | null): HTMLButtonElement[] {
  return Array.from(
    root?.querySelectorAll<HTMLButtonElement>('.ui-context-menu__item:not(:disabled)') ?? [],
  );
}

export interface UseContextMenuOptions {
  panelRef: Ref<HTMLElement | null>;
  submenuRef: Ref<HTMLElement | null>;
  props: ContextMenuProps & { autoFocus: boolean };
  onUpdateOpen: (value: boolean) => void;
  onSelect: (item: ContextMenuItem) => void;
}

/** Manages top-layer placement, submenu column tracking, focus restoration and keyboard traversal. */
export function createContextMenuState(options: UseContextMenuOptions) {
  const { panelRef, submenuRef, props, onUpdateOpen, onSelect } = options;
  const submenuState = ref<{ item: ContextMenuItem; open: boolean } | null>(null);
  const openSubmenu = computed(() => (submenuState.value?.open ? submenuState.value.item : null));
  const submenuContent = computed(() => submenuState.value?.item);
  const visibleEntries = computed(() => props.entries);
  const submenuEntries = computed(() => submenuContent.value?.children ?? []);

  let restoreTarget: HTMLElement | null = null;
  let ignoreNativeClose = false;
  let submenuOpener: HTMLButtonElement | null = null;
  let observer: ResizeObserver | null = null;
  let positionObserver: MutationObserver | null = null;

  function overlayOptions(): AnchoredOverlayOptions | undefined {
    const overlay = panelRef.value;
    if (overlay === null) return undefined;

    return {
      ...(props.point === undefined ? {} : { point: props.point }),
      ...(props.focusReturn === undefined ? {} : { focusReturn: props.focusReturn }),
      previousFocus: () => restoreTarget,
      overlay,
      gapVariable: '--neoverse-overlay-gap',
      leftVariable: '--neoverse-overlay-left',
      topVariable: '--neoverse-overlay-top',
      placement: 'auto',
      fallbackOpenClass: 'ui-overlay-panel--fallback-open',
      manual: true,
      containedElements: () => [submenuRef.value],
      onDismiss: () => onUpdateOpen(false),
    };
  }

  function menuItems(): HTMLButtonElement[] {
    return rowsOf(panelRef.value);
  }

  function focusFirstItem() {
    requestAnimationFrame(() => {
      const panel = panelRef.value;
      if (props.open && panel && isOverlayOpen(panel, 'ui-overlay-panel--fallback-open')) {
        focusElement(menuItems()[0], { preventScroll: true });
      }
    });
  }

  function syncMotionOrigin() {
    const side = panelRef.value?.dataset.neoverseOverlaySide;
    panelRef.value?.setAttribute('data-neoverse-motion-origin', side === 'top' ? 'bottom' : 'top');
  }

  function placeSubmenu(opener: HTMLButtonElement) {
    const panel = panelRef.value;
    const submenu = submenuRef.value;
    if (panel === null || submenu === null) return;
    const { left: panelLeft, right: panelRight } = resolveOverlayViewportLayoutBounds(panel);
    const openerRect = opener.getBoundingClientRect();
    const margin = 8;
    const width = submenu.offsetWidth;
    const height = submenu.offsetHeight;
    const toStart = panelRight + width > window.innerWidth - margin;
    const left = toStart
      ? panelLeft - width + SUBMENU_EDGE_OVERLAP
      : panelRight - SUBMENU_EDGE_OVERLAP;
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
    positionObserver?.disconnect();
    positionObserver = null;
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('resize', onViewportChange);
    submenuOpener = null;
  }

  function closeSubmenuPopover() {
    if (!submenuState.value?.open) return;
    stopTrackingSubmenu();
    submenuState.value.open = false;
    const submenu = submenuRef.value;
    if (submenu === null) return;
    if (supportsPopover(submenu)) {
      if (submenu.matches(':popover-open')) submenu.hidePopover();
    } else {
      refreshOverlayExit(submenu);
      submenu.classList.remove('ui-context-menu__submenu--open');
    }
  }

  async function syncOverlay(value: boolean) {
    await nextTick();
    const overlay = overlayOptions();
    if (overlay === undefined) return;
    if (value) {
      const opening = !isOverlayOpen(overlay.overlay, overlay.fallbackOpenClass);
      if (opening) {
        restoreTarget = props.focusReturn ?? (document.activeElement as HTMLElement | null);
      } else closeSubmenuPopover();
      showAnchoredOverlay(overlay);
      syncMotionOrigin();
      if (opening && props.autoFocus) focusFirstItem();
    } else {
      if (isOverlayOpen(overlay.overlay, overlay.fallbackOpenClass)) ignoreNativeClose = true;
      closeSubmenuPopover();
      hideAnchoredOverlay(overlay);
    }
  }

  function closeAndRestoreFocus(modality: 'auto' | 'keyboard' | 'pointer' = 'auto') {
    onUpdateOpen(false);
    void nextTick(() => {
      const target = props.focusReturn ?? restoreTarget;
      if (target?.isConnected) focusElement(target, { preventScroll: true, modality });
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
    stopOverlayTracking(panel);
    if (props.open) onUpdateOpen(false);
  }

  function selectItem(item: ContextMenuItem) {
    if (item.disabled) return;
    onSelect(item);
    closeAndRestoreFocus();
  }

  async function enterSubmenu(item: ContextMenuItem, opener: HTMLButtonElement, moveFocus = true) {
    if (item.disabled || !item.children?.length) return;
    const alreadyOpen = openSubmenu.value?.id === item.id;
    if (!alreadyOpen) submenuState.value = { item, open: true };
    submenuOpener = opener;
    await nextTick();
    if (openSubmenu.value?.id !== item.id) return;
    const panel = panelRef.value;
    const submenu = submenuRef.value;
    if (panel === null || submenu === null) return;
    openOverlayWithMotion(
      submenu,
      opener,
      () => {
        if (supportsPopover(submenu)) {
          if (!submenu.matches(':popover-open')) submenu.showPopover();
        } else {
          submenu.classList.add('ui-context-menu__submenu--open');
        }
        placeSubmenu(opener);
      },
      !alreadyOpen,
    );
    observer?.disconnect();
    observer = new ResizeObserver(() => placeSubmenu(opener));
    observer.observe(panel);
    positionObserver?.disconnect();
    positionObserver = new MutationObserver(() => placeSubmenu(opener));
    positionObserver.observe(panel, { attributes: true, attributeFilter: ['style'] });
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    if (moveFocus) void nextTick(() => focusElement(rowsOf(submenu)[0], { preventScroll: true }));
  }

  function onItemPointerMove(entry: ContextMenuItem, event: PointerEvent) {
    // A moving column can change hit targets under a stationary pointer.
    if (event.pointerType === 'touch' || entry.disabled) return;
    if (entry.children?.length) {
      if (openSubmenu.value?.id === entry.id) return;
      void enterSubmenu(entry, event.currentTarget as HTMLButtonElement, false);
      return;
    }
    closeSubmenuPopover();
  }

  function leaveSubmenu() {
    const openerId = openSubmenu.value?.id;
    closeSubmenuPopover();
    void nextTick(() => {
      const row = menuItems().find((element) => element.dataset.entryId === openerId);
      focusElement(row ?? menuItems()[0], { modality: 'keyboard' });
    });
  }

  function focusRelative(current: HTMLButtonElement, direction: 1 | -1) {
    const scope = current.closest('.ui-context-menu__submenu') ?? panelRef.value;
    const items = rowsOf(scope as HTMLElement | null);
    if (items.length === 0) return;
    const index = items.indexOf(current);
    focusElement(items[(index + direction + items.length) % items.length], {
      modality: 'keyboard',
    });
  }

  function onDocumentKeydown(event: KeyboardEvent) {
    if (!props.open) return;
    if (event.key === 'Tab') {
      const panel = panelRef.value;
      const submenu = submenuRef.value;
      const target = event.target;
      const active = document.activeElement;
      const insideMenu =
        (target instanceof Node && (panel?.contains(target) || submenu?.contains(target))) ||
        panel?.contains(active) ||
        submenu?.contains(active);
      if (insideMenu) {
        event.preventDefault();
        closeAndRestoreFocus('keyboard');
      } else {
        onUpdateOpen(false);
      }
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const panel = panelRef.value;
    if (panel === null) return;
    const target = event.target;
    if (target instanceof Node && panel.contains(target)) return;
    const items = menuItems();
    if (items.length === 0) return;
    event.preventDefault();
    focusElement(event.key === 'ArrowDown' ? items[0] : items.at(-1), { modality: 'keyboard' });
  }

  function onMenuKeydown(event: KeyboardEvent) {
    const inSubmenu = openSubmenu.value !== null;
    if (!(event.target instanceof HTMLButtonElement)) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const items = inSubmenu ? rowsOf(submenuRef.value) : menuItems();
      if (items.length === 0) return;
      event.preventDefault();
      focusElement(event.key === 'ArrowDown' ? items[0] : items.at(-1), { modality: 'keyboard' });
      return;
    }
    const current = event.target;

    if (event.key === 'ArrowRight' && !inSubmenu) {
      const item = visibleEntries.value.find(
        (entry): entry is ContextMenuItem =>
          isContextMenuItem(entry) && entry.id === current.dataset.entryId,
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
      focusElement(event.key === 'Home' ? items[0] : items.at(-1), { modality: 'keyboard' });
    }
  }

  watch(
    () => props.open,
    (value) => {
      if (typeof document === 'undefined') return;
      installFocusModality(document);
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
    const overlay = overlayOptions();
    if (overlay !== undefined) hideAnchoredOverlay(overlay);
  });

  return {
    openSubmenu,
    submenuContent,
    visibleEntries,
    submenuEntries,
    onPanelToggle,
    selectItem,
    enterSubmenu,
    onItemPointerMove,
    onMenuKeydown,
  };
}
