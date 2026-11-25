import { createDrawerController, type DrawerController } from '@neoverse-ui/overlay-runtime';
import {
  type ComponentPropsWithRef,
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { mergeClassNames } from '../../internal.js';

/** Select the physical edge of the Drawer */
export type DrawerSide = 'left' | 'right';

/** Configure a controlled Drawer in modal or inline mode */
export interface UiDrawerProps extends Omit<ComponentPropsWithRef<'dialog'>, 'open'> {
  open?: boolean;
  modal?: boolean;
  side?: DrawerSide;
  closeOnOutside?: boolean;
  width?: string;
  onOpenChange?: (open: boolean) => void;
}

/** Render an inline panel or a document-layer modal at the selected edge */
export function UiDrawer({
  open = false,
  modal = true,
  side = 'left',
  closeOnOutside = true,
  width,
  onOpenChange,
  children,
  className,
  ref,
  tabIndex,
  ...rest
}: UiDrawerProps) {
  const element = useRef<HTMLDialogElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const controller = useRef<DrawerController>(null);
  const [mounted, setMounted] = useState(false);
  const ready = !modal || mounted;
  const setElement = useCallback(
    (node: HTMLDialogElement | null) => {
      element.current = node;
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!ready || !element.current || (modal && !backdrop.current)) return;
    const drawer = createDrawerController(element.current);
    controller.current = drawer;
    return () => {
      controller.current = null;
      drawer.dispose();
    };
  }, [modal, ready]);

  useLayoutEffect(() => {
    if (!ready) return;
    controller.current?.sync({
      open,
      backdrop: modal ? backdrop.current : null,
      closeOnOutside,
      onOpenChange,
    });
  }, [open, modal, ready, closeOnOutside, onOpenChange]);

  if (!ready) return null;

  const panel = (
    <dialog
      {...rest}
      ref={setElement}
      tabIndex={tabIndex ?? (modal ? -1 : undefined)}
      className={mergeClassNames('ui-drawer material-glass-subtle', className)}
      aria-modal={modal || undefined}
      closedby="none"
      data-side={side}
      data-modal={modal ? 'true' : 'false'}
      data-surface="glass-subtle"
      data-neoverse-glass-edge-stroke=""
      data-neoverse-surface-hover="static"
      data-neoverse-glass-occluder={modal ? 'topmost' : undefined}
      data-neoverse-glass-edge-pass={modal ? 'css' : undefined}
    >
      {children}
    </dialog>
  );
  if (!modal) return panel;

  return createPortal(
    <div
      className="ui-drawer__host"
      data-open={open ? 'true' : 'false'}
      data-side={side}
      inert={!open}
      style={
        width === undefined ? undefined : ({ '--neoverse-drawer-width': width } as CSSProperties)
      }
    >
      <div ref={backdrop} className="ui-drawer__backdrop" aria-hidden="true" />
      {panel}
    </div>,
    document.body,
  );
}
