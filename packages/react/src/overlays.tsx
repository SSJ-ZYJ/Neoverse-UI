import {
  type AnchoredOverlayOptions,
  hideAnchoredOverlay,
  isOverlayOpen,
  type OverlayPlacement,
  type OverlayPoint,
  showAnchoredOverlay,
  stopOverlayTracking,
  supportsPopover,
} from '@neoverse-ui/overlay-runtime';
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { type ButtonVariant, buttonVariantClasses, mergeClassNames } from './internal';

interface AnchoredOverlayControllerOptions {
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: OverlayPlacement;
  matchTriggerWidth?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function useAnchoredOverlayController({
  open,
  defaultOpen = false,
  disabled = false,
  placement = 'auto',
  matchTriggerWidth = false,
  onOpenChange,
}: AnchoredOverlayControllerOptions) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const ignoreDisabledNativeClose = useRef(false);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [syncRevision, setSyncRevision] = useState(0);
  const resolvedOpen = open ?? internalOpen;
  const expandedOpen = resolvedOpen && !disabled;

  const setOpen = useCallback(
    (value: boolean) => {
      if (open === undefined) setInternalOpen(value);
      else setSyncRevision((revision) => revision + 1);
      onOpenChange?.(value);
    },
    [open, onOpenChange],
  );

  const resolveOptions = useCallback((): AnchoredOverlayOptions | undefined => {
    const trigger = triggerRef.current;
    const overlay = panelRef.current;
    if (trigger === null || overlay === null) return undefined;

    return {
      trigger,
      overlay,
      gapVariable: '--neoverse-overlay-gap',
      leftVariable: '--neoverse-overlay-left',
      topVariable: '--neoverse-overlay-top',
      inlineSizeVariable: '--neoverse-overlay-inline-size',
      matchTriggerWidth,
      placement,
      fallbackOpenClass: 'ui-overlay-panel--fallback-open',
      onDismiss: () => setOpen(false),
    };
  }, [matchTriggerWidth, placement, setOpen]);

  useEffect(() => {
    // Controlled dismiss requests must resync even when the parent keeps open unchanged.
    void syncRevision;
    const options = resolveOptions();
    if (options === undefined) return;
    if (expandedOpen) showAnchoredOverlay(options);
    else {
      // Native toggle events are asynchronous; a close caused by disabling
      // must not erase the caller's retained open intent on re-enable.
      if (disabled && isOverlayOpen(options.overlay, 'ui-overlay-panel--fallback-open')) {
        ignoreDisabledNativeClose.current = true;
      }
      hideAnchoredOverlay(options);
    }
    return () => stopOverlayTracking(options.overlay);
  }, [expandedOpen, disabled, resolveOptions, syncRevision]);

  const onPanelToggle = (event: SyntheticEvent<HTMLDivElement>) => {
    const panel = event.currentTarget;
    const newState = (event.nativeEvent as Event & { newState?: 'open' | 'closed' }).newState;
    if (newState === 'open') {
      ignoreDisabledNativeClose.current = false;
      return;
    }
    if (newState === 'closed' && ignoreDisabledNativeClose.current) {
      ignoreDisabledNativeClose.current = false;
      return;
    }
    if (isOverlayOpen(panel, 'ui-overlay-panel--fallback-open')) return;
    stopOverlayTracking(panel);
    if (expandedOpen) setOpen(false);
  };

  return {
    triggerRef,
    panelRef,
    panelId,
    resolvedOpen,
    expandedOpen,
    setOpen,
    toggle: () => {
      if (!disabled) setOpen(!resolvedOpen);
    },
    onPanelToggle,
  };
}

export interface UiPopoverProps extends Omit<ComponentPropsWithRef<'span'>, 'children' | 'ref'> {
  trigger: ReactNode;
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: OverlayPlacement;
  matchTriggerWidth?: boolean;
  ariaLabel?: string;
  /** Button variant of the rendered trigger; ghost reuses the shared washes for chrome. */
  triggerVariant?: ButtonVariant;
  onOpenChange?: (open: boolean) => void;
}

export function UiPopover({
  trigger,
  children,
  open,
  defaultOpen = false,
  disabled = false,
  placement = 'auto',
  matchTriggerWidth = false,
  ariaLabel,
  triggerVariant = 'secondary',
  onOpenChange,
  className,
  ...props
}: UiPopoverProps) {
  const controller = useAnchoredOverlayController({
    ...(open === undefined ? {} : { open }),
    defaultOpen,
    disabled,
    placement,
    matchTriggerWidth,
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  });

  return (
    <span {...props} className={mergeClassNames('ui-popover', className)}>
      <button
        ref={controller.triggerRef}
        className={`ui-popover__trigger ui-button material-glass-subtle ${buttonVariantClasses[triggerVariant]} ui-button--md`}
        type="button"
        disabled={disabled}
        aria-expanded={controller.expandedOpen}
        aria-controls={controller.panelId}
        onClick={controller.toggle}
      >
        <span className="ui-button__tone-field" aria-hidden="true" />
        <span className="ui-button__edge-field" aria-hidden="true" />
        {trigger}
      </button>
      <div
        ref={controller.panelRef}
        id={controller.panelId}
        className="ui-overlay-panel ui-popover__content material-glass-elevated nv-presence"
        popover="auto"
        role="dialog"
        aria-label={ariaLabel}
        data-neoverse-motion="pop"
        data-neoverse-motion-origin="top"
        onToggle={controller.onPanelToggle}
      >
        {children}
      </div>
    </span>
  );
}

export type UiDropdownMenuItemTone = 'default' | 'danger';

export interface UiDropdownMenuItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  tone?: UiDropdownMenuItemTone;
}

export interface UiDropdownMenuProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children' | 'ref' | 'onSelect'> {
  trigger: ReactNode;
  items: readonly UiDropdownMenuItem[];
  ariaLabel: string;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: OverlayPlacement;
  /** Button variant of the rendered trigger; ghost reuses the shared washes for chrome. */
  triggerVariant?: ButtonVariant;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (item: UiDropdownMenuItem) => void;
  renderItem?: (item: UiDropdownMenuItem) => ReactNode;
}

export function UiDropdownMenu({
  trigger,
  items,
  ariaLabel,
  open,
  defaultOpen = false,
  disabled = false,
  placement = 'auto',
  triggerVariant = 'secondary',
  onOpenChange,
  onSelect,
  renderItem,
  className,
  ...props
}: UiDropdownMenuProps) {
  const controller = useAnchoredOverlayController({
    ...(open === undefined ? {} : { open }),
    defaultOpen,
    disabled,
    placement,
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  });

  const enabledItems = useCallback(
    () =>
      Array.from(
        controller.panelRef.current?.querySelectorAll<HTMLButtonElement>(
          '.ui-dropdown-menu__item:not(:disabled)',
        ) ?? [],
      ),
    [controller.panelRef],
  );

  useEffect(() => {
    if (!controller.expandedOpen) return;
    const frame = requestAnimationFrame(() => {
      const panel = controller.panelRef.current;
      if (
        panel &&
        !controller.triggerRef.current?.disabled &&
        isOverlayOpen(panel, 'ui-overlay-panel--fallback-open')
      ) {
        enabledItems()[0]?.focus();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [controller.expandedOpen, controller.panelRef, controller.triggerRef, enabledItems]);

  const selectItem = (item: UiDropdownMenuItem) => {
    if (item.disabled) return;
    onSelect?.(item);
    controller.setOpen(false);
    requestAnimationFrame(() => controller.triggerRef.current?.focus());
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = event.target;
    if (!(current instanceof HTMLButtonElement)) return;
    const menuItems = enabledItems();

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

  return (
    <span {...props} className={mergeClassNames('ui-dropdown-menu', className)}>
      <button
        ref={controller.triggerRef}
        className={`ui-dropdown-menu__trigger ui-button material-glass-subtle ${buttonVariantClasses[triggerVariant]} ui-button--md`}
        type="button"
        aria-haspopup="menu"
        aria-expanded={controller.expandedOpen}
        aria-controls={controller.panelId}
        disabled={disabled}
        onClick={controller.toggle}
      >
        <span className="ui-button__tone-field" aria-hidden="true" />
        <span className="ui-button__edge-field" aria-hidden="true" />
        {trigger}
      </button>
      <div
        ref={controller.panelRef}
        id={controller.panelId}
        className="ui-overlay-panel ui-dropdown-menu__panel material-glass-elevated nv-presence"
        popover="auto"
        role="menu"
        aria-label={ariaLabel}
        data-neoverse-motion="pop"
        data-neoverse-motion-origin="top"
        onToggle={controller.onPanelToggle}
        onKeyDown={onMenuKeyDown}
      >
        {items.map((item) => (
          <button
            key={item.id}
            className="ui-dropdown-menu__item"
            type="button"
            role="menuitem"
            disabled={item.disabled}
            data-tone={item.tone ?? 'default'}
            onClick={() => selectItem(item)}
          >
            {renderItem?.(item) ?? item.label}
          </button>
        ))}
      </div>
    </span>
  );
}

export type UiContextMenuItemTone = 'default' | 'danger';

/**
 * One selectable row. `checked` turns the row into a checkable item; rows that
 * share a `group` behave as one radio set when `selection` is `single`.
 */
export interface UiContextMenuItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  tone?: UiContextMenuItemTone;
  shortcut?: string;
  checked?: boolean;
  group?: string;
  selection?: 'none' | 'single' | 'multiple';
  /**
   * Rows of a submenu. A row with children opens the submenu on click or ArrowRight
   * instead of emitting `onSelect`; only top-level rows may carry children.
   * 二级菜单的行。带 children 的行通过点击、悬停或右方向键展开二级菜单，而不是触发 onSelect；
   * 只有顶层行可以携带 children。
   */
  children?: readonly UiContextMenuItem[];
}

export interface UiContextMenuSeparator {
  type: 'separator';
  id?: string;
}

export interface UiContextMenuHeading {
  type: 'heading';
  id?: string;
  label: ReactNode;
}

export type UiContextMenuEntry = UiContextMenuItem | UiContextMenuSeparator | UiContextMenuHeading;

export interface UiContextMenuProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'onSelect'> {
  entries: readonly UiContextMenuEntry[];
  /** The menu is a transient overlay; the caller owns when it is open. */
  open: boolean;
  ariaLabel: string;
  /** Viewport pointer coordinates in CSS pixels. */
  point?: OverlayPoint | undefined;
  /** Element that receives focus when the menu closes; defaults to the open-time focus owner. */
  focusReturn?: HTMLElement | null | undefined;
  /**
   * Focus the first row on open. A pointer open leaves it false so the editor keeps
   * focus and its selection highlight; arrow keys still reach the rows.
   * 打开时聚焦首行。指针打开时保持为 false，使编辑器保留焦点与选区高亮；方向键仍可进入菜单行。
   */
  autoFocus?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (item: UiContextMenuItem) => void;
}

const isContextMenuItem = (entry: UiContextMenuEntry): entry is UiContextMenuItem =>
  !('type' in entry);

const contextMenuItemRole = (item: UiContextMenuItem): string => {
  if (item.selection === 'single') return 'menuitemradio';
  if (item.selection === 'multiple') return 'menuitemcheckbox';
  return 'menuitem';
};

/** Checkable state only exists for radio and checkbox rows. */
const checkableState = (item: UiContextMenuItem): Record<string, string> =>
  item.selection === undefined ? {} : { 'aria-checked': item.checked === true ? 'true' : 'false' };

export function UiContextMenu({
  entries,
  open,
  ariaLabel,
  point,
  focusReturn,
  autoFocus = true,
  onOpenChange,
  onSelect,
  className,
  ...props
}: UiContextMenuProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const submenuRef = useRef<HTMLDivElement | null>(null);
  const restoreTarget = useRef<HTMLElement | null>(null);
  const ignoreNativeClose = useRef(false);
  const panelId = useId();
  const submenuId = useId();
  // A submenu replaces the top-level rows inside the same panel: a second popover would
  // light-dismiss the parent, so both levels share one surface.
  // 二级菜单在同一面板内替换顶层行：第二个浮层会轻触关闭父面板，因此两级共用同一表面。
  const [openSubmenu, setOpenSubmenu] = useState<UiContextMenuItem | null>(null);

  const resolveOptions = useCallback((): AnchoredOverlayOptions | undefined => {
    const overlay = panelRef.current;
    if (overlay === null) return undefined;

    return {
      ...(point === undefined ? {} : { point }),
      ...(focusReturn === undefined || focusReturn === null ? {} : { focusReturn }),
      overlay,
      gapVariable: '--neoverse-overlay-gap',
      leftVariable: '--neoverse-overlay-left',
      topVariable: '--neoverse-overlay-top',
      placement: 'auto',
      fallbackOpenClass: 'ui-overlay-panel--fallback-open',
      // The panel owns a nested submenu popover, which must not count as an outside click.
      // 面板拥有一个嵌套的二级浮层，它不能被算作外部点击。
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

  const enterSubmenu = useCallback(
    (item: UiContextMenuItem, opener: HTMLElement) => {
      if (item.disabled || !item.children?.length) return;
      setOpenSubmenu(item);
      // The column is its own manual popover flush with the panel edge, the way a native
      // submenu is: it keeps the parent rows visible and carries its own glass material.
      // 该列是贴着面板边缘的独立 manual 浮层，与原生二级菜单一致：父级行保持可见，它自带玻璃材质。
      requestAnimationFrame(() => {
        const panel = panelRef.current;
        const submenu = submenuRef.current;
        if (!panel || !submenu) return;
        const panelRect = panel.getBoundingClientRect();
        const openerRect = opener.getBoundingClientRect();
        const margin = 8;
        const width = submenu.offsetWidth;
        const height = submenu.offsetHeight;
        const toStart = panelRect.right + width > window.innerWidth - margin;
        // The column's own padding sits above its first row, so it is lifted by that amount
        // to put the first row on the parent item.
        // 该列自身的内边距位于首行之上，因此上移同样的距离，使首行与父项对齐。
        const paddingTop = Number.parseFloat(getComputedStyle(submenu).paddingTop) || 0;
        submenu.style.setProperty(
          '--neoverse-overlay-left',
          `${toStart ? panelRect.left - width : panelRect.right}px`,
        );
        submenu.style.setProperty(
          '--neoverse-overlay-top',
          `${Math.min(
            Math.max(margin, openerRect.top - paddingTop),
            Math.max(margin, window.innerHeight - height - margin),
          )}px`,
        );
        if (supportsPopover(submenu)) {
          if (!submenu.matches(':popover-open')) submenu.showPopover();
        } else {
          submenu.classList.add('ui-context-menu__submenu--open');
        }
        rowsOf(submenu)[0]?.focus();
      });
    },
    [rowsOf],
  );

  const closeSubmenuPopover = useCallback(() => {
    const submenu = submenuRef.current;
    if (!submenu) return;
    if (supportsPopover(submenu)) {
      if (submenu.matches(':popover-open')) submenu.hidePopover();
    } else {
      submenu.classList.remove('ui-context-menu__submenu--open');
    }
  }, []);

  const leaveSubmenu = useCallback(() => {
    closeSubmenuPopover();
    setOpenSubmenu(null);
    requestAnimationFrame(() => enabledItems()[0]?.focus());
  }, [closeSubmenuPopover, enabledItems]);

  useEffect(() => {
    const options = resolveOptions();
    if (options === undefined) return;
    if (open) {
      restoreTarget.current = focusReturn ?? (document.activeElement as HTMLElement | null);
      showAnchoredOverlay(options);
      // The panel grows from the edge it rests against, so a menu that flips
      // above its pointer does not slide in from the wrong side.
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
    // The submenu is its own popover, so it must be dismissed with the panel.
    // 二级菜单是独立浮层，必须随面板一起关闭。
    closeSubmenuPopover();
    setOpenSubmenu(null);
    hideAnchoredOverlay(options);
    return () => stopOverlayTracking(options.overlay);
  }, [autoFocus, closeSubmenuPopover, enabledItems, focusReturn, open, resolveOptions]);

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

  // With focus left in the region (a pointer open), panel-scoped keydown never fires.
  // The document listener lets an arrow key enter the panel from wherever focus sits.
  // 指针打开时焦点留在区域，面板内的 keydown 不会触发。文档级监听使方向键能从当前焦点进入面板。
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
    // With focus still in the region, an arrow key enters the menu at its first or last row.
    // 焦点仍在区域时，方向键从首行或末行进入菜单。
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

  return (
    <div
      {...props}
      ref={panelRef}
      id={panelId}
      className={mergeClassNames(
        'ui-overlay-panel ui-context-menu material-glass-immersive nv-presence',
        className,
      )}
      popover="manual"
      role="menu"
      aria-label={ariaLabel}
      data-neoverse-motion="pop"
      data-neoverse-motion-origin="top"
      onToggle={onPanelToggle}
      onKeyDown={onMenuKeyDown}
    >
      <div className="ui-context-menu__level" role="none">
        {entries.map((entry, index) => {
          const key = 'id' in entry && entry.id ? entry.id : index;
          if ('type' in entry && entry.type === 'separator') {
            return <hr key={key} className="ui-context-menu__separator" />;
          }
          if ('type' in entry && entry.type === 'heading') {
            return (
              <p key={key} className="ui-context-menu__heading">
                {entry.label}
              </p>
            );
          }
          if (!isContextMenuItem(entry)) return null;
          return (
            <button
              key={key}
              className="ui-context-menu__item"
              type="button"
              role={contextMenuItemRole(entry)}
              disabled={entry.disabled}
              data-tone={entry.tone ?? 'default'}
              data-entry-id={entry.id}
              data-open={openSubmenu?.id === entry.id ? 'true' : undefined}
              aria-haspopup={entry.children?.length ? 'menu' : undefined}
              aria-expanded={
                entry.children?.length
                  ? openSubmenu?.id === entry.id
                    ? 'true'
                    : 'false'
                  : undefined
              }
              aria-controls={entry.children?.length ? submenuId : undefined}
              {...checkableState(entry)}
              onClick={(event) =>
                entry.children?.length
                  ? enterSubmenu(entry, event.currentTarget)
                  : selectItem(entry)
              }
            >
              {entry.selection === undefined ? null : (
                <span className="ui-context-menu__check" aria-hidden="true">
                  {entry.checked ? '✓' : ''}
                </span>
              )}
              <span className="ui-context-menu__label">{entry.label}</span>
              {entry.shortcut ? (
                <span className="ui-context-menu__shortcut">{entry.shortcut}</span>
              ) : entry.children?.length ? (
                <span className="ui-context-menu__chevron" aria-hidden="true">
                  ›
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {openSubmenu === null
        ? null
        : createPortal(
            <div
              id={submenuId}
              ref={submenuRef}
              className="ui-context-menu__submenu nv-presence"
              popover="manual"
              role="menu"
              aria-label={typeof openSubmenu.label === 'string' ? openSubmenu.label : undefined}
              data-neoverse-motion="slide-end"
              data-neoverse-motion-origin="start"
            >
              {(openSubmenu.children ?? []).map((child) => (
                <button
                  key={child.id}
                  className="ui-context-menu__item"
                  type="button"
                  role={contextMenuItemRole(child)}
                  disabled={child.disabled}
                  data-entry-id={child.id}
                  {...checkableState(child)}
                  onClick={() => selectItem(child)}
                >
                  {child.selection === undefined ? null : (
                    <span className="ui-context-menu__check" aria-hidden="true">
                      {child.checked ? '✓' : ''}
                    </span>
                  )}
                  <span className="ui-context-menu__label">{child.label}</span>
                </button>
              ))}
            </div>,
            document.body,
          )}
    </div>
  );
}
