import { replayPresence } from '@neoverse-ui/motion';
import {
  type AnchoredOverlayOptions,
  hideAnchoredOverlay,
  isOverlayOpen,
  type OverlayPoint,
  resolveOverlayViewportLayoutBounds,
  showAnchoredOverlay,
  stopOverlayTracking,
  supportsPopover,
} from '@neoverse-ui/overlay-runtime';
import {
  type KeyboardEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  isContextMenuItem,
  type UiContextMenuEntry,
  type UiContextMenuItem,
} from './context-menu-types.js';

// The column overlaps the panel rim by one Glass edge width. Covering the rim is
// not enough on its own: the shared Glass edge canvas paints above the top layer,
// and only an occluder inside the panel's 2px hit-test sample suppresses that rim.
const SUBMENU_EDGE_OVERLAP = 4;

interface UseContextMenuOptions {
  entries: readonly UiContextMenuEntry[];
  open: boolean;
  point: OverlayPoint | undefined;
  focusReturn: HTMLElement | null | undefined;
  autoFocus: boolean;
  onOpenChange: ((open: boolean) => void) | undefined;
  onSelect: ((item: UiContextMenuItem) => void) | undefined;
}

/** Coordinates React ContextMenu top-layer visibility, submenu column positioning and keyboard navigation. */
export function useContextMenu({
  entries,
  open,
  point,
  focusReturn,
  autoFocus,
  onOpenChange,
  onSelect,
}: UseContextMenuOptions) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const submenuRef = useRef<HTMLDivElement | null>(null);
  // Render fallback panels outside clipped or transformed consumer surfaces.
  // Resolve the host after mount so server rendering and hydration agree.
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  useEffect(() => setPortalHost(document.body), []);
  const restoreTarget = useRef<HTMLElement | null>(null);
  const ignoreNativeClose = useRef(false);
  const panelId = useId();
  const submenuId = useId();
  const [openSubmenu, setOpenSubmenu] = useState<UiContextMenuItem | null>(null);
  // Synchronous counterpart of the state: pointerenter and click arrive in one
  // interaction, before React commits the next render.
  const submenuEntryId = useRef<string | null>(null);
  const pendingSubmenu = useRef<{ opener: HTMLElement; moveFocus: boolean } | null>(null);

  const resolveOptions = useCallback((): AnchoredOverlayOptions | undefined => {
    const overlay = panelRef.current;
    if (overlay === null) return undefined;

    return {
      ...(point === undefined ? {} : { point }),
      ...(focusReturn === undefined || focusReturn === null ? {} : { focusReturn }),
      previousFocus: () => restoreTarget.current,
      overlay,
      gapVariable: '--neoverse-overlay-gap',
      leftVariable: '--neoverse-overlay-left',
      topVariable: '--neoverse-overlay-top',
      placement: 'auto',
      fallbackOpenClass: 'ui-overlay-panel--fallback-open',
      manual: true,
      containedElements: () => [submenuRef.current],
      onDismiss: () => onOpenChange?.(false),
    };
  }, [focusReturn, onOpenChange, point]);

  const rowsOf = useCallback(
    (root: HTMLElement | null) =>
      Array.from(
        root?.querySelectorAll<HTMLButtonElement>('.ui-context-menu__item:not(:disabled)') ?? [],
      ),
    [],
  );

  const enabledItems = useCallback(() => rowsOf(panelRef.current), [rowsOf]);

  const closeSubmenuPopover = useCallback(() => {
    const submenu = submenuRef.current;
    if (!submenu) return;
    if (supportsPopover(submenu)) {
      if (submenu.matches(':popover-open')) submenu.hidePopover();
    } else {
      submenu.classList.remove('ui-context-menu__submenu--open');
    }
  }, []);

  const enterSubmenu = useCallback(
    (item: UiContextMenuItem, opener: HTMLElement, moveFocus = true) => {
      if (item.disabled || !item.children?.length) return;
      if (submenuEntryId.current === item.id) {
        if (moveFocus) rowsOf(submenuRef.current)[0]?.focus();
        return;
      }
      submenuEntryId.current = item.id;
      pendingSubmenu.current = { opener, moveFocus };
      setOpenSubmenu(item);
    },
    [rowsOf],
  );

  useEffect(() => {
    if (openSubmenu === null) return;
    const pending = pendingSubmenu.current;
    const panel = panelRef.current;
    const submenu = submenuRef.current;
    if (pending === null || panel === null || submenu === null) return;
    pendingSubmenu.current = null;

    if (supportsPopover(submenu)) {
      if (!submenu.matches(':popover-open')) submenu.showPopover();
    } else {
      submenu.classList.add('ui-context-menu__submenu--open');
    }

    const placeSubmenu = () => {
      if (!panel.isConnected || !submenu.isConnected || !pending.opener.isConnected) return;
      const { left: panelLeft, right: panelRight } = resolveOverlayViewportLayoutBounds(panel);
      const openerRect = pending.opener.getBoundingClientRect();
      const margin = 8;
      const width = submenu.offsetWidth;
      const height = submenu.offsetHeight;
      const toStart = panelRight + width > window.innerWidth - margin;
      const paddingTop = Number.parseFloat(getComputedStyle(submenu).paddingTop) || 0;
      submenu.style.setProperty(
        '--neoverse-overlay-left',
        `${toStart ? panelLeft - width + SUBMENU_EDGE_OVERLAP : panelRight - SUBMENU_EDGE_OVERLAP}px`,
      );
      submenu.style.setProperty(
        '--neoverse-overlay-top',
        `${Math.min(
          Math.max(margin, openerRect.top - paddingTop),
          Math.max(margin, window.innerHeight - height - margin),
        )}px`,
      );
    };
    placeSubmenu();
    replayPresence(submenu);
    if (pending.moveFocus) rowsOf(submenu)[0]?.focus();
    const positionObserver = new MutationObserver(placeSubmenu);
    positionObserver.observe(panel, { attributes: true, attributeFilter: ['style'] });
    const resizeObserver = new ResizeObserver(placeSubmenu);
    resizeObserver.observe(panel);
    window.addEventListener('scroll', placeSubmenu, true);
    window.addEventListener('resize', placeSubmenu);
    return () => {
      positionObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('scroll', placeSubmenu, true);
      window.removeEventListener('resize', placeSubmenu);
    };
  }, [openSubmenu, rowsOf]);

  const onItemPointerEnter = (item: UiContextMenuItem, target: HTMLButtonElement) => {
    if (item.disabled) return;
    if (item.children?.length) {
      if (submenuEntryId.current === item.id) return;
      enterSubmenu(item, target, false);
      return;
    }
    closeSubmenuPopover();
    submenuEntryId.current = null;
    setOpenSubmenu(null);
  };

  const leaveSubmenu = useCallback(() => {
    closeSubmenuPopover();
    submenuEntryId.current = null;
    setOpenSubmenu(null);
    requestAnimationFrame(() => enabledItems()[0]?.focus());
  }, [closeSubmenuPopover, enabledItems]);

  useEffect(() => {
    const options = portalHost === null ? undefined : resolveOptions();
    if (options === undefined) return;
    if (open) {
      restoreTarget.current = focusReturn ?? (document.activeElement as HTMLElement | null);
      showAnchoredOverlay(options);
      const side = options.overlay.dataset.neoverseOverlaySide;
      options.overlay.setAttribute(
        'data-neoverse-motion-origin',
        side === 'top' ? 'bottom' : 'top',
      );
      if (!autoFocus) return;
      const frame = requestAnimationFrame(() => {
        if (isOverlayOpen(options.overlay, 'ui-overlay-panel--fallback-open')) {
          enabledItems()[0]?.focus();
        }
      });
      return () => cancelAnimationFrame(frame);
    }
    if (isOverlayOpen(options.overlay, 'ui-overlay-panel--fallback-open')) {
      ignoreNativeClose.current = true;
    }
    closeSubmenuPopover();
    submenuEntryId.current = null;
    setOpenSubmenu(null);
    hideAnchoredOverlay(options);
    return () => stopOverlayTracking(options.overlay);
  }, [autoFocus, closeSubmenuPopover, enabledItems, focusReturn, open, portalHost, resolveOptions]);

  const onPanelToggle = (event: SyntheticEvent<HTMLDivElement>) => {
    const panel = event.currentTarget;
    const newState = (event.nativeEvent as Event & { newState?: 'open' | 'closed' }).newState;
    if (newState === 'open') {
      ignoreNativeClose.current = false;
      return;
    }
    if (newState === 'closed' && ignoreNativeClose.current) {
      ignoreNativeClose.current = false;
      return;
    }
    if (isOverlayOpen(panel, 'ui-overlay-panel--fallback-open')) return;
    stopOverlayTracking(panel);
    if (open) onOpenChange?.(false);
  };

  const selectItem = (item: UiContextMenuItem) => {
    if (item.disabled) return;
    onSelect?.(item);
    onOpenChange?.(false);
    const target = focusReturn ?? restoreTarget.current;
    requestAnimationFrame(() => {
      if (target?.isConnected) target.focus();
      restoreTarget.current = null;
    });
  };

  useEffect(() => {
    if (!open) return;
    const onDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const panel = panelRef.current;
      if (panel === null) return;
      const target = event.target;
      if (target instanceof Node && panel.contains(target)) return;
      const rows = openSubmenu === null ? enabledItems() : rowsOf(submenuRef.current);
      if (rows.length === 0) return;
      event.preventDefault();
      (event.key === 'ArrowDown' ? rows[0] : rows.at(-1))?.focus();
    };
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => document.removeEventListener('keydown', onDocumentKeyDown);
  }, [enabledItems, open, openSubmenu, rowsOf]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const inSubmenu = openSubmenu !== null;
    const menuItems = inSubmenu ? rowsOf(submenuRef.current) : enabledItems();
    if (!(event.target instanceof HTMLButtonElement)) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      if (menuItems.length === 0) return;
      event.preventDefault();
      (event.key === 'ArrowDown' ? menuItems[0] : menuItems.at(-1))?.focus();
      return;
    }
    const current = event.target;

    if (event.key === 'ArrowRight' && !inSubmenu) {
      const item = entries.find(
        (entry): entry is UiContextMenuItem =>
          isContextMenuItem(entry) && entry.id === current.dataset.entryId,
      );
      if (item?.children?.length) {
        event.preventDefault();
        enterSubmenu(item, current);
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
      const index = menuItems.indexOf(current);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      menuItems[(index + direction + menuItems.length) % menuItems.length]?.focus();
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      (event.key === 'Home' ? menuItems[0] : menuItems.at(-1))?.focus();
    }
  };

  return {
    panelRef,
    submenuRef,
    portalHost,
    panelId,
    submenuId,
    openSubmenu,
    enterSubmenu,
    onItemPointerEnter,
    onPanelToggle,
    selectItem,
    onMenuKeyDown,
  };
}
