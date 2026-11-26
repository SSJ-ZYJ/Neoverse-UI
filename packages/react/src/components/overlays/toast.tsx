import {
  presenceAppearClassName,
  presenceDataAttribute,
  presenceVanishClassName,
} from '@neoverse-ui/motion';
import { bridgePortalMaterialScope } from '@neoverse-ui/overlay-runtime';
import { getSurfaceClass } from '@neoverse-ui/tokens';
import {
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { NoticeVariant } from '../display/notice.js';
import { useUiPresence } from '../motion/presence.js';

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
  ...rest
}: UiToastProps) {
  const hasAction = action !== undefined && action !== null && typeof action !== 'boolean';
  const presentation = requestedPresentation ?? (hasAction ? 'action' : 'compact');
  const duration = requestedDuration ?? (presentation === 'notification' ? 0 : 4000);
  const [mounted, setMounted] = useState(false);
  const presence = useUiPresence(open);
  const materialSource = useRef<HTMLSpanElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
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
  useEffect(() => {
    const node = frame.current;
    if (!presence.mounted || !node) return;
    const handleFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && node.contains(event.relatedTarget)) return;
      resume();
    };
    node.addEventListener('pointerenter', pause);
    node.addEventListener('pointerleave', resume);
    node.addEventListener('focusin', pause);
    node.addEventListener('focusout', handleFocusOut);
    return () => {
      node.removeEventListener('pointerenter', pause);
      node.removeEventListener('pointerleave', resume);
      node.removeEventListener('focusin', pause);
      node.removeEventListener('focusout', handleFocusOut);
    };
  }, [presence.mounted, pause, resume]);
  useLayoutEffect(() => {
    // Keep the invocation scope while mounted so the exit animation never
    // repaints from Solid back to the Glass tier.
    if (mounted && materialSource.current && host.current) {
      return bridgePortalMaterialScope(materialSource.current, host.current);
    }
  }, [mounted]);

  if (!mounted) return null;
  const motionClassName = [presenceAppearClassName, presence.leaving ? presenceVanishClassName : '']
    .filter(Boolean)
    .join(' ');
  const motionProps = { [presenceDataAttribute]: 'rise' } as const;
  const portal = createPortal(
    <div ref={host} className="ui-toast-container">
      {presence.mounted && (
        <div
          {...rest}
          ref={frame}
          className={['ui-toast', `ui-toast--${variant}`, className].filter(Boolean).join(' ')}
          data-presentation={presentation}
          role={variant === 'danger' ? 'alert' : 'status'}
        >
          <div
            {...motionProps}
            ref={presence.ref}
            className={`ui-toast__surface ${getSurfaceClass('auto', 'overlay')} ${motionClassName}`}
            data-surface="auto"
            data-neoverse-glass-occluder="topmost"
            data-neoverse-surface-overflow="visible"
            data-neoverse-surface-hover="static"
          >
            <span className="ui-toast__indicator" aria-hidden="true" />
            <div className="ui-toast__message">{children ?? message}</div>
            {hasAction && <div className="ui-toast__action">{action}</div>}
          </div>
          <button
            {...motionProps}
            className={`ui-toast__dismiss ${getSurfaceClass('auto', 'overlay')} ${motionClassName}`}
            type="button"
            data-surface="auto"
            data-neoverse-glass-occluder="topmost"
            data-neoverse-surface-overflow="visible"
            data-neoverse-surface-hover="static"
            aria-label={dismissLabel}
            onClick={() => onOpenChange(false)}
          >
            <span className="ui-toast__dismiss-wash" aria-hidden="true" />
            <svg
              className="ui-toast__dismiss-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
  return (
    <>
      <span hidden ref={materialSource} />
      {portal}
    </>
  );
}
