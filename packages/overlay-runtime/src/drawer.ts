import {
  focusElement,
  installFocusModality,
  trapModalTabKey,
} from './anchored-overlay/focus-modality.js';
import { ownsDocumentModalKeyboard } from './document-modal.js';

interface DrawerState {
  open: boolean;
  backdrop: HTMLDivElement | null;
  closeOnOutside: boolean;
  onOpenChange: ((open: boolean) => void) | undefined;
}

/** Synchronize controlled Drawer state or release its DOM listeners and focus */
export interface DrawerController {
  sync(state: DrawerState): void;
  dispose(): void;
}

/** Manage an inline Drawer or a modal Drawer in the shared document layer */
export function createDrawerController(dialog: HTMLDialogElement): DrawerController {
  const document = dialog.ownerDocument;
  const view = document.defaultView;
  installFocusModality(document);
  let backdrop: HTMLDivElement | null = null;
  let focusReturn: HTMLElement | null = null;
  let state: DrawerState | undefined;
  let openedAsModal = false;
  let closing = false;
  let restoreFrame: number | undefined;
  let outsidePointerId: number | undefined;
  let releasedOutside = false;

  function resetGesture() {
    outsidePointerId = undefined;
    releasedOutside = false;
  }

  function restoreFocus() {
    const target = focusReturn;
    focusReturn = null;
    focusElement(target);
  }

  function closeDialog() {
    const wasModal = openedAsModal;
    openedAsModal = false;
    resetGesture();
    if (wasModal) {
      if (dialog.open) {
        closing = true;
        dialog.close();
        closing = false;
      }
      restoreFocus();
    } else {
      dialog.open = false;
    }
  }

  function reconcile() {
    if (dialog.open && (!state?.open || Boolean(state.backdrop) !== openedAsModal)) closeDialog();
    if (!state?.open || dialog.open) return;
    if (state.backdrop) {
      if (!dialog.isConnected) return;
      focusReturn = document.activeElement as HTMLElement | null;
      openedAsModal = true;
      dialog.show();
      if (dialog.open && !dialog.contains(document.activeElement)) {
        focusElement(dialog.querySelector<HTMLElement>('[autofocus]') ?? dialog);
      }
    } else {
      dialog.open = true;
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (
      event.defaultPrevented ||
      (event.key !== 'Escape' && event.key !== 'Tab') ||
      !state?.open ||
      !ownsDocumentModalKeyboard(dialog)
    ) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      state.onOpenChange?.(false);
    } else {
      trapModalTabKey(event, dialog);
    }
  }

  function onCancel(event: Event) {
    event.preventDefault();
    if (state?.open && state.backdrop && ownsDocumentModalKeyboard(dialog)) {
      state.onOpenChange?.(false);
    }
  }

  function onClose() {
    if (closing || dialog.open || !state?.open || restoreFrame !== undefined) return;
    openedAsModal = false;
    resetGesture();
    restoreFocus();
    if (state?.open && state.backdrop) state.onOpenChange?.(false);
    // Native closure (for example from a dialog form) has already happened. Give the
    // owner time to accept it before reopening a still-controlled Drawer.
    if (state?.open && !dialog.open && view) {
      restoreFrame = view.requestAnimationFrame(() => {
        restoreFrame = undefined;
        reconcile();
      });
    }
  }

  function onPointerDown(event: PointerEvent) {
    if (!event.isPrimary) return;
    resetGesture();
    if (
      dialog.open &&
      state?.open &&
      state.backdrop &&
      state.closeOnOutside &&
      event.button === 0 &&
      event.target === backdrop
    ) {
      outsidePointerId = event.pointerId;
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (outsidePointerId === undefined || event.pointerId !== outsidePointerId) return;
    // Touch can capture the pointer on the backdrop even when it releases over the panel.
    releasedOutside =
      event.button === 0 &&
      event.target === backdrop &&
      (!backdrop?.hasPointerCapture(event.pointerId) ||
        document.elementFromPoint(event.clientX, event.clientY) === backdrop);
  }

  function onPointerCancel(event: PointerEvent) {
    if (event.pointerId === outsidePointerId) resetGesture();
  }

  function onClick(event: MouseEvent) {
    const validGesture =
      releasedOutside && (!('pointerId' in event) || event.pointerId === outsidePointerId);
    resetGesture();
    if (
      validGesture &&
      dialog.open &&
      state?.open &&
      state.backdrop &&
      state.closeOnOutside &&
      !event.defaultPrevented &&
      event.button === 0 &&
      event.detail > 0 &&
      event.target === backdrop
    ) {
      state.onOpenChange?.(false);
    }
  }

  function setBackdrop(nextBackdrop: HTMLDivElement | null) {
    if (backdrop === nextBackdrop) return;
    resetGesture();
    if (backdrop) {
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('pointerdown', onPointerDown, true);
      backdrop.removeEventListener('pointerup', onPointerUp);
      backdrop.removeEventListener('pointercancel', onPointerCancel);
      backdrop.removeEventListener('click', onClick);
    }
    backdrop = nextBackdrop;
    if (backdrop) {
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('pointerdown', onPointerDown, true);
      backdrop.addEventListener('pointerup', onPointerUp);
      backdrop.addEventListener('pointercancel', onPointerCancel);
      backdrop.addEventListener('click', onClick);
    }
  }

  dialog.addEventListener('cancel', onCancel);
  dialog.addEventListener('close', onClose);

  return {
    sync(nextState: DrawerState) {
      state = nextState;
      setBackdrop(state.open ? state.backdrop : null);
      if (!state.closeOnOutside) resetGesture();
      reconcile();
    },
    dispose() {
      state = undefined;
      if (restoreFrame !== undefined) view?.cancelAnimationFrame(restoreFrame);
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('close', onClose);
      setBackdrop(null);
      closeDialog();
    },
  };
}
