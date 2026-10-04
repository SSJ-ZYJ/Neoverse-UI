import { nextTick, ref } from 'vue';
import type { FrameTheme, ThemeMode } from './playground-types';

const systemThemeQuery = '(prefers-color-scheme: dark)';
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
const themeTransitionAttribute = 'data-neoverse-theme-transitioning';
const themeViewTransitionAttribute = 'data-neoverse-theme-view-transitioning';
const fallbackThemeTransitionDuration = 420;
const themeTransitionCleanupBuffer = 32;

let themeTransitionFrame: number | undefined;
let themeTransitionTimeout: number | undefined;
let activeThemeViewTransition: ViewTransition | undefined;
let themeTransitionRequest = 0;

function readSystemTheme(): FrameTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia(systemThemeQuery).matches ? 'dark' : 'light';
}

function readDocumentTheme(): FrameTheme {
  if (typeof document === 'undefined') {
    return readSystemTheme();
  }

  const explicitTheme = document.documentElement.dataset.theme;
  if (explicitTheme === 'light' || explicitTheme === 'dark') {
    return explicitTheme;
  }

  return readSystemTheme();
}

export const resolvedTheme = ref<FrameTheme>(readDocumentTheme());

export function syncResolvedThemeFromDocument(): void {
  resolvedTheme.value = readDocumentTheme();
}

function clearScheduledThemeTransition(root: HTMLElement): void {
  activeThemeViewTransition?.skipTransition();
  activeThemeViewTransition = undefined;
  root.removeAttribute(themeViewTransitionAttribute);

  if (themeTransitionFrame !== undefined) {
    window.cancelAnimationFrame(themeTransitionFrame);
    themeTransitionFrame = undefined;
  }

  if (themeTransitionTimeout !== undefined) {
    window.clearTimeout(themeTransitionTimeout);
    themeTransitionTimeout = undefined;
  }

  root.removeAttribute(themeTransitionAttribute);
}

function shouldReduceMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(reducedMotionQuery).matches;
}

function readThemeTransitionDuration(root: HTMLElement): number {
  const duration = window
    .getComputedStyle(root)
    .getPropertyValue('--neoverse-motion-theme-fallback-duration')
    .trim();
  const value = Number.parseFloat(duration);

  if (!Number.isFinite(value)) {
    return fallbackThemeTransitionDuration;
  }

  if (duration.endsWith('ms')) {
    return value;
  }

  if (duration.endsWith('s')) {
    return value * 1000;
  }

  return fallbackThemeTransitionDuration;
}

function scheduleThemeTransitionCleanup(root: HTMLElement): void {
  themeTransitionTimeout = window.setTimeout(() => {
    root.removeAttribute(themeTransitionAttribute);
    themeTransitionTimeout = undefined;
  }, readThemeTransitionDuration(root) + themeTransitionCleanupBuffer);
}

function applyDocumentThemeMode(root: HTMLElement, value: ThemeMode): void {
  if (value === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.dataset.theme = value;
  }

  syncResolvedThemeFromDocument();
}

export function applyThemeMode(value: ThemeMode, animate = true): void {
  const root = document.documentElement;
  const request = ++themeTransitionRequest;
  clearScheduledThemeTransition(root);

  if (!animate || shouldReduceMotion()) {
    applyDocumentThemeMode(root, value);
    return;
  }

  if (typeof document.startViewTransition === 'function') {
    root.setAttribute(themeViewTransitionAttribute, '');
    const transition = document.startViewTransition(async () => {
      if (request !== themeTransitionRequest) {
        return;
      }
      applyDocumentThemeMode(root, value);
      await nextTick();
    });
    activeThemeViewTransition = transition;
    const finish = (): void => {
      if (activeThemeViewTransition === transition) {
        activeThemeViewTransition = undefined;
        root.removeAttribute(themeViewTransitionAttribute);
      }
    };
    void transition.finished.then(finish, finish);
    return;
  }

  root.setAttribute(themeTransitionAttribute, '');
  themeTransitionFrame = window.requestAnimationFrame(() => {
    // Let the transition properties reach a painted frame before changing the
    // inherited text colors and theme tokens.
    themeTransitionFrame = window.requestAnimationFrame(() => {
      themeTransitionFrame = undefined;
      applyDocumentThemeMode(root, value);
      scheduleThemeTransitionCleanup(root);
    });
  });
}

export function observeSystemTheme(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const query = window.matchMedia(systemThemeQuery);
  const handleChange = (): void => {
    const root = document.documentElement;
    if (root.hasAttribute('data-theme')) {
      return;
    }

    clearScheduledThemeTransition(root);
    if (!shouldReduceMotion()) {
      root.setAttribute(themeTransitionAttribute, '');
      scheduleThemeTransitionCleanup(root);
    }
    syncResolvedThemeFromDocument();
  };

  query.addEventListener('change', handleChange);
  return () => query.removeEventListener('change', handleChange);
}
