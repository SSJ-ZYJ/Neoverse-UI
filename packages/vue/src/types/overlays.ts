import type { OverlayPlacement, OverlayPoint } from '@neoverse-ui/overlay-runtime';
import type { ButtonSize, ButtonVariant } from './controls';

export interface PopoverProps {
  open?: boolean | undefined;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: OverlayPlacement;
  matchTriggerWidth?: boolean;
  ariaLabel?: string;
  /** Button variant of the rendered trigger; ghost reuses the shared washes for chrome. */
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
}

/** Select the physical edge of the Drawer */
export type DrawerSide = 'left' | 'right';

/** Configure a controlled Drawer in modal or inline mode */
export interface DrawerProps {
  open?: boolean;
  modal?: boolean;
  side?: DrawerSide;
  closeOnOutside?: boolean;
  width?: string;
}

export type DropdownMenuItemTone = 'default' | 'danger';

export interface DropdownMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  tone?: DropdownMenuItemTone;
  checked?: boolean;
  shortcut?: string;
}

export interface DropdownMenuProps {
  items: readonly DropdownMenuItem[];
  open?: boolean | undefined;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: OverlayPlacement;
  ariaLabel: string;
  /** Button variant of the rendered trigger; ghost reuses the shared washes for chrome. */
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
}

export type ContextMenuItemTone = 'default' | 'danger';

/**
 * One selectable row. `checked` turns the row into a checkable item; rows that
 * share a `group` behave as one radio set when `selection` is `single`.
 */
export interface ContextMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  tone?: ContextMenuItemTone;
  shortcut?: string;
  checked?: boolean;
  group?: string;
  selection?: 'none' | 'single' | 'multiple';
  /**
   * Rows of a submenu. A row with children opens the submenu on click, hover or
   * ArrowRight instead of emitting `select`; only top-level rows may carry children.
   */
  children?: readonly ContextMenuItem[];
}

/** Non-selectable structure: a separator or a labelled group heading. */
export interface ContextMenuSeparator {
  type: 'separator';
  id?: string;
}

export interface ContextMenuHeading {
  type: 'heading';
  id?: string;
  label: string;
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator | ContextMenuHeading;

export interface ContextMenuProps {
  entries: readonly ContextMenuEntry[];
  /** The menu is a transient overlay; the caller owns when it is open. */
  open: boolean;
  ariaLabel: string;
  /** Viewport pointer coordinates in CSS pixels. */
  point?: OverlayPoint | undefined;
  /** Element that receives focus when the menu closes; defaults to the open-time focus owner. */
  focusReturn?: HTMLElement | undefined;
  /**
   * Focus the first row on open. A pointer open leaves it false so the editor keeps
   * focus and its selection highlight; arrow keys still reach the rows.
   */
  autoFocus?: boolean;
}
