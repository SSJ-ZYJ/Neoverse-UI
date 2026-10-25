import { acquireNativeScrollbarHiding } from '@neoverse-ui/overlay-runtime';
import { type HTMLAttributes, useEffect, useRef, useState } from 'react';

export interface UiScrollbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  autoHideMs?: number;
  minThumbRatio?: number;
  refreshKey?: string | number;
  hideNative?: boolean;
}

export function UiScrollbar({
  autoHideMs = 1200,
  minThumbRatio = 0.1,
  refreshKey,
  hideNative = true,
  className = '',
  style,
  ...rest
}: UiScrollbarProps) {
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const refresh = useRef<() => void>(() => undefined);
  const [state, setState] = useState({ visible: false, dragging: false, ratio: 1, progress: 0 });
  useEffect(() => {
    const trackNode = track.current;
    const thumbNode = thumb.current;
    if (!trackNode || !thumbNode) return;
    const scrollElement = (document.scrollingElement ?? document.documentElement) as HTMLElement;
    const autoHide = Number.isFinite(autoHideMs) ? Math.max(0, autoHideMs) : 1200;
    const minimum = Number.isFinite(minThumbRatio)
      ? Math.min(1, Math.max(0.05, minThumbRatio))
      : 0.1;
    let dragging = false;
    let dragOffset = 0;
    let activePointer: number | undefined;
    let previousBehavior: string | undefined;
    let behaviorPriority = '';
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    let visible = false;
    const releaseNative = hideNative ? acquireNativeScrollbarHiding() : () => undefined;
    const metrics = () => {
      const rect = trackNode.getBoundingClientRect();
      const trackHeight = rect.height || window.innerHeight;
      const viewport = Math.max(window.innerHeight, scrollElement.clientHeight);
      const content = Math.max(
        scrollElement.scrollHeight,
        document.documentElement.scrollHeight,
        document.body?.scrollHeight ?? 0,
        viewport,
      );
      const max = Math.max(content - viewport, 0);
      const ratio = Math.min(1, Math.max(viewport / content, minimum));
      return {
        top: rect.height ? rect.top : 0,
        trackHeight,
        max,
        ratio,
        travel: trackHeight * (1 - ratio),
      };
    };
    const update = () => {
      const measurement = metrics();
      const next = {
        visible: visible && measurement.max > 1 && measurement.trackHeight > 0,
        dragging,
        ratio: measurement.max > 1 ? measurement.ratio : 1,
        progress:
          measurement.max > 0
            ? Math.min(1, Math.max(window.scrollY || scrollElement.scrollTop, 0) / measurement.max)
            : 0,
      };
      setState((previous) =>
        previous.visible === next.visible &&
        previous.dragging === next.dragging &&
        previous.ratio === next.ratio &&
        previous.progress === next.progress
          ? previous
          : next,
      );
    };
    const show = () => {
      visible = true;
      clearTimeout(hideTimer);
      update();
      if (autoHide > 0 && !dragging)
        hideTimer = setTimeout(() => {
          visible = false;
          update();
        }, autoHide);
    };
    const setTop = (top: number) => {
      window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'auto' });
      scrollElement.scrollTop = Math.max(0, top);
    };
    const restoreBehavior = () => {
      if (previousBehavior === undefined) return;
      if (previousBehavior)
        scrollElement.style.setProperty('scroll-behavior', previousBehavior, behaviorPriority);
      else scrollElement.style.removeProperty('scroll-behavior');
      previousBehavior = undefined;
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      const rect = thumbNode.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientY > rect.bottom) return;
      event.preventDefault();
      dragging = true;
      activePointer = event.pointerId;
      dragOffset = event.clientY - rect.top;
      previousBehavior = scrollElement.style.getPropertyValue('scroll-behavior');
      behaviorPriority = scrollElement.style.getPropertyPriority('scroll-behavior');
      scrollElement.style.setProperty('scroll-behavior', 'auto');
      thumbNode.setPointerCapture?.(event.pointerId);
      show();
    };
    const move = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== activePointer) return;
      const measurement = metrics();
      if (measurement.travel <= 0) return;
      setTop(
        Math.min(
          1,
          Math.max(0, (event.clientY - measurement.top - dragOffset) / measurement.travel),
        ) * measurement.max,
      );
      show();
    };
    const finish = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== activePointer) return;
      dragging = false;
      if (thumbNode.hasPointerCapture?.(event.pointerId))
        thumbNode.releasePointerCapture(event.pointerId);
      activePointer = undefined;
      restoreBehavior();
      show();
    };
    const trackDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const measurement = metrics();
      if (measurement.travel <= 0) return;
      event.preventDefault();
      setTop(
        Math.min(
          1,
          Math.max(
            0,
            (event.clientY - measurement.top - (measurement.trackHeight * measurement.ratio) / 2) /
              measurement.travel,
          ),
        ) * measurement.max,
      );
      show();
    };
    const queueUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    refresh.current = () => {
      clearTimeout(refreshTimer);
      show();
      refreshTimer = setTimeout(show, 1200);
    };
    show();
    window.addEventListener('scroll', show, { passive: true });
    window.addEventListener('resize', show);
    window.addEventListener('keydown', show);
    trackNode.addEventListener('pointerdown', trackDown);
    thumbNode.addEventListener('pointerdown', down);
    thumbNode.addEventListener('pointermove', move);
    thumbNode.addEventListener('pointerup', finish);
    thumbNode.addEventListener('pointercancel', finish);
    thumbNode.addEventListener('lostpointercapture', finish);
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
    resize?.observe(document.documentElement);
    if (document.body) resize?.observe(document.body);
    const mutation =
      typeof MutationObserver === 'undefined' ? undefined : new MutationObserver(queueUpdate);
    if (document.body) mutation?.observe(document.body, { childList: true, subtree: true });
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(refreshTimer);
      cancelAnimationFrame(frame);
      resize?.disconnect();
      mutation?.disconnect();
      restoreBehavior();
      releaseNative();
      window.removeEventListener('scroll', show);
      window.removeEventListener('resize', show);
      window.removeEventListener('keydown', show);
      trackNode.removeEventListener('pointerdown', trackDown);
      thumbNode.removeEventListener('pointerdown', down);
      thumbNode.removeEventListener('pointermove', move);
      thumbNode.removeEventListener('pointerup', finish);
      thumbNode.removeEventListener('pointercancel', finish);
      thumbNode.removeEventListener('lostpointercapture', finish);
      if (activePointer !== undefined && thumbNode.hasPointerCapture?.(activePointer))
        thumbNode.releasePointerCapture(activePointer);
      refresh.current = () => undefined;
    };
  }, [autoHideMs, minThumbRatio, hideNative]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey is the consumer's explicit request to remeasure document layout.
  useEffect(() => {
    refresh.current();
  }, [refreshKey]);
  return (
    <div
      {...rest}
      ref={track}
      className={`ui-scrollbar${state.dragging ? ' ui-scrollbar--dragging' : ''} ${className}`}
      style={{
        ...style,
        opacity: state.visible ? 1 : 0,
        pointerEvents: state.visible ? 'auto' : 'none',
      }}
      data-visible={state.visible ? 'true' : 'false'}
      aria-hidden="true"
    >
      <div
        ref={thumb}
        className="ui-scrollbar__thumb"
        style={{
          height: `${state.ratio * 100}%`,
          top: `${state.progress * (100 - state.ratio * 100)}%`,
        }}
      />
    </div>
  );
}
