import { getSurfaceClass, type MaterialSurfaceRole, type SurfacePreset } from '@neoverse-ui/tokens';
import {
  type CSSProperties,
  createElement,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  type TransitionEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

export type ControlSurfaceScale = 'md' | 'lg';
export type SurfaceHoverMode = 'auto' | 'static';
export type SurfaceEdgeMode = 'auto' | 'local';

export interface UiControlSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: string | ElementType;
  surface?: SurfacePreset;
  scale?: ControlSurfaceScale;
  hoverMode?: SurfaceHoverMode;
  edgeMode?: SurfaceEdgeMode;
  navigationIndicator?: boolean;
  trailing?: ReactNode;
}

type ControlSurfaceCompositionProps = UiControlSurfaceProps & {
  /** Material role of the enclosing adapter; standalone groups use the default. */
  surfaceRole?: MaterialSurfaceRole;
};

type IndicatorRect = { left: number; top: number; width: number; height: number };

// A stable style object keeps React from rewriting the visibility the
// measurement writes imperatively on every re-render.
const indicatorHiddenStyle: CSSProperties = { visibility: 'hidden' };

const sameIndicatorRect = (first: IndicatorRect, second: IndicatorRect): boolean =>
  first.left === second.left &&
  first.top === second.top &&
  first.width === second.width &&
  first.height === second.height;

const writeIndicatorGeometry = (element: HTMLElement, rect: IndicatorRect): void => {
  element.style.left = `${rect.left}px`;
  element.style.top = `${rect.top}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
  element.style.transform = '';
  element.style.visibility = 'visible';
};

// The commit must land while the transform transition is disabled; otherwise
// restoring the base geometry retargets the flight back toward the old item.
const commitIndicator = (element: HTMLElement, rect: IndicatorRect): void => {
  element.style.transition = 'none';
  writeIndicatorGeometry(element, rect);
  void element.offsetWidth;
  element.style.transition = '';
};

const indicatorTransitionDisabled = (element: HTMLElement): boolean =>
  getComputedStyle(element)
    .transitionDuration.split(',')
    .every((value) => Number.parseFloat(value) === 0);

export function UiControlSurface({
  as = 'div',
  surface = 'auto',
  surfaceRole = 'group',
  scale = 'md',
  hoverMode = 'auto',
  edgeMode = 'auto',
  navigationIndicator = false,
  trailing,
  children,
  className = '',
  ...rest
}: ControlSurfaceCompositionProps) {
  const primary = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  // Committed geometry lives in left/top/width/height; the flight between
  // selections is a compositor translate away from that base, so the indicator
  // never runs per-frame layout inside a glass surface. The destination size is
  // committed before the flight, keeping one bar of constant painted length.
  const indicatorBase = useRef<IndicatorRect | undefined>(undefined);
  const indicatorTarget = useRef<IndicatorRect | undefined>(undefined);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const group = primary.current;
    setReady(false);
    indicatorBase.current = undefined;
    indicatorTarget.current = undefined;
    if (!navigationIndicator || !group) return;
    let frame = 0;
    let readyFrame = 0;
    const measure = () => {
      const element = indicator.current;
      const marker = group.querySelector<HTMLElement>(
        '.ui-navigation-item--active .ui-navigation-item__indicator',
      );
      if (!marker || !element) {
        indicatorBase.current = undefined;
        indicatorTarget.current = undefined;
        setReady(false);
        if (element) {
          element.style.visibility = 'hidden';
          element.style.transform = '';
        }
        return;
      }
      // The committed geometry lives in the group's own layout pixels, but the
      // measured marker rect includes every rendered scale above it: CSS `zoom`
      // and any ancestor `scale` transform. A visually magnified preview keeps
      // its layout at 100%, so both must be divided out or the indicator is
      // offset and sized twice and leaves the clipping group.
      let zoom = 1;
      for (let element: HTMLElement | null = group; element; element = element.parentElement) {
        const style = getComputedStyle(element);
        const factor = Number.parseFloat(style.zoom);
        if (Number.isFinite(factor) && factor > 0) zoom *= factor;
        const rendered = Number.parseFloat((style.scale || '1').split(/\s+/)[0] ?? '1');
        if (Number.isFinite(rendered) && rendered > 0) zoom *= rendered;
      }
      const origin = group.getBoundingClientRect();
      const rect = marker.getBoundingClientRect();
      const target = {
        left: (rect.left - origin.left) / zoom,
        top: (rect.top - origin.top) / zoom,
        width: rect.width / zoom,
        height: rect.height / zoom,
      };
      indicatorTarget.current = target;
      const base = indicatorBase.current;
      if (!base) {
        writeIndicatorGeometry(element, target);
        indicatorBase.current = target;
        cancelAnimationFrame(readyFrame);
        readyFrame = requestAnimationFrame(() => setReady(true));
        return;
      }
      if (sameIndicatorRect(target, base)) {
        // Returning to the committed item: CSS interpolates the flight back to none.
        if (element.style.transform !== '') element.style.transform = '';
        return;
      }
      if (base.width === 0 || base.height === 0 || indicatorTransitionDisabled(element)) {
        commitIndicator(element, target);
        indicatorBase.current = target;
        return;
      }
      const translateX = target.left - base.left;
      const translateY = target.top - base.top;
      // Take the destination size before the flight, then move only the
      // position. Scaling between markers would stretch the same bar
      // mid-flight and read as a drag instead of one bar travelling its path.
      if (
        Math.abs(target.width - base.width) > 0.5 ||
        Math.abs(target.height - base.height) > 0.5
      ) {
        element.style.width = `${target.width}px`;
        element.style.height = `${target.height}px`;
      }
      element.style.transform = `translate(${translateX}px, ${translateY}px)`;
    };
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    const observe = () => {
      resize?.disconnect();
      resize?.observe(group);
      for (const item of group.querySelectorAll('.ui-navigation-item')) resize?.observe(item);
    };
    const mutation =
      typeof MutationObserver === 'undefined'
        ? undefined
        : new MutationObserver((records) => {
            if (
              records.every((record) =>
                (record.target as HTMLElement).classList?.contains('ui-control-surface__indicator'),
              )
            )
              return;
            observe();
            measure();
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
          });
    observe();
    mutation?.observe(group, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'aria-current'],
    });
    measure();
    return () => {
      resize?.disconnect();
      mutation?.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(readyFrame);
    };
  }, [navigationIndicator]);
  const settleIndicator = (event: TransitionEvent<HTMLSpanElement>) => {
    if (event.propertyName !== 'transform' || event.target !== indicator.current) return;
    const element = indicator.current;
    const target = indicatorTarget.current;
    const base = indicatorBase.current;
    if (!element || !target || !base) return;
    if (sameIndicatorRect(target, base) && element.style.transform === '') return;
    commitIndicator(element, target);
    indicatorBase.current = target;
  };
  return createElement(
    as,
    {
      ...rest,
      className: `ui-control-surface ${getSurfaceClass(surface, surfaceRole)} ui-control-surface--scale-${scale}${navigationIndicator ? ' ui-control-surface--shared-indicator' : ''} ${className}`,
      'data-surface': surface,
      'data-neoverse-navigation-indicator-ready': navigationIndicator && ready ? 'true' : undefined,
      'data-neoverse-surface-hover': hoverMode === 'static' ? 'static' : undefined,
      'data-neoverse-glass-edge-pass': edgeMode === 'local' ? 'css' : undefined,
    },
    <>
      <div ref={primary} className="ui-control-surface__group ui-control-surface__group--primary">
        {children}
        {navigationIndicator ? (
          <span
            ref={indicator}
            className="ui-control-surface__indicator"
            style={indicatorHiddenStyle}
            data-ready={ready}
            aria-hidden="true"
            onTransitionEnd={settleIndicator}
          />
        ) : null}
      </div>
      {trailing != null ? (
        <>
          <span className="ui-control-surface__divider" aria-hidden="true" />
          <div className="ui-control-surface__group ui-control-surface__group--trailing">
            {trailing}
          </div>
        </>
      ) : null}
    </>,
  );
}
