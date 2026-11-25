import type { OverlayPlacement } from '@neoverse-ui/overlay-runtime';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { mergeClassNames } from '../../internal.js';
import { type ButtonVariant, buttonVariantClasses } from '../actions/button-variants.js';
import { useAnchoredOverlayController } from './anchored-overlay.js';

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
