import {
  type ComponentPropsWithRef,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { mergeClassNames } from './internal.js';

export interface UiDialogProps
  extends Omit<ComponentPropsWithRef<'dialog'>, 'title' | 'open' | 'onCancel' | 'onClose'> {
  open: boolean;
  title: string;
  description?: string;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
}

export function UiDialog({
  open,
  title,
  description,
  closeOnEscape = true,
  closeOnBackdrop = false,
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

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    const dialog = element.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      focusReturn.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, mounted]);

  useEffect(
    () => () => {
      if (element.current?.open) element.current.close();
      const target = focusReturn.current;
      focusReturn.current = null;
      if (target?.isConnected) target.focus({ preventScroll: true });
    },
    [],
  );

  if (!mounted) return null;
  return createPortal(
    <dialog
      {...rest}
      ref={element}
      className={mergeClassNames('ui-dialog material-glass-elevated', className)}
      data-neoverse-motion="pop"
      data-surface="glass-elevated"
      data-neoverse-glass-occluder="topmost"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (closeOnEscape) onOpenChange(false);
      }}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onOpenChange(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !closeOnEscape) event.preventDefault();
      }}
      onClose={() => {
        if (open) onOpenChange(false);
        const target = focusReturn.current;
        focusReturn.current = null;
        if (target?.isConnected) target.focus({ preventScroll: true });
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
    </dialog>,
    document.body,
  );
}
