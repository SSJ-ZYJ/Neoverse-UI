import { type HTMLAttributes, useEffect, useRef } from 'react';

export interface UiTerminalTranscriptProps extends HTMLAttributes<HTMLElement> {
  label?: string;
  followTail?: boolean;
  density?: 'compact' | 'comfortable';
  live?: 'polite' | 'off';
}

export function UiTerminalTranscript({
  label = 'Terminal output',
  followTail = true,
  density = 'comfortable',
  live = 'polite',
  className = '',
  children,
  ...rest
}: UiTerminalTranscriptProps) {
  const scroller = useRef<HTMLElement>(null);
  const follow = useRef(followTail);
  const sync = useRef<() => void>(() => undefined);
  follow.current = followTail;
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    let shouldFollow = true;
    let pending = false;
    let disposed = false;
    let width = element.clientWidth;
    let height = element.clientHeight;
    const atBottom = () => element.scrollHeight - element.clientHeight - element.scrollTop <= 3;
    const syncTail = () => {
      if (!follow.current || !shouldFollow || pending) return;
      pending = true;
      queueMicrotask(() => {
        pending = false;
        if (!disposed && follow.current && shouldFollow) element.scrollTop = element.scrollHeight;
      });
    };
    sync.current = syncTail;
    const onScroll = () => {
      const resized = width !== element.clientWidth || height !== element.clientHeight;
      width = element.clientWidth;
      height = element.clientHeight;
      if (resized && shouldFollow) syncTail();
      else shouldFollow = atBottom();
    };
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) shouldFollow = false;
    };
    const onTouchMove = () => {
      shouldFollow = false;
    };
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest('input, textarea, [contenteditable="true"]'))
        return;
      if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) shouldFollow = false;
    };
    if (follow.current) element.scrollTop = element.scrollHeight;
    shouldFollow = atBottom();
    element.addEventListener('scroll', onScroll, { passive: true });
    element.addEventListener('wheel', onWheel, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: true });
    element.addEventListener('keydown', onKeydown);
    const resize =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => {
            width = element.clientWidth;
            height = element.clientHeight;
            syncTail();
          });
    const observe = () => {
      resize?.disconnect();
      resize?.observe(element);
      for (const child of element.children) resize?.observe(child);
    };
    const mutation =
      typeof MutationObserver === 'undefined'
        ? undefined
        : new MutationObserver(() => {
            observe();
            syncTail();
          });
    mutation?.observe(element, { childList: true, subtree: true, characterData: true });
    observe();
    return () => {
      disposed = true;
      mutation?.disconnect();
      resize?.disconnect();
      element.removeEventListener('scroll', onScroll);
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('keydown', onKeydown);
      sync.current = () => undefined;
    };
  }, []);
  useEffect(() => {
    if (followTail) sync.current();
  }, [followTail]);
  return (
    <section
      {...rest}
      ref={scroller}
      className={`ui-terminal-transcript scrollbar-immersive ${className}`}
      data-density={density}
      aria-label={label}
    >
      <div role="log" aria-live={live} aria-relevant="additions text" aria-atomic="false">
        {children}
      </div>
    </section>
  );
}
