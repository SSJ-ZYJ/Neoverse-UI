import type { OverlayPoint } from '@neoverse-ui/overlay-runtime';
import type { ComponentPropsWithRef, ReactNode } from 'react';

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
   * Rows of a submenu. A row with children opens the submenu on click, hover or
   * ArrowRight instead of emitting `onSelect`; only top-level rows may carry children.
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
   */
  autoFocus?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (item: UiContextMenuItem) => void;
}

export const isContextMenuItem = (entry: UiContextMenuEntry): entry is UiContextMenuItem =>
  !('type' in entry);

export const contextMenuItemRole = (item: UiContextMenuItem): string => {
  if (item.selection === 'single') return 'menuitemradio';
  if (item.selection === 'multiple') return 'menuitemcheckbox';
  return 'menuitem';
};

/** Checkable state only exists for radio and checkbox rows. */
export const checkableState = (item: UiContextMenuItem): Record<string, string> =>
  item.selection === undefined ? {} : { 'aria-checked': item.checked === true ? 'true' : 'false' };
