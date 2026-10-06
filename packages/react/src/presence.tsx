import {
  motionRoles,
  type PresenceOrigin,
  type PresenceVariant,
  presenceAppearClassName,
  presenceDataAttribute,
  presenceOriginAttribute,
  presenceVanishClassName,
} from '@neoverse-ui/motion';
import {
  createElement,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

const fallbackExitDurationMs = 400;
const exitDurationBufferMs = 50;

function readExitDuration(node: HTMLElement): number | undefined {
  const raw = window.getComputedStyle(node).getPropertyValue(motionRoles.exit.duration).trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return undefined;
  if (raw.endsWith('ms')) return value;
  if (raw.endsWith('s')) return value * 1000;
  return undefined;
}

export interface UiPresenceState {
  /** False once the exit animation finished and the element can unmount. */
  mounted: boolean;
  /** True while the exit animation is on screen; bind the vanish class. */
  leaving: boolean;
  /** Ref callback that observes the exit animation. */
  ref: (node: HTMLElement | null) => void;
}

/**
 * Animation-driven presence for React. Mounting plays the shared `nv-appear`
 * entrance; toggling off plays `nv-vanish` and unmounts on animationend.
 * Both animations read the same preset variables as the CSS presence engine,
 * so React and Vue elements move identically.
 */
export function useUiPresence(open: boolean): UiPresenceState {
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);
  const nodeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    setLeaving(true);
  }, [open]);

  useEffect(() => {
    if (!leaving) return;

    const node = nodeRef.current;
    const finish = () => {
      setMounted(false);
      setLeaving(false);
    };

    if (node === null) {
      finish();
      return;
    }

    const duration = readExitDuration(node) ?? fallbackExitDurationMs;
    const timer = window.setTimeout(finish, duration + exitDurationBufferMs);
    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target !== node || event.animationName !== presenceVanishClassName) return;
      window.clearTimeout(timer);
      finish();
    };

    node.addEventListener('animationend', handleAnimationEnd);
    return () => {
      window.clearTimeout(timer);
      node.removeEventListener('animationend', handleAnimationEnd);
    };
  }, [leaving]);

  const ref = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);

  return { mounted, leaving, ref };
}

export interface UiPresenceProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  show: boolean;
  variant?: PresenceVariant;
  origin?: PresenceOrigin;
  as?: 'div' | 'span' | 'li' | 'ul' | 'ol' | 'nav' | 'section';
  children: ReactNode;
}

/** Declarative wrapper: children mount with an entrance and exit along the same path. */
export function UiPresence({
  show,
  variant = 'fade',
  origin,
  as = 'div',
  className,
  children,
  ...rest
}: UiPresenceProps) {
  const { mounted, leaving, ref } = useUiPresence(show);

  if (!mounted) return null;

  return createElement(
    as,
    {
      ...rest,
      ref,
      [presenceDataAttribute]: variant,
      ...(origin === undefined ? {} : { [presenceOriginAttribute]: origin }),
      className: [presenceAppearClassName, leaving ? presenceVanishClassName : '', className]
        .filter(Boolean)
        .join(' '),
    },
    children,
  );
}
