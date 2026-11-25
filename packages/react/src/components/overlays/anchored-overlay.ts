import {
  type AnchoredOverlayOptions,
  hideAnchoredOverlay,
  isOverlayOpen,
  type OverlayPlacement,
  showAnchoredOverlay,
  stopOverlayTracking,
} from '@neoverse-ui/overlay-runtime';
import { type SyntheticEvent, useCallback, useEffect, useId, useRef, useState } from 'react';

export interface AnchoredOverlayControllerOptions {
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: OverlayPlacement;
  matchTriggerWidth?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Coordinates trigger-anchored popover visibility, positioning and toggle events. */
export function useAnchoredOverlayController({
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
