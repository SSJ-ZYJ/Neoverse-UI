import {
  type FocusEvent,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { NoticeVariant } from './index.js';
import { UiPresence } from './presence.js';

export interface UiToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  open: boolean;
  message: string;
  dismissLabel: string;
  variant?: NoticeVariant;
  duration?: number;
  action?: ReactNode;
  onOpenChange: (open: boolean) => void;
}

export function UiToast({
  open,
  message,
  dismissLabel,
  variant = 'neutral',
  duration = 4000,
  action,
  onOpenChange,
  className,
  children,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...rest
}: UiToastProps) {
  const [mounted, setMounted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callback = useRef(onOpenChange);
  callback.current = onOpenChange;
  const pause = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  const resume = useCallback(() => {
    pause();
    if (open && duration > 0) {
      timer.current = setTimeout(() => callback.current(false), duration);
    }
  }, [open, duration, pause]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    resume();
    return pause;
  }, [resume, pause]);

  if (!mounted) return null;
  return createPortal(
    <div className="ui-toast-container">
      <UiPresence
        {...rest}
        show={open}
        variant="rise"
        className={['ui-toast material-glass-elevated', `ui-toast--${variant}`, className]
          .filter(Boolean)
          .join(' ')}
        data-surface="glass-elevated"
        data-neoverse-glass-occluder="topmost"
        data-neoverse-surface-overflow="visible"
        data-neoverse-surface-hover="static"
        role={variant === 'danger' ? 'alert' : 'status'}
        onPointerEnter={(event: PointerEvent<HTMLDivElement>) => {
          pause();
          onPointerEnter?.(event);
        }}
        onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
          resume();
          onPointerLeave?.(event);
        }}
        onFocus={(event: FocusEvent<HTMLDivElement>) => {
          pause();
          onFocus?.(event);
        }}
        onBlur={(event: FocusEvent<HTMLDivElement>) => {
          resume();
          onBlur?.(event);
        }}
      >
        <span className="ui-toast__indicator" aria-hidden="true" />
        <div className="ui-toast__message">{children ?? message}</div>
        {action}
        <button
          className="ui-toast__dismiss"
          type="button"
          aria-label={dismissLabel}
          onClick={() => onOpenChange(false)}
        >
          <span aria-hidden="true">×</span>
        </button>
      </UiPresence>
    </div>,
    document.body,
  );
}
