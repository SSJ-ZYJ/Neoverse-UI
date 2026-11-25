import { motionEasings } from './motion-tokens.js';

export const pageTransitionVariants = [
  'fade',
  'glide',
  'slide',
  'push',
  'depth',
  'veil',
  'curtain',
  'iris',
  'morph',
  'dissolve',
] as const;

export type PageTransitionVariant = (typeof pageTransitionVariants)[number];

export const pageTransitionDirections = ['forward', 'backward', 'up', 'down'] as const;

export type PageTransitionDirection = (typeof pageTransitionDirections)[number];

export type PageTransitionScope = 'auto' | 'document' | 'region';

export type PageTransitionBackgroundMode = 'auto' | 'shared' | 'surface';

export type PageTransitionOrigin = Element | { readonly x: number; readonly y: number };

/**
 * Whole-page choreography presets intentionally animate the entire surface
 * container or document even when incoming and outgoing backgrounds match.
 */
export const wholePageTransitionVariants = [
  'slide',
  'push',
  'curtain',
  'iris',
  'dissolve',
] as const;

export function isWholePageTransitionVariant(variant: PageTransitionVariant | 'none'): boolean {
  return (wholePageTransitionVariants as readonly string[]).includes(variant);
}

export function supportsAnimatedMask(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as Window & { CSS?: { registerProperty?: unknown } }).CSS?.registerProperty ===
      'function'
  );
}

export function isUsableRegionTarget(
  element: HTMLElement | null | undefined,
): element is HTMLElement {
  if (!element?.isConnected) return false;
  if (typeof element.getClientRects === 'function') {
    return element.getClientRects().length > 0;
  }
  return true;
}

export function resolveRegionMetrics(
  scope: 'document' | 'region',
  target: HTMLElement | null,
): { left: number; top: number; width: number; height: number } {
  if (scope === 'region' && target && typeof target.getBoundingClientRect === 'function') {
    const rect = target.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect;
  }
  const width = typeof window !== 'undefined' ? window.innerWidth || 0 : 0;
  const height = typeof window !== 'undefined' ? window.innerHeight || 0 : 0;
  return { left: 0, top: 0, width, height };
}

export function resolveIrisCoordinates(
  origin: PageTransitionOrigin | null | undefined,
  bounds: { left: number; top: number; width: number; height: number },
): { x: number; y: number; radius: number } {
  let x = bounds.width / 2;
  let y = bounds.height / 2;

  if (origin && 'getBoundingClientRect' in origin) {
    const box = origin.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) {
      x = box.left + box.width / 2 - bounds.left;
      y = box.top + box.height / 2 - bounds.top;
    }
  } else if (origin && 'x' in origin && 'y' in origin) {
    x = origin.x - bounds.left;
    y = origin.y - bounds.top;
  }

  const radius = Math.hypot(
    Math.max(Math.abs(x), Math.abs(bounds.width - x)),
    Math.max(Math.abs(y), Math.abs(bounds.height - y)),
  );
  return { x, y, radius: Math.max(1, Math.ceil(radius)) };
}

function readTimeToken(root: HTMLElement, variable: string, fallbackMs: number): number {
  if (typeof getComputedStyle !== 'function') return fallbackMs;
  const raw = getComputedStyle(root).getPropertyValue(variable).trim();
  const amount = Number.parseFloat(raw);
  if (!Number.isFinite(amount) || amount <= 0) return fallbackMs;
  if (raw.endsWith('ms')) return amount;
  if (raw.endsWith('s')) return amount * 1000;
  return fallbackMs;
}

export function readPageExpressiveDuration(root: HTMLElement): number {
  return readTimeToken(root, '--neoverse-motion-page-expressive-duration', 520);
}

function isRtlDocument(root: HTMLElement): boolean {
  if (typeof getComputedStyle === 'function') {
    return getComputedStyle(root).direction === 'rtl';
  }
  return root.getAttribute?.('dir') === 'rtl';
}

export function buildFallbackKeyframes(
  root: HTMLElement,
  target: HTMLElement,
  variant: Exclude<PageTransitionVariant, 'dissolve'>,
  direction: PageTransitionDirection,
  origin: PageTransitionOrigin | null | undefined,
): { keyframes: Keyframe[]; duration: number; easing: string } {
  const rtl = isRtlDocument(root);
  const inlineSign =
    direction === 'forward' ? (rtl ? -1 : 1) : direction === 'backward' ? (rtl ? 1 : -1) : 0;
  const blockSign = direction === 'up' ? 1 : direction === 'down' ? -1 : 0;
  const standardMs = readTimeToken(root, '--neoverse-motion-page-duration', 360);
  const expressiveMs = readTimeToken(root, '--neoverse-motion-page-expressive-duration', 520);

  if (variant === 'glide') {
    const distance = readTimeToken(root, '--neoverse-motion-page-glide-distance', 16);
    return {
      keyframes: [
        {
          opacity: 0,
          transform: `translate3d(${inlineSign * distance}px, ${blockSign * distance}px, 0)`,
        },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ],
      duration: standardMs,
      easing: motionEasings.emphasized,
    };
  }
  if (variant === 'slide' || variant === 'push') {
    return {
      keyframes: [
        { opacity: 0.75, transform: `translate3d(${inlineSign * 100}%, ${blockSign * 100}%, 0)` },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ],
      duration: standardMs,
      easing: motionEasings.emphasized,
    };
  }
  if (variant === 'depth') {
    const startScale = direction === 'backward' || direction === 'down' ? 0.985 : 1.02;
    return {
      keyframes: [
        { opacity: 0, transform: `scale(${startScale})` },
        { opacity: 1, transform: 'scale(1)' },
      ],
      duration: standardMs,
      easing: motionEasings.emphasized,
    };
  }
  if (variant === 'veil') {
    return {
      keyframes: [
        { opacity: 0, transform: 'scale(0.99)', filter: 'blur(8px)' },
        { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
      ],
      duration: expressiveMs,
      easing: motionEasings.emphasized,
    };
  }
  if (variant === 'curtain') {
    const fromClip =
      inlineSign > 0
        ? 'inset(0% 100% 0% 0%)'
        : inlineSign < 0
          ? 'inset(0% 0% 0% 100%)'
          : blockSign > 0
            ? 'inset(100% 0% 0% 0%)'
            : 'inset(0% 0% 100% 0%)';
    return {
      keyframes: [{ clipPath: fromClip }, { clipPath: 'inset(0% 0% 0% 0%)' }],
      duration: expressiveMs,
      easing: 'cubic-bezier(0.37, 0, 0.63, 1)',
    };
  }
  if (variant === 'iris') {
    const bounds = resolveRegionMetrics('region', target);
    const { x, y, radius } = resolveIrisCoordinates(origin, bounds);
    return {
      keyframes: [
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(${radius}px at ${x}px ${y}px)` },
      ],
      duration: expressiveMs,
      easing: motionEasings.emphasized,
    };
  }
  return {
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    duration: standardMs,
    easing: motionEasings.standard,
  };
}
