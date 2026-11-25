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
  /** Defaults to compact, or action when action content is supplied. */
  presentation?: 'compact' | 'action' | 'notification';
  /** Auto-dismiss delay in milliseconds. Defaults to 4 seconds, or zero for notification. */
  duration?: number;
  action?: ReactNode;
  onOpenChange: (open: boolean) => void;
}

export function UiToast({
  open,
  message,
  dismissLabel,
  variant = 'neutral',
  presentation: requestedPresentation,
  duration: requestedDuration,
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
  const hasAction = action !== undefined && action !== null && typeof action !== 'boolean';
  const presentation = requestedPresentation ?? (hasAction ? 'action' : 'compact');
  const duration = requestedDuration ?? (presentation === 'notification' ? 0 : 4000);
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
        data-presentation={presentation}
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
        {hasAction && <div className="ui-toast__action">{action}</div>}
        {(presentation === 'notification' || duration <= 0) && (
          <button
            className="ui-toast__dismiss"
            type="button"
            aria-label={dismissLabel}
            onClick={() => onOpenChange(false)}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </UiPresence>
    </div>,
    document.body,
  );
}
