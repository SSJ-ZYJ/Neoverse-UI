import {
  type AnchoredOverlayOptions,
  hideAnchoredOverlay,
  isOverlayOpen,
  type OverlayPlacement,
  showAnchoredOverlay,
  stopOverlayTracking,
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
import { mergeClassNames } from './internal';

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
        className="ui-popover__trigger ui-button ui-button--secondary ui-button--md"
        type="button"
        disabled={disabled}
        aria-expanded={controller.expandedOpen}
        aria-controls={controller.panelId}
        onClick={controller.toggle}
      >
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
        className="ui-dropdown-menu__trigger ui-button ui-button--secondary ui-button--md"
        type="button"
        aria-haspopup="menu"
        aria-expanded={controller.expandedOpen}
        aria-controls={controller.panelId}
        disabled={disabled}
        onClick={controller.toggle}
      >
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
