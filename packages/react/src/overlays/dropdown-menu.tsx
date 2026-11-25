import { isOverlayOpen, type OverlayPlacement } from '@neoverse-ui/overlay-runtime';
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { type ButtonVariant, buttonVariantClasses, mergeClassNames } from '../internal.js';
import { useAnchoredOverlayController } from './anchored-overlay.js';

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
