import {
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { NoticeVariant } from './index';
import { UiPresence } from './presence';

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
  ...rest
}: UiToastProps) {
  const [mounted, setMounted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const element = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const node = element.current;
    if (!mounted || !node) return;
    node.addEventListener('pointerenter', pause);
    node.addEventListener('pointerleave', resume);
    node.addEventListener('focusin', pause);
    node.addEventListener('focusout', resume);
    return () => {
      node.removeEventListener('pointerenter', pause);
      node.removeEventListener('pointerleave', resume);
      node.removeEventListener('focusin', pause);
      node.removeEventListener('focusout', resume);
    };
  }, [mounted, pause, resume]);

  if (!mounted) return null;
  return createPortal(
    <UiPresence show={open} variant="rise" className="ui-toast-container">
      <div
        {...rest}
        ref={element}
        className={['ui-toast material-glass-immersive', `ui-toast--${variant}`, className]
          .filter(Boolean)
          .join(' ')}
        data-surface="glass-immersive"
        data-neoverse-glass-occluder="topmost"
        role={variant === 'danger' ? 'alert' : 'status'}
      >
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
      </div>
    </UiPresence>,
    document.body,
  );
}
