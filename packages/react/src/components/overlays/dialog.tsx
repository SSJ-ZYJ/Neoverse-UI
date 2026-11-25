import {
  focusElement,
  installFocusModality,
  openOverlayWithMotion,
  ownsDocumentModalKeyboard,
  trapModalTabKey,
} from '@neoverse-ui/overlay-runtime';
import {
  type ComponentPropsWithRef,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { mergeClassNames } from '../../internal.js';

export type DialogSize = 'sm' | 'md' | 'lg';
export type DialogRole = 'dialog' | 'alertdialog';

export interface UiDialogProps
  extends Omit<
    ComponentPropsWithRef<'dialog'>,
    'title' | 'open' | 'role' | 'onCancel' | 'onClose'
  > {
  open: boolean;
  title: string;
  description?: string;
  size?: DialogSize;
  role?: DialogRole;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  /** Visual source at open time; omitted uses the focused element, null disables the morph. */
  motionSource?: HTMLElement | null;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
}

function showDialogNode(dialog: HTMLDialogElement) {
  if (typeof dialog.show === 'function') dialog.show();
  else dialog.setAttribute('open', '');
}

function closeDialogNode(dialog: HTMLDialogElement) {
  if (typeof dialog.close === 'function') dialog.close();
  else if (dialog.hasAttribute('open')) {
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
  }
}

export function UiDialog({
  open,
  title,
  description,
  size = 'md',
  role = 'dialog',
  closeOnEscape = true,
  closeOnBackdrop = false,
  motionSource,
  footer,
  onOpenChange,
  children,
  className,
  ...rest
}: UiDialogProps) {
  const [mounted, setMounted] = useState(false);
  const element = useRef<HTMLDialogElement | null>(null);
  const focusReturn = useRef<HTMLElement | null>(null);
  const id = useId();

  useEffect(() => {
    setMounted(true);
    installFocusModality(document);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const dialog = element.current;
    if (!dialog) return;
    installFocusModality(dialog.ownerDocument);
    if (open && !dialog.open) {
      focusReturn.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      openOverlayWithMotion(
        dialog,
        motionSource === undefined ? focusReturn.current : motionSource,
        () => showDialogNode(dialog),
      );
      focusElement(dialog, { preventScroll: true });
    } else if (!open && dialog.open) {
      closeDialogNode(dialog);
    }
  }, [open, mounted, motionSource]);

  useEffect(() => {
    if (!mounted || !open) return;
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      const dialog = element.current;
      if (!dialog?.open || event.defaultPrevented) return;
      if (!ownsDocumentModalKeyboard(dialog)) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        if (closeOnEscape) onOpenChange(false);
        return;
      }

      if (event.key === 'Tab') {
        trapModalTabKey(event, dialog);
      }
    };
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => document.removeEventListener('keydown', onDocumentKeyDown);
  }, [closeOnEscape, mounted, onOpenChange, open]);

  useEffect(
    () => () => {
      if (element.current?.open) closeDialogNode(element.current);
      const target = focusReturn.current;
      focusReturn.current = null;
      if (target?.isConnected) focusElement(target, { preventScroll: true });
    },
    [],
  );

  if (!mounted) return null;
  return createPortal(
    <>
      <div
        className="ui-dialog__backdrop"
        data-open={open ? 'true' : undefined}
        aria-hidden="true"
        onClick={() => {
          if (closeOnBackdrop) onOpenChange(false);
        }}
      />
      <dialog
        {...rest}
        ref={element}
        tabIndex={-1}
        role={role}
        data-size={size}
        className={mergeClassNames(
          'ui-overlay-panel ui-dialog material-glass-elevated nv-presence',
          className,
        )}
        data-neoverse-motion="pop"
        data-surface="glass-elevated"
        data-neoverse-glass-occluder="topmost"
        data-neoverse-glass-edge-pass="css"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        onCancel={(event) => {
          event.preventDefault();
          if (closeOnEscape) onOpenChange(false);
        }}
        onClose={(event) => {
          if (event.currentTarget.open) return;
          if (open) onOpenChange(false);
          const target = focusReturn.current;
          focusReturn.current = null;
          if (target?.isConnected) focusElement(target, { preventScroll: true });
        }}
      >
        <header className="ui-dialog__header">
          <h2 className="ui-dialog__title" id={`${id}-title`}>
            {title}
          </h2>
          {description && (
            <p className="ui-dialog__description" id={`${id}-description`}>
              {description}
            </p>
          )}
        </header>
        <div className="ui-dialog__body">{children}</div>
        {footer && <footer className="ui-dialog__footer">{footer}</footer>}
      </dialog>
    </>,
    document.body,
  );
}
