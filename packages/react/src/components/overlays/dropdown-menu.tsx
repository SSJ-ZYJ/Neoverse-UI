import {
  focusElement,
  installFocusModality,
  isOverlayOpen,
  markPointerModality,
  type OverlayPlacement,
} from '@neoverse-ui/overlay-runtime';
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { mergeClassNames } from '../../internal.js';
import type { ActionSize } from '../actions/action-size.js';
import {
  type ButtonVariant,
  buttonSizeClasses,
  buttonVariantClasses,
} from '../actions/button-variants.js';
import { useAnchoredOverlayController } from './anchored-overlay.js';

export type UiDropdownMenuItemTone = 'default' | 'danger';

export interface UiDropdownMenuItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  tone?: UiDropdownMenuItemTone;
  checked?: boolean;
  shortcut?: string;
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
  triggerSize?: ActionSize;
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
  triggerSize = 'md',
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

  useEffect(() => {
    installFocusModality(document);
  }, []);

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
        focusElement(enabledItems()[0], { preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [controller.expandedOpen, controller.panelRef, controller.triggerRef, enabledItems]);

  const selectItem = (item: UiDropdownMenuItem) => {
    if (item.disabled) return;
    onSelect?.(item);
    controller.setOpen(false);
    requestAnimationFrame(() =>
      focusElement(controller.triggerRef.current, { preventScroll: true }),
    );
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      const closeImmediately = event.shiftKey;
      queueMicrotask(() => {
        if (closeImmediately || !controller.panelRef.current?.contains(document.activeElement)) {
          controller.setOpen(false);
        }
      });
      return;
    }

    const current = event.target;
    if (!(current instanceof HTMLButtonElement)) return;
    const menuItems = enabledItems();

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const index = menuItems.indexOf(current);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      focusElement(menuItems[(index + direction + menuItems.length) % menuItems.length], {
        modality: 'keyboard',
      });
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focusElement(event.key === 'Home' ? menuItems[0] : menuItems.at(-1), {
        modality: 'keyboard',
      });
    }
  };

  return (
    <span {...props} className={mergeClassNames('ui-dropdown-menu', className)}>
      <button
        ref={controller.triggerRef}
        className={`ui-dropdown-menu__trigger ui-button material-glass-subtle ${buttonVariantClasses[triggerVariant]} ${buttonSizeClasses[triggerSize]}`}
        type="button"
        aria-haspopup="menu"
        aria-expanded={controller.expandedOpen}
        aria-controls={controller.panelId}
        disabled={disabled}
        onPointerDown={(event) => {
          event.currentTarget.dataset.neoverseFocusOrigin = 'pointer';
          markPointerModality(event.currentTarget.ownerDocument);
        }}
        onBlur={(event) => {
          delete event.currentTarget.dataset.neoverseFocusOrigin;
        }}
        onKeyDown={(event) => {
          if (!controller.expandedOpen || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) {
            return;
          }
          event.preventDefault();
          const menuItems = enabledItems();
          focusElement(event.key === 'ArrowDown' ? menuItems[0] : menuItems.at(-1), {
            modality: 'keyboard',
          });
        }}
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
        {items.map((item) => {
          const itemSemantics =
            item.checked === undefined
              ? ({ role: 'menuitem' } as const)
              : ({
                  role: 'menuitemcheckbox',
                  'aria-checked': item.checked ? 'true' : 'false',
                } as const);
          return (
            <button
              key={item.id}
              className="ui-dropdown-menu__item"
              type="button"
              tabIndex={-1}
              {...itemSemantics}
              disabled={item.disabled}
              data-tone={item.tone ?? 'default'}
              onClick={() => selectItem(item)}
            >
              {renderItem ? (
                renderItem(item)
              ) : (
                <>
                  {item.checked === undefined ? null : (
                    <span className="ui-dropdown-menu__check" aria-hidden="true">
                      {item.checked ? '✓' : ''}
                    </span>
                  )}
                  <span className="ui-dropdown-menu__label">{item.label}</span>
                  {item.shortcut ? (
                    <span className="ui-dropdown-menu__shortcut">{item.shortcut}</span>
                  ) : null}
                </>
              )}
            </button>
          );
        })}
      </div>
    </span>
  );
}
